import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  User,
  Company,
  Courier,
  Package,
  EmployeeRequest,
  UserRole,
} from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

import AdminSidebar, { AdminView } from './AdminSidebar'
import InputDataView from './InputDataView'
import EmployeeRequestsView from './EmployeeRequestsView'

interface AdminDashboardProps {
  user: User
  companyId: string
  onLogout: () => void
  onBackToHome?: () => void

  // state dari App.tsx
  couriers: Courier[]
  packages: Package[]
  onSetCouriers: (couriers: Courier[]) => void
  onSetPackages: (packages: Package[]) => void
  employeeRequests: EmployeeRequest[]
  onUpdateRequestStatus: (
    id: string,
    status: EmployeeRequest['status'],
  ) => void
  onApproveRequest: (
    req: EmployeeRequest,
    role: Exclude<UserRole, 'customer'>,
  ) => void

  routes: RouteOptimization[]
  onOptimizeRoutes: (companyId: string) => void
}

export default function AdminDashboard({
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
}: AdminDashboardProps) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<AdminView>('overview')

  useEffect(() => {
    const loadCompany = async () => {
      try {
        setLoading(true)
        const ref = doc(db, 'companies', companyId)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          toast.error('Perusahaan tidak ditemukan')
          if (onBackToHome) onBackToHome()
          return
        }
        setCompany({ id: snap.id, ...(snap.data() as Company) })
      } catch (err) {
        console.error('AdminDashboard: gagal memuat perusahaan', err)
        toast.error('Gagal memuat data perusahaan')
        if (onBackToHome) onBackToHome()
      } finally {
        setLoading(false)
      }
    }

    loadCompany()
  }, [companyId, onBackToHome])

  if (loading || !company) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Memuat dashboard admin...</p>
        </div>
      </div>
    )
  }

  const isOwner = user.id === company.ownerId

  const renderView = () => {
    switch (view) {
      case 'overview':
        return (
          <div className="p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
              <div>
                <h1 className="text-3xl font-semibold mb-2">
                  Selamat datang, Admin
                </h1>
                <p className="text-muted-foreground">
                  Kelola perusahaan{' '}
                  <span className="font-semibold">{company.name}</span> dari
                  satu tempat.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    ID Perusahaan
                  </p>
                  <p className="font-mono text-sm break-all">{company.id}</p>
                </Card>

                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    Dibuat Pada
                  </p>
                  <p className="font-medium">
                    {company.createdAt
                      ? new Date(company.createdAt).toLocaleString()
                      : '—'}
                  </p>
                </Card>

                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Owner</p>
                  <p className="font-mono text-sm break-all">
                    {company.ownerId}
                  </p>
                  {isOwner && (
                    <p className="mt-1 text-xs text-emerald-600 font-medium">
                      Anda adalah owner perusahaan ini
                    </p>
                  )}
                </Card>
              </div>

              {isOwner && (
                <Card className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Permintaan Karyawan
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Kelola permintaan bergabung ke perusahaan Anda.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setView('requests')}
                  >
                    Lihat Permintaan
                  </Button>
                </Card>
              )}
              {couriers.some(c => c.companyId === company.id) &&
  packages.some(p => p.companyId === company.id) && (
    <Card className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <p className="text-sm font-medium">Optimasi Rute</p>
        <p className="text-sm text-muted-foreground">
          Hitung urutan pengantaran paket untuk setiap kurir di perusahaan ini.
        </p>
      </div>
      <Button
        variant="default"
        onClick={() => onOptimizeRoutes(company.id)}
      >
        Hitung Rute
      </Button>
    </Card>
  )}

{routes.length > 0 && (
  <Card className="p-6 space-y-4">
    <h2 className="text-lg font-semibold">Hasil Optimasi Terakhir</h2>
    <div className="space-y-3 text-sm">
      {routes.map(route => (
        <div
          key={route.courierId}
          className="border rounded-lg p-3"
        >
          <p className="font-medium mb-1">
            Kurir: {route.courierName}
          </p>
          {route.packages.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Tidak ada paket untuk kurir ini.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-1">
                Urutan paket:
              </p>
              <p className="text-sm">
                {route.packages.map(p => p.name).join(' → ')}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  </Card>
)}
            </div>
          </div>
        )

      case 'input-data':
        return (
          <InputDataView
            company={company}
            couriers={couriers}
            packages={packages}
            onSetCouriers={onSetCouriers}
            onSetPackages={onSetPackages}
            onBackToOverview={() => setView('overview')}
          />
        )

      case 'requests':
        return (
          <EmployeeRequestsView
            company={company}
            currentUser={user}
            requests={employeeRequests.filter(
              r => r.companyId === company.id,
            )}
            onUpdateStatus={onUpdateRequestStatus}
            onApproveAsRole={onApproveRequest}
            onBackToOverview={() => setView('overview')}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        user={user}
        company={company}
        currentView={view}
        onViewChange={setView}
        onLogout={onLogout}
        onBackToHome={onBackToHome}
        isOwner={isOwner}
      />
      <main className="flex-1 lg:ml-64">{renderView()}</main>
    </div>
  )
}