import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Courier, Package } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'

type Filter = 'all' | 'delivered' | 'failed'

function badgeForStatus(status: string) {
  switch (status) {
    case 'delivered':
      return { text: 'Terkirim', variant: 'default' as const }
    case 'failed':
      return { text: 'Gagal', variant: 'destructive' as const }
    default:
      return { text: status, variant: 'secondary' as const }
  }
}

export default function CourierHistoryView({ user }: { user: User }) {
  const [courier, setCourier] = useState<Courier | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        if (!user.companyId) {
          setCourier(null)
          setPackages([])
          return
        }

        const courierSnap = await getDocs(
          query(
            collection(db, 'couriers'),
            where('companyId', '==', user.companyId),
            where('userId', '==', user.id),
            limit(1),
          ),
        )
        const courierDoc = courierSnap.docs[0]
        const courierData = courierDoc
          ? ({ id: courierDoc.id, ...(courierDoc.data() as any) } as Courier)
          : null
        setCourier(courierData)

        if (!courierData?.id) {
          setPackages([])
          return
        }

        // TANPA orderBy (biar tidak butuh composite index)
        const pSnap = await getDocs(
          query(
            collection(db, 'packages'),
            where('companyId', '==', user.companyId),
            where('courierId', '==', courierData.id),
            limit(300),
          ),
        )

        const list = pSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Package))

        // sort di client
        list.sort((a: any, b: any) => {
          const ta = String((a.deliveredAt || a.updatedAt || a.createdAt || '') as any)
          const tb = String((b.deliveredAt || b.updatedAt || b.createdAt || '') as any)
          return tb.localeCompare(ta)
        })

        setPackages(list)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user.companyId, user.id])

  const history = useMemo(() => {
    const rows = (packages || []).filter(p => p.status === 'delivered' || p.status === 'failed')
    if (filter === 'all') return rows
    return rows.filter(p => p.status === filter)
  }, [packages, filter])

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div>
          <h1 className="text-3xl font-medium mb-2">History Kurir</h1>
          {!courier ? (
            <p className="text-sm text-destructive">Profil kurir tidak ditemukan.</p>
          ) : (
            <p className="text-sm text-muted-foreground">Menampilkan paket yang sudah selesai / gagal.</p>
          )}
        </div>

        <Card>
          <CardContent className="p-4 flex flex-wrap gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} size="sm">
              Semua
            </Button>
            <Button
              variant={filter === 'delivered' ? 'default' : 'outline'}
              onClick={() => setFilter('delivered')}
              size="sm"
            >
              Terkirim
            </Button>
            <Button
              variant={filter === 'failed' ? 'default' : 'outline'}
              onClick={() => setFilter('failed')}
              size="sm"
            >
              Gagal
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada history pengantaran.</p>
            ) : (
              <div className="space-y-2">
                {history.map((p: any) => {
                  const badge = badgeForStatus(String(p.status))
                  const ts = p.deliveredAt || p.updatedAt || p.createdAt
                  return (
                    <div key={p.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.locationDetail || '-'}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.trackingNumber ? <span className="font-mono">{p.trackingNumber}</span> : null}
                          {ts ? ` • ${new Date(ts).toLocaleString('id-ID')}` : ''}
                        </p>
                      </div>
                      <Badge variant={badge.variant}>{badge.text}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}