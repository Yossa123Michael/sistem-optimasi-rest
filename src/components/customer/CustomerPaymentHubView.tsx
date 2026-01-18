import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { Order, User } from '@/lib/types'
import CustomerPaymentView from './CustomerPaymentView'

export default function CustomerPaymentHubView({
  user,
  onBack,
}: {
  user: User
  onBack: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)

        // TANPA orderBy -> tidak butuh composite index
        const snap = await getDocs(
          query(
            collection(db, 'orders'),
            where('customerId', '==', user.id),
            where('status', '==', 'assigned'),
            limit(20),
          ),
        )

        if (snap.empty) {
          setOrderId(null)
          return
        }

        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Order))

        // cari yang belum paid
        const candidate =
          list.find(o => o.paymentStatus !== 'paid') || list[0]

        setOrderId(candidate.id)
      } catch (e) {
        console.error(e)
        toast.error('Gagal memuat data pembayaran')
        setOrderId(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user.id])

  const hasOrder = useMemo(() => !!orderId, [orderId])

  if (hasOrder && orderId) {
    return <CustomerPaymentView user={user} orderId={orderId} onBack={onBack} />
  }

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Pembayaran</h1>
            <p className="text-sm text-muted-foreground">COD atau transfer (upload bukti).</p>
          </div>
          <Button variant="outline" onClick={onBack}>
            Kembali
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tidak ada order yang perlu dibayar. (Pastikan order sudah di-approve admin)
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}