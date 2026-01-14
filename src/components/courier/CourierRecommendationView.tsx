import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { User, Courier, Package } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
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
    route: LatLng[] // garis lurus
    routePath?: LatLng[] // jalur nyata OSRM
    totalDistance: number
  }>
}

interface CourierRecommendationViewProps {
  user: User
}

export default function CourierRecommendationView({ user }: CourierRecommendationViewProps) {
  const [courier, setCourier] = useState<Courier | null>(null)
  const [optDoc, setOptDoc] = useState<RouteOptimDoc | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        if (!user.companyId) {
          setCourier(null)
          setOptDoc(null)
          setPackages([])
          return
        }

        const courierSnap = await getDocs(
          query(
            collection(db, 'couriers'),
            where('companyId', '==', user.companyId),
            where('userId', '==', user.id),
          ),
        )
        const courierDoc = courierSnap.docs[0]
        const courierData = courierDoc
          ? ({ id: courierDoc.id, ...(courierDoc.data() as any) } as Courier)
          : null
        setCourier(courierData)

        const optSnap = await getDoc(doc(db, 'routeOptimizations', user.companyId))
        const loadedOpt = optSnap.exists() ? ({ ...(optSnap.data() as any) } as RouteOptimDoc) : null
        setOptDoc(loadedOpt)

        const pSnap = await getDocs(
          query(collection(db, 'packages'), where('companyId', '==', user.companyId)),
        )
        setPackages(pSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Package)))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.companyId, user.id])

  const myRoute = useMemo(() => {
    if (!courier?.id || !optDoc?.routes?.length) return null
    return optDoc.routes.find(r => r.courierId === courier.id) || null
  }, [courier?.id, optDoc])

  const orderedPackages = useMemo(() => {
    if (!myRoute?.packageIds?.length) return []
    return myRoute.packageIds
      .map(id => packages.find(p => p.id === id))
      .filter(Boolean) as Package[]
  }, [myRoute, packages])

  // Rute Anda harus mengikuti nomor marker (mark), bukan nama paket
  const routeText = useMemo(() => {
    if (!orderedPackages.length) return '-'
    return orderedPackages.map((_, idx) => String(idx + 1)).join(' > ')
  }, [orderedPackages])

  // Markers: label fokus ke stop number, bukan nama paket/pelanggan
  const markers = useMemo(() => {
    const out: Array<{
      position: [number, number]
      label: string
      color?: string
      markerText?: string
    }> = []

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
        label: `Stop ${idx + 1} • ${p.locationDetail || '-'}`,
        color: '#10B981',
        markerText: String(idx + 1),
      })
    })

    return out
  }, [optDoc?.warehouse, orderedPackages])

  const routes = useMemo(() => {
    if (!myRoute) return []
    const pts = myRoute.routePath && myRoute.routePath.length > 1 ? myRoute.routePath : myRoute.route
    if (!pts?.length) return []
    const poly: [number, number][] = pts.map(p => [p.lat, p.lng])
    return [poly]
  }, [myRoute])

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div>
          <h1 className="text-3xl font-medium mb-2">Rekomendasi Pengantaran</h1>
          <p className="text-muted-foreground">Perusahaan aktif: {user.companyId || '-'}</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-2 text-sm">
            {loading ? (
              <p className="text-muted-foreground">Memuat...</p>
            ) : !courier ? (
              <p className="text-destructive">Profil kurir tidak ditemukan.</p>
            ) : !optDoc ? (
              <p className="text-muted-foreground">
                Belum ada hasil optimasi. Admin harus klik “Cari Opsi” dulu.
              </p>
            ) : !myRoute || myRoute.packageIds.length === 0 ? (
              <p className="text-muted-foreground">Tidak ada paket untuk Anda pada hasil optimasi terakhir.</p>
            ) : (
              <>
                <div className="text-xs text-muted-foreground">Generated: {optDoc.generatedAt}</div>
                <div>
                  <b>Rute Anda:</b> {routeText}
                </div>
                <div className="text-xs text-muted-foreground">
                  Jalur: {myRoute.routePath?.length ? 'OSRM (jalan nyata)' : 'Garis lurus (fallback)'} • Distance
                  (approx): {myRoute.totalDistance.toFixed(2)}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <MapView
              center={optDoc?.warehouse ? [optDoc.warehouse.lat, optDoc.warehouse.lng] : [-6.2088, 106.8456]}
              zoom={12}
              markers={markers}
              routes={routes}
              className="h-[420px] w-full rounded-xl overflow-hidden border"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}