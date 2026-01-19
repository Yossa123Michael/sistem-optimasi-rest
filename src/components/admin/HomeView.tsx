import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { User, Company, Package, Courier, RouteOptimization } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'
import MapView from '@/components/maps/MapView'
import { optimizeRoutes } from '@/lib/route-optimizer'
import { getOsrmRoutePath, LatLng } from '@/lib/osrm'
import { assignPendingPackagesToActiveCouriers } from '@/lib/assign'

function removeUndefinedDeep<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(v => removeUndefinedDeep(v)).filter(v => v !== undefined) as any
  }
  if (obj && typeof obj === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(obj as any)) {
      if (v === undefined) continue
      out[k] = removeUndefinedDeep(v)
    }
    return out
  }
  return obj
}

interface HomeViewProps {
  user: User
}

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

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6']

export default function HomeView({ user }: HomeViewProps) {
  const userName = user.name || user.email.split('@')[0]
  const [company, setCompany] = useState<Company | null>(null)
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [optDoc, setOptDoc] = useState<RouteOptimDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        if (!user.companyId) {
          setCompany(null)
          setCouriers([])
          setPackages([])
          setOptDoc(null)
          return
        }

        const cSnap = await getDoc(doc(db, 'companies', user.companyId))
        const comp = cSnap.exists() ? ({ id: cSnap.id, ...(cSnap.data() as any) } as Company) : null
        setCompany(comp)

        const courSnap = await getDocs(query(collection(db, 'couriers'), where('companyId', '==', user.companyId)))
        setCouriers(courSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Courier)))

        const pSnap = await getDocs(query(collection(db, 'packages'), where('companyId', '==', user.companyId)))
        setPackages(pSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Package)))

        const optSnap = await getDoc(doc(db, 'routeOptimizations', user.companyId))
        setOptDoc(optSnap.exists() ? ({ ...(optSnap.data() as any) } as RouteOptimDoc) : null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.companyId])

  const activeCouriers = useMemo(() => couriers.filter(c => c.active), [couriers])

  const officeLat = company?.officeLocation?.lat
  const officeLng = company?.officeLocation?.lng

