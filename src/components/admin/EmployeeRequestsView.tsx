import { useEffect, useMemo, useState } from 'react'
import { Company, EmployeeRequest, UserRole, User } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { addMembershipToUserFirestore } from '@/lib/membership'

interface EmployeeRequestsViewProps {
  company: Company
  currentUser: User
  requests: EmployeeRequest[]
  onUpdateStatus: (id: string, status: EmployeeRequest['status']) => void
  onApproveAsRole: (
    req: EmployeeRequest,
    role: Exclude<UserRole, 'customer'>,
  ) => void
  onBackToOverview: () => void
}

export default function EmployeeRequestsView({
  company,
  currentUser,
  onUpdateStatus,
  onApproveAsRole,
  onBackToOverview,
}: EmployeeRequestsViewProps) {
  const isOwner = currentUser.id === company.ownerId

  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<EmployeeRequest[]>([])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const q = query(
        collection(db, 'employeeRequests'),
        where('companyId', '==', company.id),
      )
      const snap = await getDocs(q)
      const loaded: EmployeeRequest[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as any),
      }))
      setRequests(loaded)
      console.log(
        'EmployeeRequestsView loaded from Firestore:',
        loaded.length,
        loaded,
      )
    } catch (e) {
      console.error('EmployeeRequestsView failed to load from Firestore', e)
      toast.error('Gagal memuat permintaan karyawan')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [company.id])

  const pending = useMemo(
    () => requests.filter(r => r.status === 'pending'),
    [requests],
  )
  const processed = useMemo(
    () => requests.filter(r => r.status !== 'pending'),
    [requests],
  )

  const handleReject = async (reqId: string) => {
    if (!isOwner) return
    try {
      await updateDoc(doc(db, 'employeeRequests', reqId), { status: 'rejected' })
      onUpdateStatus(reqId, 'rejected')
      toast.success('Permintaan ditolak')
      loadRequests()
    } catch (e) {
      console.error('Failed to reject request', e)
      toast.error('Gagal menolak permintaan')
    }
  }

  const handleApprove = async (
  req: EmployeeRequest,
  role: Exclude<UserRole, 'customer'>,
) => {
  if (!isOwner) return

  console.log('Approving employee request:', {
    requestId: req.id,
    userId: req.userId,
    companyId: company.id,
    role,
  })

  try {
    // STEP 1: Update membership user pelamar di Firestore (FIRST)
    const membership = {
      companyId: company.id,
      role,
      joinedAt: new Date().toISOString(),
    } as const

    try {
      await addMembershipToUserFirestore(req.userId, membership)
      console.log('✓ Membership updated successfully:', {
        userId: req.userId,
        companyId: company.id,
        role,
      })
    } catch (e) {
      console.error('Failed to update membership:', {
        requestId: req.id,
        userId: req.userId,
        companyId: company.id,
        role,
        error: e,
      })
      toast.error(
        'Gagal memperbarui membership pengguna. Permintaan tidak disetujui.',
      )
      throw e // Stop here, don't proceed
    }

    // STEP 2: If courier, ensure couriers doc exists (SECOND)
    if (role === 'courier') {
      try {
        const existingSnap = await getDocs(
          query(
            collection(db, 'couriers'),
            where('userId', '==', req.userId),
            where('companyId', '==', company.id),
          ),
        )

        if (existingSnap.empty) {
          // Ensure no undefined values in courier doc
          const courierData = {
            name: req.userName || req.userEmail || 'Kurir',
            capacity: 40,
            active: true,
            companyId: company.id,
            userId: req.userId,
          }
          await addDoc(collection(db, 'couriers'), courierData)
          console.log('✓ Courier document created:', courierData)
        } else {
          console.log('✓ Courier document already exists')
        }
      } catch (e) {
        console.error('Failed to create courier document:', {
          requestId: req.id,
          userId: req.userId,
          companyId: company.id,
          error: e,
        })
        toast.error(
          'Gagal membuat dokumen kurir. Permintaan tidak disetujui.',
        )
        throw e // Stop here, don't proceed
      }
    }

    // STEP 3: Set approved di Firestore (LAST - only if previous steps succeeded)
    try {
      const batch = writeBatch(db)
      const reqRef = doc(db, 'employeeRequests', req.id)
      
      // Ensure no undefined values in the update
      batch.update(reqRef, {
        status: 'approved',
        requestedRole: role,
      })
      
      await batch.commit()
      console.log('✓ Employee request marked as approved:', req.id)
    } catch (e) {
      console.error('Failed to update request status:', {
        requestId: req.id,
        userId: req.userId,
        companyId: company.id,
        role,
        error: e,
      })
      toast.error(
        'Membership dan dokumen kurir berhasil dibuat, tetapi gagal memperbarui status permintaan. Silakan refresh halaman.',
      )
      // Don't throw here - membership and courier are already created
      // Just refresh to show updated state
      loadRequests()
      return
    }

    // Only call onApproveAsRole and show success if everything succeeded
    onApproveAsRole(req, role)

    toast.success(
      `Permintaan disetujui sebagai ${role === 'admin' ? 'Admin' : 'Kurir'}`,
    )
    loadRequests()
  } catch (e) {
    // This catch handles any errors thrown from steps 1 or 2
    // Step 3 has its own handling and doesn't throw
    console.error('Approval process failed:', e)
    // Error toast already shown in specific catch blocks above
  }
}

  if (!isOwner) {
    return (
      <div className="p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={onBackToOverview} className="mb-4">
            ← Kembali
          </Button>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              Hanya owner perusahaan yang dapat mengelola permintaan karyawan.
            </p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={onBackToOverview}
              className="mb-2 px-0"
            >
              ← Kembali
            </Button>
            <h1 className="text-2xl font-semibold mt-1">Permintaan Karyawan</h1>
            <p className="text-sm text-muted-foreground">
              Kelola permintaan bergabung ke perusahaan{' '}
              <span className="font-medium">{company.name}</span>.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Company ID: <span className="font-mono">{company.id}</span>
            </p>
          </div>

          <Button size="sm" variant="outline" onClick={loadRequests}>
            Refresh
          </Button>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Permintaan Pending</h2>
            <Badge variant="outline">{pending.length} permintaan</Badge>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada permintaan bergabung.
            </p>
          ) : (
            <div className="space-y-3">
              {pending.map(req => (
                <Card key={req.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {req.userName || req.userEmail}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {req.userEmail}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Role diminta:{' '}
                        <span className="font-mono">
                          {req.requestedRole || '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(req.id)}
                      >
                        Tolak
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(req, 'admin')}>
                        Set Admin
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(req, 'courier')}>
                        Set Kurir
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Riwayat Permintaan</h2>
            <Badge variant="outline">{processed.length}</Badge>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : processed.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>
          ) : (
            <div className="space-y-2">
              {processed.map(req => (
                <div
                  key={req.id}
                  className="text-sm flex items-center justify-between border rounded-md p-3"
                >
                  <div className="truncate">
                    {req.userName || req.userEmail}{' '}
                    <span className="text-xs text-muted-foreground">
                      ({req.userEmail})
                    </span>
                  </div>
                  <Badge variant={req.status === 'approved' ? 'default' : 'secondary'}>
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}