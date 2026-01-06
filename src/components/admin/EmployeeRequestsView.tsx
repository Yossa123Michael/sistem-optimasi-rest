import { useMemo } from 'react'
import { Company, EmployeeRequest, UserRole, User } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

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
  requests,
  onUpdateStatus,
  onApproveAsRole,
  onBackToOverview,
}: EmployeeRequestsViewProps) {
  const isOwner = currentUser.id === company.ownerId

  const pending = useMemo(
    () => requests.filter(r => r.status === 'pending'),
    [requests],
  )
  const processed = useMemo(
    () => requests.filter(r => r.status !== 'pending'),
    [requests],
  )

  const handleReject = (id: string) => {
    onUpdateStatus(id, 'rejected')
    toast.success('Permintaan ditolak')
  }

  const handleApprove = (
    req: EmployeeRequest,
    role: Exclude<UserRole, 'customer'>,
  ) => {
    if (!isOwner) return
    onApproveAsRole(req, role)
    toast.success(
      `Permintaan disetujui sebagai ${
        role === 'admin' ? 'Admin' : 'Kurir'
      }`,
    )
  }

  if (!isOwner) {
    return (
      <div className="p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={onBackToOverview}
            className="mb-4"
          >
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
            <h1 className="text-2xl font-semibold mt-1">
              Permintaan Karyawan
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola permintaan bergabung ke perusahaan{' '}
              <span className="font-medium">{company.name}</span>.
            </p>
          </div>
        </div>

        {/* Pending */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Permintaan Pending</h2>
            <Badge variant="outline">{pending.length} permintaan</Badge>
          </div>

          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada permintaan bergabung.
            </p>
          ) : (
            <div className="space-y-3">
              {pending.map(req => (
                <div
                  key={req.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-lg p-3 gap-3"
                >
                  <div>
                    <p className="font-medium">{req.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.userEmail}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Role diminta:{' '}
                      <span className="font-medium">
                        {req.requestedRole || 'courier'}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(req, 'admin')}
                    >
                      Terima sebagai Admin
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(req, 'courier')}
                    >
                      Terima sebagai Kurir
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(req.id)}
                    >
                      Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Processed */}
        {processed.length > 0 && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Riwayat Permintaan</h2>
            </div>
            <div className="space-y-3 text-sm">
              {processed.map(req => (
                <div
                  key={req.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-lg p-3 gap-3"
                >
                  <div>
                    <p className="font-medium">{req.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.userEmail}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        req.status === 'approved' ? 'default' : 'destructive'
                      }
                    >
                      {req.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                    </Badge>
                    {req.requestedRole && (
                      <span className="text-xs text-muted-foreground">
                        Role diminta: {req.requestedRole}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}