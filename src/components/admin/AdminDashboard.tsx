import { useMemo, useState } from 'react'
import {
  Company,
  Courier,
  Package,
  RouteOptimization,
  User,
} from '@/lib/types'
import AdminSidebar2, { AdminView } from './AdminSidebar2'
import InputDataView from './InputDataView'
import AdminMap from './AdminMap'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import MonitoringView from './MonitoringView'
import HistoryView from './HistoryView'
import type { EmployeeRequest, UserRole } from '@/lib/types'
import EmployeeRequestsView from './EmployeeRequestsView'

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
  onApproveRequest: (
    req: EmployeeRequest,
    role: Exclude<UserRole, 'customer'>,
  ) => void
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

  const companyRequests = useMemo(
    () => employeeRequests.filter(r => r.companyId === companyId),
    [employeeRequests, companyId],
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

  let mainContent: React.ReactNode

  if (!company) {
    mainContent = (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Perusahaan tidak ditemukan.
        </p>
        <Button variant="ghost" onClick={onBackToHome} className="mt-2">
          ← Kembali ke Home
        </Button>
      </div>
    )
  } else if (view === 'requests') {
    mainContent = (
      <EmployeeRequestsView
        company={company}
        currentUser={user}
        requests={companyRequests}
        onUpdateStatus={onUpdateRequestStatus}
        onApproveAsRole={onApproveRequest}
        onBackToOverview={() => setView('overview')}
      />
    )
  } else if (view === 'input-data') {
    mainContent = (
      <InputDataView
        company={company}
        couriers={companyCouriers}
        packages={companyPackages}
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
        onOptimizeRoutes={onOptimizeRoutes}
        onBackToOverview={() => setView('overview')}
      />
    )
  } else if (view === 'history') {
    mainContent = (
      <HistoryView
        company={company}
        couriers={companyCouriers}
        packages={companyPackages}
        onBackToOverview={() => setView('overview')}
      />
    )
  } else {
    // view === 'overview'
    mainContent = (
      <div className="p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={onBackToHome}
                className="text-sm text-muted-foreground hover:underline"
              >
                ← Kembali ke Home
              </button>
              <h1 className="text-2xl font-semibold mt-2">
                Admin Dashboard - {company.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Kelola kurir, paket, dan permintaan karyawan untuk perusahaan
                ini.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-2">Data Kurir & Paket</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Tambah dan kelola data kurir serta paket pengiriman.
                </p>
              </div>
              <Button onClick={() => setView('input-data')}>
                Buka Input Data
              </Button>
            </Card>

            <Card className="p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  Permintaan Karyawan
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Lihat dan kelola permintaan bergabung ke perusahaan ini.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setView('requests')}
              >
                Lihat Permintaan Karyawan
              </Button>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-2">Peta Pengiriman</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Lihat posisi kurir dan paket pada peta.
            </p>
            <AdminMap couriers={companyCouriers} packages={companyPackages} />
          </Card>
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
        onViewChange={setView}
        onLogout={onLogout}
      />
      <main className="flex-1 h-screen overflow-y-auto">
        {mainContent}
      </main>
    </div>
  )
}