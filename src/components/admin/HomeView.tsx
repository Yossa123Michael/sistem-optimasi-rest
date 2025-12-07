import { Card, CardContent } from '@/components/ui/card'
import { useKV } from '@github/spark/hooks'
import { User, Package, Courier, Company } from '@/lib/types'
import { Package as PackageIcon, Truck, Clock, CheckCircle } from '@phosphor-icons/react'

interface HomeViewProps {
  user: User
}

export default function HomeView({ user }: HomeViewProps) {
  const userName = user.name || user.email.split('@')[0]
  const [packages] = useKV<Package[]>('packages', [])
  const [couriers] = useKV<Courier[]>('couriers', [])
  const [companies] = useKV<Company[]>('companies', [])

  const userCompany = companies?.find(c => c.id === user.companyId)
  
  if (!userCompany) {
    return (
      <div className="p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          <Card className="border-destructive/50">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-medium mb-2 text-destructive">Perusahaan Tidak Ditemukan</h2>
              <p className="text-muted-foreground">
                Perusahaan ini sudah dihapus atau tidak tersedia lagi.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const companyPackages = packages?.filter(p => p.companyId === user.companyId) || []
  const companyCouriers = couriers?.filter(c => c.companyId === user.companyId) || []
  
  const pendingPackages = companyPackages.filter(p => p.status === 'pending').length
  const inTransitPackages = companyPackages.filter(p => p.status === 'in-transit').length
  const deliveredPackages = companyPackages.filter(p => p.status === 'delivered').length
  const activeCouriers = companyCouriers.filter(c => c.active).length

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-medium mb-2">Dashboard Admin</h1>
          <p className="text-lg text-muted-foreground">Selamat datang, {userName}</p>
          {userCompany && (
            <p className="text-sm text-muted-foreground mt-1">Perusahaan: {userCompany.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Paket Pending</p>
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
                  <p className="text-sm text-muted-foreground mb-1">Dalam Pengiriman</p>
                  <p className="text-3xl font-bold">{inTransitPackages}</p>
                </div>
                <PackageIcon className="text-accent" size={40} />
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

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Kurir Aktif</p>
                  <p className="text-3xl font-bold">{activeCouriers}</p>
                </div>
                <Truck className="text-primary" size={40} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-medium mb-4">Ringkasan</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>• Total Paket: <span className="font-medium text-foreground">{companyPackages.length}</span></p>
              <p>• Total Kurir: <span className="font-medium text-foreground">{companyCouriers.length}</span></p>
              {userCompany && (
                <p>• Kode Perusahaan: <span className="font-mono font-medium text-foreground">{userCompany.code}</span></p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
