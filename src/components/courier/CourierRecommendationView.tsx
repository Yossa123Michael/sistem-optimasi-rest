import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { User, Package, Courier } from '@/lib/types'
import MapView from '@/components/maps/MapView'
import { ArrowRight } from '@phosphor-icons/react'

interface CourierRecommendationViewProps {
  user: User
}

export default function CourierRecommendationView({ user }: CourierRecommendationViewProps) {
  const [packages] = useKV<Package[]>('packages', [])
  const [couriers] = useKV<Courier[]>('couriers', [])

  const courier = couriers?.find(c => c.userId === user.id)
  const courierPackages = packages?.filter(p => p.courierId === courier?.id && p.status !== 'delivered') || []

  const markers = courierPackages.map(pkg => ({
    position: [pkg.latitude, pkg.longitude] as [number, number],
    label: pkg.name,
    color: '#10B981'
  }))

  const route: [number, number][] = courierPackages.length > 0
    ? [
        [-6.2088, 106.8456],
        ...courierPackages.map(p => [p.latitude, p.longitude] as [number, number])
      ]
    : []

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Rekomendasi Pengantaran</h1>
          <p className="text-muted-foreground">Rute optimal untuk pengiriman</p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Urutan Pengantaran</h2>
          {courierPackages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Belum ada paket untuk diantar
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {courierPackages.map((pkg, index) => (
                <div key={pkg.id} className="flex items-center gap-3">
                  <div className="bg-accent text-accent-foreground px-4 py-2 rounded-lg font-medium">
                    {pkg.name}
                  </div>
                  {index < courierPackages.length - 1 && (
                    <ArrowRight size={20} className="text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Peta Rute</h2>
          <MapView
            markers={markers}
            routes={route.length > 0 ? [route] : []}
            className="h-[600px] w-full rounded-lg overflow-hidden"
          />
        </Card>
      </div>
    </div>
  )
}
