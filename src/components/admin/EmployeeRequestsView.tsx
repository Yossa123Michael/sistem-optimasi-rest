import { useEffect, useMemo, useState } from 'react'
import { Company, EmployeeRequest, UserRole, User } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { collection, getDocs, query, where, updateDoc, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface EmployeeRequestsViewProps {
  company: Company
  currentUser: User
  requests: EmployeeRequest[]
  onUpdateStatus: (id: string, status: EmployeeRequest['status']) => void
  onApproveAsRole: (req: EmployeeRequest, role: Exclude<UserRole, 'customer'>) => void
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
  const [actingId, setActingId] = useState<string | null>(null)

  const loadRequests = async () => {
    try {
      setLoading(true)
      const q = query(collection(db, 'employeeRequests'), where('companyId', '==', company.id))
      const snap = await getDocs(q)
      const loaded: EmployeeRequest[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as any),
      }))
      setRequests(loaded)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id])

  const pending = useMemo(() => requests.filter(r => r.status === 'pending'), [requests])
  const processed = useMemo(() => requests.filter(r => r.status !== 'pending'), [requests])

  const handleReject = async (reqId: string) => {
    if (!isOwner) return toast.error('Hanya owner yang bisa menolak')
    try {
      setActingId(reqId)
      await updateDoc(doc(db, 'employeeRequests', reqId), { status: 'rejected' })
      onUpdateStatus(reqId, 'rejected')
      toast.success('Permintaan ditolak')
      loadRequests()
    } catch (e: any) {
      console.error('Failed to reject request', e)
      toast.error(`Gagal menolak: ${e?.code || e?.message || String(e)}`)
    } finally {
      setActingId(null)
    }
  }

  const handleApprove = async (req: EmployeeRequest, role: Exclude<UserRole, 'customer'>) => {
    if (!isOwner) return toast.error('Hanya owner yang bisa approve')

    try {
      setActingId(req.id)
      const now = new Date().toISOString()

      const reqUserName = (req as any).userName || ''
      const reqUserEmail = (req as any).userEmail || ''
      const displayName = reqUserName || (reqUserEmail ? reqUserEmail.split('@')[0] : 'Kurir')

      // 1) upsert companyMembers (sumber kebenaran membership)
      await setDoc(
        doc(db, 'companyMembers', `${company.id}_${req.userId}`),
        {
          companyId: company.id,
          userId: req.userId,
          role,
          active: true,
          joinedAt: now,
          updatedAt: now,
          leftAt: null,
        },
        { merge: true },
      )

      // 2) AUTO: jika role courier, buat courier profile yang BENAR (ID stabil + companyId pasti benar)
      if (role === 'courier') {
        await setDoc(
          doc(db, 'couriers', `${company.id}_${req.userId}`),
          {
            companyId: company.id,
            userId: req.userId,
            name: displayName,
            email: reqUserEmail || null,
            capacity: 40, // default number; bisa Anda ubah nanti dari UI admin
            active: true,
            createdAt: now,
            updatedAt: now,
          },
          { merge: true },
        )
      }

      // 3) update request status
      await updateDoc(doc(db, 'employeeRequests', req.id), {
        status: 'approved',
        approvedAt: now,
        approvedBy: currentUser.id,
      } as any)

      onApproveAsRole(req, role)
      onUpdateStatus(req.id, 'approved')

      toast.success(`Permintaan disetujui sebagai ${role}`)
      loadRequests()
    } catch (e: any) {
      console.error('Failed to approve request', e)
      toast.error(`Gagal menyetujui: ${e?.code || e?.message || String(e)}`)
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Permintaan Karyawan</h1>
            <p className="text-sm text-muted-foreground">Kelola permintaan gabung perusahaan.</p>
          </div>
          <Button variant="outline" onClick={onBackToOverview}>
            Kembali
          </Button>
        </div>

        <Card className="p-6 space-y-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : (
            <>
              <div className="space-y-3">
                <h2 className="font-semibold">Pending</h2>
                {pending.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada request pending.</p>
                ) : (
                  <div className="space-y-3">
                    {pending.map(r => (
                      <div key={r.id} className="border rounded-xl p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{(r as any).userName}</p>
                            <p className="text-xs text-muted-foreground truncate">{(r as any).userEmail}</p>
                          </div>
                          <Badge variant="secondary">pending</Badge>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button disabled={actingId === r.id} onClick={() => handleApprove(r, 'admin')}>
                            {actingId === r.id ? 'Memproses...' : 'Approve Admin'}
                          </Button>
                          <Button disabled={actingId === r.id} variant="outline" onClick={() => handleApprove(r, 'courier')}>
                            {actingId === r.id ? 'Memproses...' : 'Approve Kurir'}
                          </Button>
                          <Button disabled={actingId === r.id} variant="destructive" onClick={() => handleReject(r.id)}>
                            Tolak
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h2 className="font-semibold">Riwayat</h2>
                {processed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>
                ) : (
                  <div className="space-y-3">
                    {processed.map(r => (
                      <div key={r.id} className="border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{(r as any).userName}</p>
                            <p className="text-xs text-muted-foreground truncate">{(r as any).userEmail}</p>
                          </div>
                          <Badge variant={r.status === 'approved' ? 'default' : 'destructive'}>{r.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}