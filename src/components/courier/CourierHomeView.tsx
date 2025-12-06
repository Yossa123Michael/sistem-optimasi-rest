import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { User, Package, Courier } from '@/lib/types'
import MapView from '@/components/maps/MapView'

interface CourierHomeViewProps {
  user: User
}

export default function CourierHomeView({ user }: CourierHomeViewProps) {
  const [packages] = useKV<Package[]>('packages', [])
  const [couriers] = useKV<Courier[]>('couriers', [])

  const courier = couriers?.find(c => c.userId === user.id)
  const courierPackages = packages?.filter(p => p.courierId === courier?.id) || []
  const totalToday = courierPackages.length
  const remaining = courierPackages.filter(p => p.status !== 'delivered').length
  const completed = courierPackages.filter(p => p.status === 'delivered').length

  const markers = courierPackages
    .filter(p => p.status !== 'delivered')
    .map(pkg => ({
      position: [pkg.latitude, pkg.longitude] as [number, number],
      label: pkg.name,
      color: '#10B981'
    }))

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Dashboard Kurir</h1>
          <p className="text-muted-foreground">Ringkasan pengiriman hari ini</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 md:col-span-1">
            <p className="text-sm text-muted-foreground mb-2">Paket Hari Ini</p>
            <p className="text-4xl font-semibold text-accent">{totalToday}</p>
          </Card>
          
          <div className="grid grid-cols-2 gap-6 md:col-span-2">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Paket Tersisa</p>
              <p className="text-4xl font-semibold text-primary">{remaining}</p>
            </Card>
            
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Paket Terselesaikan</p>
              <p className="text-4xl font-semibold text-accent">{completed}</p>
            </Card>
          </div>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Lokasi Pengiriman</h2>
          <MapView
            markers={markers}
            className="h-[600px] w-full rounded-lg overflow-hidden"
          />
        </Card>
      </div>
    </div>
  )
}
