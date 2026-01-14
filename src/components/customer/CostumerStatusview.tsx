import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { User } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, where, limit } from 'firebase/firestore'

type OrderDoc = {
  id: string
  customerId: string
  packageName: string
  status: string
  trackingNumber: string
  createdAt: string
  updatedAt: string
}

interface Props {
  user: User
}

export default function CustomerStatusView({ user }: Props) {
  const userName = user.name || user.email.split('@')[0]
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
            limit(50),
          ),
        )
        setOrders(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.id])

  const todayCount = orders.length // demo: total
  const paidCount = orders.filter(o => o.status === 'paid').length
  const doneCount = orders.filter(o => o.status === 'delivered').length

  const latest = useMemo(() => orders[0] || null, [orders])

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-medium mb-2">Halo, {userName}</h1>
          <p className="text-muted-foreground">Status Paket</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Paket hari ini</p>
            <p className="text-2xl font-semibold">{loading ? '-' : todayCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Paket Pembayaran</p>
            <p className="text-2xl font-semibold">{loading ? '-' : paidCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Paket Terselesaikan</p>
            <p className="text-2xl font-semibold">{loading ? '-' : doneCount}</p>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-3">Status Paketmu</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : !latest ? (
              <p className="text-sm text-muted-foreground">Belum ada pesanan.</p>
            ) : (
              <div className="text-sm space-y-2">
                <p><b>Nama Kurir:</b> -</p>
                <p><b>Estimasi Sampai:</b> -</p>
                <p><b>Status:</b> {latest.status}</p>
                <p><b>Nama Paket:</b> {latest.packageName}</p>
                <p><b>Resi:</b> <span className="font-mono">{latest.trackingNumber}</span></p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}