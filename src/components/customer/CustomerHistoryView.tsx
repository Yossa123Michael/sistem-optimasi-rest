import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { User } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, where, limit } from 'firebase/firestore'

type OrderDoc = {
  id: string
  packageName: string
  status: string
  createdAt: string
  updatedAt: string
}

interface Props {
  user: User
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
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada history.</p>
            ) : (
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="font-medium">{o.packageName}</p>
                      <p className="text-xs text-muted-foreground">Status: {o.status}</p>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      <div>{(o.createdAt || '').slice(0, 10)}</div>
                      <div>{(o.createdAt || '').slice(11, 16)}</div>
                    </div>
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