import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { User, Package, Courier, RouteOptimization } from '@/lib/types'
import { optimizeRoutes, generateBetterRoute } from '@/lib/route-optimizer'
import MapView from '@/components/maps/MapView'

interface MonitoringViewProps {
  user: User
}

export default function MonitoringView({ user }: MonitoringViewProps) {
  const [optimizations, setOptimizations] = useState<RouteOptimization[]>([])
  const [currentAttempt, setCurrentAttempt] = useState(0)
  const [bestOptimization, setBestOptimization] = useState<RouteOptimization | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)

  const [packages] = useKV<Package[]>('packages', [])
  const [couriers] = useKV<Courier[]>('couriers', [])

  const companyPackages = packages?.filter(p => p.companyId === user.companyId && p.status === 'pending') || []
  const companyCouriers = couriers?.filter(c => c.companyId === user.companyId) || []
  const activeCouriers = companyCouriers.filter(c => c.active)

  const handleFindRoutes = () => {
    if (companyPackages.length === 0) {
      toast.error('Tidak ada paket untuk dioptimasi')
      return
    }

    if (activeCouriers.length === 0) {
      toast.error('Tidak ada kurir aktif')
      return
    }

    setIsOptimizing(true)
    
    setTimeout(() => {
      const results = optimizeRoutes(companyPackages, activeCouriers)
      setOptimizations(results)
      setCurrentAttempt(1)
      
      if (results.length > 0) {
        const best = results.reduce((prev, current) => 
          current.totalDistance < prev.totalDistance ? current : prev
        )
        setBestOptimization(best)
        toast.success('Rute berhasil ditemukan!')
      }
      
      setIsOptimizing(false)
    }, 1000)
  }

  const handleFindBetterRoute = () => {
    if (!bestOptimization) return

    setIsOptimizing(true)
    
    setTimeout(() => {
      const newOptimizations = optimizations.map(opt => generateBetterRoute(opt))
      setOptimizations(newOptimizations)
      setCurrentAttempt(prev => prev + 1)
      
      const newBest = newOptimizations.reduce((prev, current) => 
        current.totalDistance < prev.totalDistance ? current : prev
      )
      
      if (newBest.totalDistance < bestOptimization.totalDistance) {
        setBestOptimization(newBest)
        toast.success('Rute yang lebih baik ditemukan!')
      } else {
        toast.info('Rute terbaik masih yang sebelumnya')
      }
      
      setIsOptimizing(false)
    }, 800)
  }

  const markers = companyPackages.map(pkg => ({
    position: [pkg.latitude, pkg.longitude] as [number, number],
    label: pkg.name,
    color: '#3B82F6'
  }))

  const routes = bestOptimization ? [bestOptimization.route] : []

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Monitoring & Optimasi Rute</h1>
          <p className="text-muted-foreground">Temukan rute pengiriman terbaik</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Jumlah Kurir</p>
            <p className="text-4xl font-semibold">{companyCouriers.length}</p>
          </Card>
          
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Kurir Aktif</p>
            <p className="text-4xl font-semibold">{activeCouriers.length}</p>
          </Card>
          
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Paket Pending</p>
            <p className="text-4xl font-semibold">{companyPackages.length}</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Peta Rute</h2>
                {optimizations.length === 0 ? (
                  <Button onClick={handleFindRoutes} disabled={isOptimizing}>
                    {isOptimizing ? 'Mencari...' : 'Cari Opsi Rute'}
                  </Button>
                ) : (
                  <Button onClick={handleFindBetterRoute} disabled={isOptimizing} variant="outline">
                    {isOptimizing ? 'Mengoptimasi...' : 'Cari Opsi Terbaik Lainnya'}
                  </Button>
                )}
              </div>
              <MapView
                markers={markers}
                routes={routes}
                className="h-[600px] w-full rounded-lg overflow-hidden"
              />
            </Card>
          </div>

          <div className="space-y-6">
            {optimizations.length > 0 && (
              <>
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Percobaan Saat Ini</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Percobaan ke-</p>
                      <p className="text-3xl font-semibold">{currentAttempt}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rute Ditemukan</p>
                      <p className="text-3xl font-semibold">{optimizations.length}</p>
                    </div>
                  </div>
                </Card>

                {bestOptimization && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Opsi Terbaik</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Kurir</p>
                        <p className="font-medium">{bestOptimization.courierName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Jarak</p>
                        <p className="text-2xl font-semibold">
                          {bestOptimization.totalDistance.toFixed(2)} km
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Jumlah Paket</p>
                        <p className="text-2xl font-semibold">
                          {bestOptimization.packages.length}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Semua Rute</h3>
                  <div className="space-y-3">
                    {optimizations.map((opt, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <p className="font-medium text-sm">{opt.courierName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {opt.packages.length} paket • {opt.totalDistance.toFixed(2)} km
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
