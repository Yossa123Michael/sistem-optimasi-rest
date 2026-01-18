import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { Order, User } from '@/lib/types'
import CustomerPaymentView from './CustomerPaymentView'

function ts(o: any) {
  const v = o?.updatedAt || o?.createdAt
  const n = Date.parse(v)
  return Number.isFinite(n) ? n : 0
}

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
            limit(50),
          ),
        )

        if (snap.empty) {
          setOrderId(null)
          return
        }

        // ✅ FIX: tutup map dengan benar
        const list = snap.docs.map(
          d => ({ id: d.id, ...(d.data() as any) } as Order),
        )

        // 1) urutkan terbaru dulu (client-side)
        const sorted = [...list].sort((a, b) => ts(b) - ts(a))

        // 2) pilih yang belum paid
        const unpaid = sorted.filter(o => (o.paymentStatus || 'unpaid') !== 'paid')

        const candidate = unpaid[0] || sorted[0] || null
        setOrderId(candidate ? candidate.id : null)
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
            <p className="text-sm text-muted-foreground">
              Bayar di kantor atau transfer (upload bukti).
            </p>
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