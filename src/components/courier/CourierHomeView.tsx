import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { User, Package, Courier, Company } from '@/lib/types'
import { Package as PackageIcon, MapPin, CheckCircle, Clock } from '@phosphor-icons/react'
import { db } from '@/lib/firebase'
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore'

interface CourierHomeViewProps {
  user: User
}

export default function CourierHomeView({ user }: CourierHomeViewProps) {
  const userName = user.name || user.email.split('@')[0]
  const [company, setCompany] = useState<Company | null>(null)
  const [courier, setCourier] = useState<Courier | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        if (!user.companyId) {
          setCompany(null)
          setCourier(null)
          setPackages([])
          return
        }

        // company
        const cSnap = await getDoc(doc(db, 'companies', user.companyId))
        setCompany(cSnap.exists() ? ({ id: cSnap.id, ...(cSnap.data() as any) } as Company) : null)

        // courier profile (by userId)
        const courierSnap = await getDocs(
          query(collection(db, 'couriers'), where('companyId', '==', user.companyId), where('userId', '==', user.id)),
        )
        const courierDoc = courierSnap.docs[0]
        const courierData = courierDoc ? ({ id: courierDoc.id, ...(courierDoc.data() as any) } as Courier) : null
        setCourier(courierData)

        // packages assigned to courierId (if exists)
        if (courierData?.id) {
          const pSnap = await getDocs(
            query(collection(db, 'packages'), where('companyId', '==', user.companyId), where('courierId', '==', courierData.id)),
          )
          setPackages(pSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
        } else {
          setPackages([])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.companyId, user.id])

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
              <p className="text-muted-foreground">Perusahaan ini sudah dihapus atau tidak tersedia lagi.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const pending = packages.filter(p => p.status === 'pending').length
  const inTransit = packages.filter(p => p.status === 'in-transit').length
  const delivered = packages.filter(p => p.status === 'delivered').length

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-medium mb-2">Dashboard Kurir</h1>
          <p className="text-lg text-muted-foreground">Selamat datang, {userName}</p>
          {company && <p className="text-sm text-muted-foreground mt-1">Perusahaan: {company.name}</p>}
          {!loading && !courier && (
            <p className="text-sm text-destructive mt-2">Profil kurir belum dibuat oleh admin.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Paket Tertunda</p>
                  <p className="text-3xl font-bold">{pending}</p>
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
                  <p className="text-3xl font-bold">{inTransit}</p>
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
                  <p className="text-3xl font-bold">{delivered}</p>
                </div>
                <CheckCircle className="text-green-600" size={40} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Paket Saya</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : packages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada paket yang ditugaskan.</p>
            ) : (
              <div className="space-y-2">
                {packages.slice(0, 10).map(p => (
                  <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Status: {p.status}</p>
                    </div>
                    <PackageIcon size={22} className="text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}