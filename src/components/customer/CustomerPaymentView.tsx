import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { Order, PaymentMethod, PaymentStatus, User } from '@/lib/types'

export default function CustomerPaymentView({
  user,
  orderId,
  onBack,
}: {
  user: User
  orderId: string
  onBack: () => void
}) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [method, setMethod] = useState<PaymentMethod>('cod')
  const [proofUrl, setProofUrl] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const snap = await getDoc(doc(db, 'orders', orderId))
        if (!snap.exists()) {
          setOrder(null)
          return
        }
        const data = { id: snap.id, ...(snap.data() as any) } as Order
        if (data.customerId !== user.id) {
          setOrder(null)
          toast.error('Anda tidak punya akses ke order ini')
          return
        }
        setOrder(data)
        setMethod((data.paymentMethod as PaymentMethod) || 'cod')
        setProofUrl(String(data.paymentProofUrl || ''))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId, user.id])

  const total = useMemo(() => Number(order?.estimatedCost || 0), [order?.estimatedCost])

  const canSubmit = useMemo(() => {
    if (!order) return false
    if (saving) return false
    if (method === 'cod') return true
    // transfer
    return !!proofUrl.trim()
  }, [order, saving, method, proofUrl])

  const submit = async () => {
    if (!order) return
    if (!canSubmit) return

    try {
      setSaving(true)

      let nextStatus: PaymentStatus = 'unpaid'
      const patch: any = {
        paymentMethod: method,
        updatedAt: new Date().toISOString(),
      }

      if (method === 'cod') {
        nextStatus = 'cod'
        patch.paymentStatus = nextStatus
        patch.paymentProofUrl = null
        patch.paymentCreatedAt = new Date().toISOString()
      } else {
        nextStatus = 'pending_verification'
        patch.paymentStatus = nextStatus
        patch.paymentProofUrl = proofUrl.trim()
        patch.paymentCreatedAt = new Date().toISOString()
      }

      await updateDoc(doc(db, 'orders', order.id), patch)

      toast.success(
        method === 'cod'
          ? 'Metode COD dipilih. Pembayaran dilakukan saat paket diterima.'
          : 'Bukti transfer dikirim. Menunggu verifikasi admin.',
      )
      onBack()
    } catch (e: any) {
      console.error(e)
      toast.error(`Gagal menyimpan pembayaran: ${e?.code || e?.message || String(e)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Pembayaran</h1>
            <p className="text-sm text-muted-foreground">Pilih metode pembayaran dan kirim bukti jika transfer.</p>
          </div>
          <Button variant="outline" onClick={onBack}>
            Kembali
          </Button>
        </div>

        <Card className="p-6">
          <CardContent className="p-0 space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : !order ? (
              <p className="text-sm text-destructive">Order tidak ditemukan.</p>
            ) : (
              <>
                <div className="border rounded-lg p-4 text-sm space-y-1">
                  <p><b>Perusahaan:</b> {(order as any).companyName || order.companyId}</p>
                  <p><b>Paket:</b> {order.packageName}</p>
                  <p><b>Berat:</b> {order.weight} kg</p>
                  <p><b>Total:</b> Rp {total.toFixed(0)}</p>
                  <p>
                    <b>Status Pembayaran:</b>{' '}
                    <span className="font-mono">{order.paymentStatus || 'unpaid'}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Metode Pembayaran</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={method === 'cod' ? 'default' : 'outline'}
                      onClick={() => setMethod('cod')}
                    >
                      Bayar di Tempat (COD)
                    </Button>
                    <Button
                      type="button"
                      variant={method === 'transfer' ? 'default' : 'outline'}
                      onClick={() => setMethod('transfer')}
                    >
                      Transfer
                    </Button>
                  </div>
                </div>

                {method === 'transfer' && (
                  <div className="space-y-2">
                    <Label>Link Bukti Transfer</Label>
                    <Input
                      placeholder="Tempel link bukti (contoh: https://...jpg)"
                      value={proofUrl}
                      onChange={e => setProofUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Untuk upload file langsung ke Firebase Storage, bilang ya — nanti saya buatkan.
                    </p>
                  </div>
                )}

                <Button disabled={!canSubmit} onClick={submit} className="w-full">
                  {saving ? 'Menyimpan...' : 'Kirim Pembayaran'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}