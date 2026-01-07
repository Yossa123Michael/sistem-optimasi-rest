import { useMemo, useState } from 'react'
import { Company, Courier, Package, RouteOptimization, User } from '@/lib/types'
import AdminSidebar2, { AdminView } from './AdminSidebar2'
import InputDataView from './InputDataView'
import AdminMap from './AdminMap'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import MonitoringView from './MonitoringView'
import HistoryView from './HistoryView'
import type { EmployeeRequest, UserRole } from '@/lib/types'

interface AdminDashboardProps {
  user: User
  companyId: string
  onLogout: () => void
  onBackToHome: () => void
  couriers: Courier[]
  packages: Package[]
  onSetCouriers: (couriers: Courier[]) => void
  onSetPackages: (packages: Package[]) => void
  employeeRequests: EmployeeRequest[]
  onUpdateRequestStatus: (id: string, status: EmployeeRequest['status']) => void
  onApproveRequest: (req: EmployeeRequest, role: Exclude<UserRole, 'customer'>) => void
  routes: RouteOptimization[]
  onOptimizeRoutes: (companyId: string) => void
  companiesFromFirestore?: Company[]
}

export default function AdminDashboard(props: AdminDashboardProps) {
  const {
    user,
    companyId,
    onLogout,
    onBackToHome,
    couriers,
    packages,
    onSetCouriers,
    onSetPackages,
    employeeRequests,
    onUpdateRequestStatus,
    onApproveRequest,
    routes,
    onOptimizeRoutes,
    companiesFromFirestore = [],
  } = props

  const [view, setView] = useState<AdminView>('overview')

  const company = useMemo(
    () => companiesFromFirestore.find(c => c.id === companyId),
    [companiesFromFirestore, companyId],
  )

  console.log('AdminDashboard companyId:', companyId)
  console.log('AdminDashboard companies length:', companiesFromFirestore.length)
  console.log(
    'AdminDashboard found company:',
    companiesFromFirestore.find(c => c.id === companyId),
  )

  const companyCouriers = useMemo(
    () => couriers.filter(c => c.companyId === companyId),
    [couriers, companyId],
  )

  const companyPackages = useMemo(
    () => packages.filter(p => p.companyId === companyId),
    [packages, companyId],
  )

  if (!company) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-gray-500">
        Data perusahaan tidak ditemukan.
      </div>
    )
  }

  const handleViewChange = (next: AdminView) => {
    setView(next)
  }

  let mainContent: React.ReactNode

  if (view === 'input-data') {
    mainContent = (
      <InputDataView
        company={company}
        couriers={companyCouriers}   // ⬅ hanya kurir company ini
        packages={companyPackages}   // ⬅ hanya paket company ini
        onSetCouriers={onSetCouriers}
        onSetPackages={onSetPackages}
        onBackToOverview={() => setView('overview')}
      />
    )
    } else if (view === 'monitoring') {
    mainContent = (
      <MonitoringView
        company={company}
        couriers={companyCouriers}
        packages={companyPackages}
        routes={routes}
        onBackToHome={onBackToHome}
        onOptimizeRoutes={onOptimizeRoutes}
      />
    )
  } else if (view === 'history') {
    mainContent = (
      <HistoryView
        company={company}
        couriers={companyCouriers}
        packages={companyPackages}
        onBackToHome={onBackToHome}
      />
    )
    } else if (view === 'requests') {
    const companyRequests = employeeRequests.filter(
      r => r.companyId === companyId,
    )

    mainContent = (
      <div className="p-6 md:p-10 w-full h-full">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={onBackToHome}
                className="text-xs text-muted-foreground hover:underline"
              >
                ← Kembali ke Home
              </button>
              <h1 className="text-xl font-semibold mt-2">
                Permintaan Bergabung ke Perusahaan
              </h1>
              <p className="text-xs text-muted-foreground">
                Owner dapat menyetujui atau menolak karyawan yang mendaftar ke perusahaan ini.
              </p>
            </div>
          </div>

          {companyRequests.length === 0 ? (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">
                Belum ada permintaan bergabung.
              </p>
            </Card>
          ) : (
            <Card className="p-4 space-y-3">
              {companyRequests.map(req => (
                <div
                  key={req.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {req.userName || req.userEmail}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Role diminta: {req.requestedRole || '-'}
                    </div>
                    <div className="text-[11px]">
                      Status:{' '}
                      <span
                        className={
                          req.status === 'approved'
                            ? 'text-emerald-600'
                            : req.status === 'rejected'
                            ? 'text-red-500'
                            : 'text-amber-500'
                        }
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onUpdateRequestStatus(req.id, 'rejected')
                          }
                        >
                          Tolak
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onApproveRequest(req, 'courier')}
                        >
                          Setujui sebagai Kurir
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    )

  } else {
    // overview
    mainContent = (
      <div className="p-6 md:p-10 w-full h-full">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={onBackToHome}
                className="text-xs text-muted-foreground hover:underline"
              >
                ← Kembali ke Home
              </button>
              <h1 className="text-2xl font-semibold mt-2">
                Halo, {user.name || 'Admin'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Kelola operasi pengiriman untuk perusahaan{' '}
                <span className="font-medium">{company.name}</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr,3fr] gap-6 h-[520px]">
            <Card className="p-4 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-semibold mb-2">
                  Ringkasan Hari Ini
                </h2>
                <p className="text-sm text-muted-foreground">
                  Kurir terdaftar: {companyCouriers.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Paket terdaftar: {companyPackages.length}
                </p>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <Button onClick={() => setView('input-data')}>
                  Kelola Data Kurir & Paket
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setView('monitoring')}
                >
                  Buka Monitoring Peta
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setView('requests')}
                >
                  Lihat Permintaan Karyawan
                </Button>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <AdminMap packages={companyPackages} />
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
  <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
    <AdminSidebar2
      user={user}
      company={company}
      currentView={view}
      onViewChange={handleViewChange}
      onLogout={onLogout}
    />
    {/* area kanan bisa di-scroll */}
    <main className="flex-1 h-screen overflow-y-auto">
      {mainContent}
    </main>
  </div>
)
}