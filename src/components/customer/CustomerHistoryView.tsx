import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, where, limit } from 'firebase/firestore'

type OrderDoc = {
  id: string
  packageName: string
  status: string
  trackingNumber?: string
  createdAt: string
  updatedAt: string
}

interface Props {
  user: User
}

function statusLabel(s: string) {
  switch (s) {
    case 'created':
      return { text: 'Menunggu Approve', variant: 'secondary' as const }
    case 'assigned':
      return { text: 'Diproses', variant: 'default' as const }
    case 'in-transit':
      return { text: 'Dikirim', variant: 'default' as const }
    case 'delivered':
      return { text: 'Terkirim', variant: 'default' as const }
    case 'failed':
      return { text: 'Ditolak/Gagal', variant: 'destructive' as const }
    default:
      return { text: s, variant: 'secondary' as const }
  }
}

export default function CustomerHistoryView({ user }: Props) {
  const [orders, setOrders] = useState<OrderDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const snap = await getDocs(
          query(
            collection(db, 'orders'),
            where('customerId', '==', user.id),
            orderBy('createdAt', 'desc'),
            limit(100),
          ),
        )
        setOrders(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.id])

  const rows = useMemo(() => orders || [], [orders])

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-medium mb-2">History</h1>
          <p className="text-muted-foreground">Riwayat pesanan Anda</p>
        </div>

        <Card>
          <CardContent className="p-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada history.</p>
            ) : (
              <div className="space-y-3">
                {rows.map(o => {
                  const ts = o.createdAt || o.updatedAt
                  const badge = statusLabel(o.status)
                  return (
                    <div key={o.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="space-y-1">
                        <p className="font-medium">{o.packageName}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={badge.variant}>{badge.text}</Badge>
                          {o.trackingNumber ? (
                            <span className="text-xs text-muted-foreground font-mono">
                              {o.trackingNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Belum ada resi</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <div>{(ts || '').slice(0, 10)}</div>
                        <div>{(ts || '').slice(11, 16)}</div>
                      </div>
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