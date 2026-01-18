import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Package, Courier, Company } from '@/lib/types'
import { Package as PackageIcon, MapPin, CheckCircle, Clock } from '@phosphor-icons/react'
import { db } from '@/lib/firebase'
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore'
import MapView from '@/components/maps/MapView'

type LatLng = { lat: number; lng: number }

type RouteOptimDoc = {
  companyId: string
  generatedAt: string
  warehouse: LatLng
  routes: Array<{
    courierId: string
    courierName: string
    packageIds: string[]
    route: LatLng[]
    routePath?: LatLng[]
    totalDistance: number
  }>
}

interface CourierHomeViewProps {
  user: User
  onGoRecommendation?: () => void
}

export default function CourierHomeView({ user, onGoRecommendation }: CourierHomeViewProps) {
  const userName = user.name || user.email.split('@')[0]
  const [company, setCompany] = useState<Company | null>(null)
  const [courier, setCourier] = useState<Courier | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [optDoc, setOptDoc] = useState<RouteOptimDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        if (!user.companyId) {
          setCompany(null)
          setCourier(null)
          setPackages([])
          setOptDoc(null)
          return
        }

        const cSnap = await getDoc(doc(db, 'companies', user.companyId))
        const comp = cSnap.exists() ? ({ id: cSnap.id, ...(cSnap.data() as any) } as Company) : null
        setCompany(comp)

        const courierSnap = await getDocs(
          query(collection(db, 'couriers'), where('companyId', '==', user.companyId), where('userId', '==', user.id)),
        )
        const courierDoc = courierSnap.docs[0]
        const courierData = courierDoc ? ({ id: courierDoc.id, ...(courierDoc.data() as any) } as Courier) : null
        setCourier(courierData)

        if (courierData?.id) {
          const pSnap = await getDocs(
            query(collection(db, 'packages'), where('companyId', '==', user.companyId), where('courierId', '==', courierData.id)),
          )
                    setPackages(
            pSnap.docs
              .map(d => ({ id: d.id, ...(d.data() as any) }))
              .filter((p: any) => p.awaitingPayment !== true),
          )
        } else {
          setPackages([])
        }

        const optSnap = await getDoc(doc(db, 'routeOptimizations', user.companyId))
        const loadedOpt = optSnap.exists() ? ({ ...(optSnap.data() as any) } as RouteOptimDoc) : null
        setOptDoc(loadedOpt)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.companyId, user.id])

  const pending = packages.filter(p => p.status === 'pending').length
  const inTransit = packages.filter(p => p.status === 'in-transit').length
  const delivered = packages.filter(p => p.status === 'delivered').length

  const myRoute = useMemo(() => {
    if (!courier?.id || !optDoc?.routes?.length) return null
    return optDoc.routes.find(r => r.courierId === courier.id) || null
  }, [courier?.id, optDoc])

  const orderedPackages = useMemo(() => {
    if (!myRoute?.packageIds?.length) return []
    return myRoute.packageIds.map(id => packages.find(p => p.id === id)).filter(Boolean) as Package[]
  }, [myRoute, packages])

  const routeText = useMemo(() => {
    if (!orderedPackages.length) return '-'
    return orderedPackages.map(p => p.name).join(' > ')
  }, [orderedPackages])

  const miniMarkers = useMemo(() => {
    const out: Array<{ position: [number, number]; label: string; color?: string; markerText?: string }> = []

    if (optDoc?.warehouse) {
      out.push({
        position: [optDoc.warehouse.lat, optDoc.warehouse.lng],
        label: 'Kantor',
        color: '#1D4ED8',
        markerText: 'K',
      })
    }

    orderedPackages.forEach((p, idx) => {
      out.push({
        position: [p.latitude, p.longitude],
        label: `${idx + 1}. ${p.name}`,
        color: '#10B981',
        markerText: String(idx + 1),
      })
    })

    return out
  }, [optDoc?.warehouse, orderedPackages])

  const miniRoutes = useMemo(() => {
    if (!myRoute) return []
    const pts = (myRoute.routePath && myRoute.routePath.length > 1) ? myRoute.routePath : myRoute.route
    if (!pts?.length) return []
    const poly: [number, number][] = pts.map(p => [p.lat, p.lng])
    return [poly]
  }, [myRoute])

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
          <CardContent className="p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Rute Hari Ini</h2>
                {optDoc?.generatedAt && (
                  <p className="text-xs text-muted-foreground">Generated: {optDoc.generatedAt}</p>
                )}
              </div>

              {onGoRecommendation && (
                <Button variant="outline" onClick={onGoRecommendation}>
                  Buka Rekomendasi
                </Button>
              )}
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat rute...</p>
            ) : !optDoc ? (
              <p className="text-sm text-muted-foreground">
                Belum ada hasil optimasi. Admin harus klik “Cari Opsi”.
              </p>
            ) : !myRoute || myRoute.packageIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada paket untuk Anda pada optimasi terakhir.
              </p>
            ) : (
              <>
                <p className="text-sm"><b>Urutan:</b> {routeText}</p>
                <p className="text-xs text-muted-foreground">
                  Jalur: {myRoute.routePath?.length ? 'OSRM (jalan nyata)' : 'Garis lurus (fallback)'} •
                  Distance (approx): {myRoute.totalDistance.toFixed(2)}
                </p>

                <MapView
                  center={optDoc.warehouse ? [optDoc.warehouse.lat, optDoc.warehouse.lng] : [-6.2088, 106.8456]}
                  zoom={11}
                  markers={miniMarkers}
                  routes={miniRoutes}
                  className="h-[280px] w-full rounded-xl overflow-hidden border"
                />
              </>
            )}
          </CardContent>
        </Card>

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