import { Company, Courier, Package, RouteOptimization } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMemo, useState } from 'react'
import AdminMap from './AdminMap'
import { Badge } from '@/components/ui/badge'

interface MonitoringViewProps {
  company: Company
  couriers: Courier[]
  packages: Package[]
  routes: RouteOptimization[]
  onBackToHome: () => void
  onOptimizeRoutes: (companyId: string) => void
}

export default function MonitoringView({
  company,
  couriers,
  packages,
  routes,
  onBackToHome,
  onOptimizeRoutes,
}: MonitoringViewProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>()

  const stats = useMemo(() => {
    const total = packages.length
    const pending = packages.filter(p => p.status === 'pending').length
    const inProgress = packages.filter(
      p => p.status === 'in-progress' || p.status === 'ongoing',
    ).length
    const delivered = packages.filter(p => p.status === 'delivered').length

    return { total, pending, inProgress, delivered }
  }, [packages])

  const packagesWithCourierName = useMemo(
    () =>
      packages.map(p => ({
        ...p,
        courierName:
          couriers.find(c => c.id === p.courierId)?.name || 'Belum dialokasikan',
      })),
    [packages, couriers],
  )

  return (
    <div className="p-6 md:p-10 w-full h-full">
      <div className="max-w-6xl mx-auto space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBackToHome}
              className="text-xs text-muted-foreground hover:underline"
            >
              ← Kembali ke Home
            </button>
            <h1 className="text-xl font-semibold mt-2">
              Monitoring Pengiriman
            </h1>
            <p className="text-xs text-muted-foreground">
              Lihat posisi dan status paket untuk perusahaan{' '}
              <span className="font-medium">{company.name}</span>.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => onOptimizeRoutes(company.id)}
            disabled={!packages.length}
          >
            Optimasi Rute
          </Button>
        </div>

        {/* Stats ringkas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total Paket</div>
            <div className="text-lg font-semibold">{stats.total}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-lg font-semibold">{stats.pending}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Sedang Dikirim</div>
            <div className="text-lg font-semibold">{stats.inProgress}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Terkirim</div>
            <div className="text-lg font-semibold">{stats.delivered}</div>
          </Card>
        </div>

        {/* Map + list paket */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr,2fr] gap-4 flex-1 min-h-[360px]">
          <Card className="p-0 overflow-hidden">
            <AdminMap
              packages={packages}
              highlightPackageId={selectedPackageId}
            />
          </Card>

          <Card className="p-3 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Daftar Paket</h2>
              <span className="text-xs text-muted-foreground">
                {packages.length} paket
              </span>
            </div>
            {packagesWithCourierName.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Belum ada paket yang terdaftar.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {packagesWithCourierName.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPackageId(p.id)}
                    className={`w-full text-left p-2 rounded-md border flex flex-col gap-1 hover:bg-slate-50 ${
                      selectedPackageId === p.id ? 'border-emerald-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">
                        {p.name}
                      </span>
                      <Badge
                        variant={
                          p.status === 'delivered'
                            ? 'default'
                            : p.status === 'in-progress' || p.status === 'ongoing'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-[10px] capitalize"
                      >
                        {p.status || 'pending'}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground truncate">
                      {p.recipientName} • {p.courierName}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {p.locationDetail}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}