const markers = useMemo(() => {
  const out: Array<{ position: [number, number]; label: string; color?: string; markerText?: string }> = []

  if (typeof officeLat === 'number' && typeof officeLng === 'number') {
    out.push({
      position: [officeLat, officeLng],
      label: `Kantor (${company?.name || '-'})`,
      color: '#1D4ED8',
      markerText: 'K',
    })
  }

  const activePackages = packages.filter(p => p.status !== 'delivered' && p.status !== 'failed')

  activePackages.forEach((p, idx) => {
    out.push({
      position: [p.latitude, p.longitude],
      label: `Stop ${idx + 1} • ${p.locationDetail || '-'}`,
      color: '#10B981',
      markerText: String(idx + 1),
    })
  })

  return out
}, [officeLat, officeLng, company?.name, packages])

  const routePolylines = useMemo(() => {
    if (!optDoc?.routes?.length) return []

    return optDoc.routes
      .filter(r => (r.routePath?.length || r.route?.length))
      .map((r, idx) => {
        const pts = (r.routePath && r.routePath.length > 1) ? r.routePath : r.route
        const poly: [number, number][] = pts.map(p => [p.lat, p.lng])
        return { points: poly, color: COLORS[idx % COLORS.length] }
      })
  }, [optDoc])

  const handleOptimize = async () => {
    if (!user.companyId) return toast.error('Company belum dipilih')
    if (!company?.officeLocation) return toast.error('Lokasi kantor belum di-set oleh owner')
    if (activeCouriers.length === 0) return toast.error('Tidak ada kurir aktif')
    if (packages.length === 0) return toast.error('Belum ada paket')

    try {
      setOptimizing(true)

      const activePackages = packages.filter(p => p.status !== 'delivered' && p.status !== 'failed')
      const optimizations: RouteOptimization[] = optimizeRoutes(
        activePackages,
        activeCouriers,
        company.officeLocation.lat,
        company.officeLocation.lng,
      )

      if (!optimizations.length) {
        toast.error('Tidak ada rute yang bisa dibuat (cek kapasitas kurir / paket).')
        return
      }

      const warehouse: LatLng = { lat: company.officeLocation.lat, lng: company.officeLocation.lng }

      const baseRoutes: RouteOptimDoc['routes'] = optimizations.map(o => ({
        courierId: o.courierId,
        courierName: o.courierName,
        packageIds: o.packages.map(p => p.id),
        route: o.route.map(([lat, lng]) => ({ lat, lng })),
        totalDistance: o.totalDistance,
      }))

      const enrichedRoutes: RouteOptimDoc['routes'] = await Promise.all(
        baseRoutes.map(async r => {
          try {
            const orderedPkgs = r.packageIds
              .map(id => activePackages.find(p => p.id === id))
              .filter(Boolean) as Package[]

            const points: LatLng[] = [warehouse, ...orderedPkgs.map(p => ({ lat: p.latitude, lng: p.longitude }))]
            const routePath = await getOsrmRoutePath(points, 'driving')

            return Array.isArray(routePath) && routePath.length ? { ...r, routePath } : r
          } catch {
            return r
          }
        }),
      )

      const payload: RouteOptimDoc = {
  companyId: user.companyId,
  generatedAt: new Date().toISOString(),
  warehouse,
  routes: enrichedRoutes,
}

const cleaned = removeUndefinedDeep(payload)

await setDoc(doc(db, 'routeOptimizations', user.companyId), cleaned, { merge: true })
setOptDoc(cleaned)

await assignPendingPackagesToActiveCouriers(user.companyId!)

      toast.success('Optimasi berhasil dibuat. Rute berwarna per kurir ditampilkan di peta.')
    } catch (e) {
      console.error(e)
      toast.error('Gagal menjalankan optimasi')
    } finally {
      setOptimizing(false)
    }
  }

  const reloadPackagesAndOpt = async () => {
  if (!user.companyId) return

  const pSnap = await getDocs(query(collection(db, 'packages'), where('companyId', '==', user.companyId)))
  setPackages(pSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Package)))

  const optSnap = await getDoc(doc(db, 'routeOptimizations', user.companyId))
  setOptDoc(optSnap.exists() ? ({ ...(optSnap.data() as any) } as RouteOptimDoc) : null)
}

  if (!user.companyId) {
    return (
      <div className="p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          <Card className="border-destructive/50">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Anda belum memilih perusahaan.
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-medium mb-2">Dashboard Admin</h1>
          <p className="text-lg text-muted-foreground">Selamat datang, {userName}</p>
          {company && <p className="text-sm text-muted-foreground mt-1">Perusahaan: {company.name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Jumlah Kurir (Aktif)</p>
            <p className="text-4xl font-semibold">{loading ? '-' : activeCouriers.length}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Jumlah Kurir (Total)</p>
            <p className="text-4xl font-semibold">{loading ? '-' : couriers.length}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Jumlah Paket</p>
            <p className="text-4xl font-semibold">{loading ? '-' : packages.length}</p>
          </Card>
        </div>

        <Card className="p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Peta (Kantor & Paket)</h2>
              <p className="text-sm text-muted-foreground">
                Marker biru: kantor. Marker hijau: lokasi paket. Garis: rute per kurir (warna berbeda).
              </p>
              {optDoc?.generatedAt && (
                <p className="text-xs text-muted-foreground mt-1">Generated: {optDoc.generatedAt}</p>
              )}
            </div>

            <Button onClick={handleOptimize} disabled={loading || optimizing}>
              {optimizing ? 'Mengoptimasi...' : 'Cari Opsi'}
            </Button>
          </div>

          <MapView
            center={
              typeof officeLat === 'number' && typeof officeLng === 'number'
                ? [officeLat, officeLng]
                : [-6.2088, 106.8456]
            }
            zoom={12}
            markers={markers}
            routes={routePolylines}
            className="h-[420px] w-full rounded-xl overflow-hidden border"
          />
        </Card>
      </div>
    </div>
  )
}