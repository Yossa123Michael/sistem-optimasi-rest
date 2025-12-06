import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { User, Package, Courier } from '@/lib/types'
import MapView from '@/components/maps/MapView'

interface HomeViewProps {
  user: User
}

export default function HomeView({ user }: HomeViewProps) {
  const [packages] = useKV<Package[]>('packages', [])
  const [couriers] = useKV<Courier[]>('couriers', [])

  const companyPackages = packages?.filter(p => p.companyId === user.companyId) || []
  const companyCouriers = couriers?.filter(c => c.companyId === user.companyId) || []
  
  const activeCouriers = companyCouriers.filter(c => c.active)

  const markers = companyPackages.map(pkg => ({
    position: [pkg.latitude, pkg.longitude] as [number, number],
    label: pkg.name,
    color: pkg.status === 'delivered' ? '#10B981' : pkg.status === 'in-transit' ? '#F59E0B' : '#3B82F6'
  }))

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview pengiriman dan rute</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Paket</p>
            <p className="text-4xl font-semibold">{companyPackages.length}</p>
          </Card>
          
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Kurir Aktif</p>
            <p className="text-4xl font-semibold">{activeCouriers.length}</p>
          </Card>
          
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Dalam Pengiriman</p>
            <p className="text-4xl font-semibold">
              {companyPackages.filter(p => p.status === 'in-transit').length}
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Peta Pengiriman</h2>
          <MapView
            markers={markers}
            className="h-[600px] w-full rounded-lg overflow-hidden"
          />
        </Card>
      </div>
    </div>
  )
}
