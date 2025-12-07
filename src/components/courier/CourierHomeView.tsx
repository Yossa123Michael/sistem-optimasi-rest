import { Card, CardContent } from '@/components/ui/card'
import { useKV } from '@github/spark/hooks'
import { User, Package, Courier, Company } from '@/lib/types'
import { Package as PackageIcon, MapPin, CheckCircle, Clock } from '@phosphor-icons/react'

interface CourierHomeViewProps {
  user: User
}

export default function CourierHomeView({ user }: CourierHomeViewProps) {
  const userName = user.name || user.email.split('@')[0]
  const [packages] = useKV<Package[]>('packages', [])
  const [couriers] = useKV<Courier[]>('couriers', [])
  const [companies] = useKV<Company[]>('companies', [])

  const userCompany = companies?.find(c => c.id === user.companyId)
  const courierProfile = couriers?.find(c => c.userId === user.id)
  
  const assignedPackages = packages?.filter(p => p.courierId === user.id) || []
  const pendingPackages = assignedPackages.filter(p => p.status === 'pending').length
  const inTransitPackages = assignedPackages.filter(p => p.status === 'in-transit').length
  const deliveredPackages = assignedPackages.filter(p => p.status === 'delivered').length

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-medium mb-2">Dashboard Kurir</h1>
          <p className="text-lg text-muted-foreground">Selamat datang, {userName}</p>
          {userCompany && (
            <p className="text-sm text-muted-foreground mt-1">Perusahaan: {userCompany.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Paket Tertunda</p>
                  <p className="text-3xl font-bold">{pendingPackages}</p>
                </div>
                <Clock className="text-muted-foreground" size={40} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Sedang Dikirim</p>
                  <p className="text-3xl font-bold">{inTransitPackages}</p>
                </div>
                <MapPin className="text-accent" size={40} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Terkirim</p>
                  <p className="text-3xl font-bold">{deliveredPackages}</p>
                </div>
                <CheckCircle className="text-green-600" size={40} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-medium mb-4">Informasi Kurir</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>• Total Paket Ditugaskan: <span className="font-medium text-foreground">{assignedPackages.length}</span></p>
              {courierProfile && (
                <>
                  <p>• Kapasitas: <span className="font-medium text-foreground">{courierProfile.capacity} paket</span></p>
                  <p>• Status: <span className="font-medium text-foreground">{courierProfile.active ? 'Aktif' : 'Tidak Aktif'}</span></p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {assignedPackages.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <PackageIcon className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-lg text-muted-foreground">Belum ada paket yang ditugaskan</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
