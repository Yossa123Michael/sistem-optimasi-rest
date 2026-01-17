import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from '@phosphor-icons/react'
import { User } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'

type OrderDoc = {
  id: string
  packageName: string
  status: string
  trackingNumber?: string | null
  createdAt?: string
  updatedAt?: string
}

interface Props {
  user: User
  onBack?: () => void
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

export default function CustomerHistoryView({ user, onBack }: Props) {
  const [orders, setOrders] = useState<OrderDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)

        // query paling aman (tanpa orderBy) biar tidak butuh index
        const snap = await getDocs(
          query(
            collection(db, 'orders'),
            where('customerId', '==', user.id),
            limit(200),
          ),
        )

        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as OrderDoc))

        // sort di client
        list.sort((a, b) => {
          const ta = (a.createdAt || a.updatedAt || '')
          const tb = (b.createdAt || b.updatedAt || '')
          return tb.localeCompare(ta)
        })

        setOrders(list)
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
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="w-fit">
            <ArrowLeft className="mr-2" /> Kembali
          </Button>
        )}

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
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ts ? new Date(ts).toLocaleString('id-ID') : '-'}
                        </p>
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