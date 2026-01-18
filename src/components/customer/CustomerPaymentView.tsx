import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { Company, Order, PaymentMethod, PaymentStatus, User } from '@/lib/types'

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
  const [company, setCompany] = useState<Company | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [method, setMethod] = useState<PaymentMethod>('bayar_di_kantor')
  const [proofUrl, setProofUrl] = useState('')
  const [notes, setNotes] = useState('')

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
        setMethod((data.paymentMethod as PaymentMethod) || 'bayar_di_kantor')
        setProofUrl(String(data.paymentProofUrl || ''))
        setNotes(String((data as any).paymentNotes || ''))

        const cSnap = await getDoc(doc(db, 'companies', data.companyId))
        setCompany(cSnap.exists() ? ({ id: cSnap.id, ...(cSnap.data() as any) } as Company) : null)
      } catch (e) {
        console.error(e)
        toast.error('Gagal memuat order')
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId, user.id])

  const total = useMemo(() => Number((order as any)?.estimatedCost || 0), [order])

  const canSubmit = useMemo(() => {
    if (!order) return false
    if (saving) return false
    if (method === 'transfer') return !!proofUrl.trim()
    // bayar_di_kantor
    return true
  }, [order, saving, method, proofUrl])

  const submit = async () => {
    if (!order) return
    if (!canSubmit) return

    try {
      setSaving(true)

      const patch: any = {
        paymentMethod: method,
        paymentStatus: 'pending_verification' as PaymentStatus,
        paymentCreatedAt: new Date().toISOString(),
        paymentNotes: notes.trim() || null,
        updatedAt: new Date().toISOString(),
      }

      if (method === 'transfer') {
        patch.paymentProofUrl = proofUrl.trim()
      } else {
        // bayar di kantor: bukti tidak wajib
        patch.paymentProofUrl = null
      }

      await updateDoc(doc(db, 'orders', order.id), patch)

      toast.success(
        method === 'transfer'
          ? 'Bukti transfer dikirim. Menunggu verifikasi admin.'
          : 'Permintaan bayar di kantor dibuat. Silakan bayar ke admin, lalu admin verifikasi.',
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
            <p className="text-sm text-muted-foreground">Bayar di kantor atau transfer (upload bukti).</p>
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
                  <p><b>Paket:</b> {order.packageName}</p>
                  <p><b>Total:</b> Rp {total.toFixed(0)}</p>
                  <p>
                    <b>Status Pembayaran:</b>{' '}
                    <span className="font-mono">{order.paymentStatus || 'unpaid'}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Metode Pembayaran</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant={method === 'bayar_di_kantor' ? 'default' : 'outline'}
                      onClick={() => setMethod('bayar_di_kantor')}
                    >
                      Bayar di Kantor
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

                {method === 'bayar_di_kantor' && (
                  <div className="border rounded-lg p-4 text-sm space-y-1">
                    <p className="font-semibold">Instruksi</p>
                    <p>
                      Silakan bayar langsung ke admin perusahaan.
                      Setelah pembayaran diterima, admin akan verifikasi dan paket baru bisa diproses kurir.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Perusahaan: {company?.name || order.companyId}
                    </p>
                  </div>
                )}

                {method === 'transfer' && (
                  <>
                    <div className="border rounded-lg p-4 text-sm space-y-1">
                      <p className="font-semibold">Rekening Tujuan</p>
                      <p><b>Bank:</b> {company?.bankName || '-'}</p>
                      <p><b>Nama:</b> {company?.bankAccountName || '-'}</p>
                      <p><b>No Rek:</b> {company?.bankAccountNumber || '-'}</p>
                      {(!company?.bankAccountNumber || !company?.bankName) && (
                        <p className="text-xs text-destructive">Rekening belum diatur oleh owner perusahaan.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Link Bukti Transfer</Label>
                      <Input
                        placeholder="Tempel link bukti (contoh: https://...jpg)"
                        value={proofUrl}
                        onChange={e => setProofUrl(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Catatan (opsional)</Label>
                  <Input
                    placeholder="Catatan untuk admin (misal: sudah bayar ke admin A)"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                <Button disabled={!canSubmit} onClick={submit} className="w-full">
                  {saving ? 'Menyimpan...' : 'Kirim'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}