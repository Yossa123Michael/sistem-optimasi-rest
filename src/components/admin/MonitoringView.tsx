import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Package, Courier } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

interface MonitoringViewProps {
  user: User
}

export default function MonitoringView({ user }: MonitoringViewProps) {
  const [packages, setPackages] = useState<Package[]>([])
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        if (!user.companyId) {
          setPackages([])
          setCouriers([])
          return
        }

        const pSnap = await getDocs(query(collection(db, 'packages'), where('companyId', '==', user.companyId)))
        setPackages(pSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))

        const cSnap = await getDocs(query(collection(db, 'couriers'), where('companyId', '==', user.companyId)))
        setCouriers(cSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.companyId])

  const getCourierName = (courierId?: string) => {
    if (!courierId) return '-'
    return couriers.find(c => c.id === courierId)?.name || '-'
  }

  const active = useMemo(() => packages.filter(p => p.status !== 'delivered' && p.status !== 'failed'), [packages])

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Monitoring</h1>
          <p className="text-muted-foreground">Pantau status pengiriman paket</p>
        </div>

        <Card className="p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : active.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada paket aktif.</p>
          ) : (
            <div className="space-y-3">
              {active.map(p => (
                <div key={p.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Kurir: {getCourierName(p.courierId)}</p>
                  </div>
                  <Badge variant="outline">{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}