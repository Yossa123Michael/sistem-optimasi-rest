import { Card, CardContent } from '@/components/ui/card'
import { User, Company } from '@/lib/types'
import { Package as PackageIcon, Truck, Clock, CheckCircle } from '@phosphor-icons/react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'

interface HomeViewProps {
  user: User
}

export default function HomeView({ user }: HomeViewProps) {
  const userName = user.name || user.email.split('@')[0]
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        if (!user.companyId) {
          setCompany(null)
          return
        }
        const snap = await getDoc(doc(db, 'companies', user.companyId))
        setCompany(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Company) : null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.companyId])

  if (!user.companyId) {
    return (
      <div className="p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          <Card className="border-destructive/50">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-medium mb-2 text-destructive">Belum pilih perusahaan</h2>
              <p className="text-muted-foreground">Silakan kembali ke Home dan pilih perusahaan.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!loading && !company) {
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

  // Untuk sementara angka statistik 0 dulu sampai packages/couriers juga dipindah ke Firestore
  const pendingPackages = 0
  const inTransitPackages = 0
  const deliveredPackages = 0
  const activeCouriers = 0

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-medium mb-2">Dashboard Admin</h1>
          <p className="text-lg text-muted-foreground">Selamat datang, {userName}</p>
          {company && <p className="text-sm text-muted-foreground mt-1">Perusahaan: {company.name}</p>}
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
              <p>• Total Paket: <span className="font-medium text-foreground">0</span></p>
              <p>• Total Kurir: <span className="font-medium text-foreground">0</span></p>
              {company && (
                <p>• Kode Perusahaan: <span className="font-mono font-medium text-foreground">{company.code}</span></p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}