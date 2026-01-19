import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { User } from '@/lib/types'

type PaymentMethod = 'bayar_di_kantor' | 'transfer' | null

type PaymentStatus = 'unpaid' | 'pending_verification' | 'paid' | 'rejected'

type OrderRow = {
  id: string
  companyId: string
  customerId: string
  customerName?: string
  customerEmail?: string
  packageName: string
  status: string
  trackingNumber?: string
  estimatedCost?: number

  paymentMethod?: PaymentMethod
  paymentStatus?: PaymentStatus
  paymentProofUrl?: string | null
  paymentNotes?: string | null
  paymentCreatedAt?: string
  updatedAt?: string
}

export default function PaymentsVerificationView({ user }: { user: User }) {
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [rows, setRows] = useState<OrderRow[]>([])

  const load = async () => {
    if (!user.companyId) return
    try {
      setLoading(true)

      // Query agar tidak butuh composite index:
      // Ambil order assigned milik company, lalu filter di client
      const snap = await getDocs(
        query(
          collection(db, 'orders'),
          where('companyId', '==', user.companyId),
          where('status', '==', 'assigned'),
        ),
      )

      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as OrderRow))

      // Tampilkan yang sedang menunggu verifikasi pembayaran
      const filtered = list.filter(o => (o.paymentStatus || 'unpaid') === 'pending_verification')

      setRows(filtered)
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat data pembayaran')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.companyId])

  const verifyPaid = async (o: OrderRow) => {
    try {
      setActingId(o.id)
      await updateDoc(doc(db, 'orders', o.id), {
        paymentStatus: 'paid',
        paymentVerifiedAt: new Date().toISOString(),
        paymentVerifiedBy: user.id,
        updatedAt: new Date().toISOString(),
      })
      toast.success('Pembayaran diverifikasi: PAID')
      load()
    } catch (e) {
      console.error(e)
      toast.error('Gagal verifikasi pembayaran')
    } finally {
      setActingId(null)
    }
  }

  const rejectPayment = async (o: OrderRow) => {
    try {
      setActingId(o.id)
      await updateDoc(doc(db, 'orders', o.id), {
        paymentStatus: 'rejected',
        paymentVerifiedAt: new Date().toISOString(),
        paymentVerifiedBy: user.id,
        updatedAt: new Date().toISOString(),
      })
      toast.success('Pembayaran ditolak')
      load()
    } catch (e) {
      console.error(e)
      toast.error('Gagal menolak pembayaran')
    } finally {
      setActingId(null)
    }
  }

  const count = useMemo(() => rows.length, [rows])

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Cek Pembayaran</h1>
          <p className="text-muted-foreground">
            Verifikasi pembayaran customer: <b>Transfer</b> (pakai bukti) atau <b>Bayar di Kantor</b> (tanpa bukti).
          </p>
        </div>

        <Card className="p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : count === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada pembayaran yang menunggu verifikasi.</p>
          ) : (
            <div className="space-y-3">
              {rows.map(o => {
                const method = (o.paymentMethod || null) as PaymentMethod
                const isTransfer = method === 'transfer'
                const proofOk = !!(o.paymentProofUrl && String(o.paymentProofUrl).trim())
                const canVerify = !isTransfer || proofOk

                return (
                  <div key={o.id} className="border rounded-lg p-4 space-y-2">
                    <div className="space-y-1">
                      <p className="font-semibold">{o.packageName}</p>

                      <p className="text-xs text-muted-foreground">
                        Customer: {o.customerName || '-'} • {o.customerEmail || '-'}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Tracking: <span className="font-mono">{o.trackingNumber || '-'}</span>
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Payment:{' '}
                        <span className="font-mono">{o.paymentStatus || 'unpaid'}</span> • Method:{' '}
                        <span className="font-mono">{o.paymentMethod || '-'}</span>
                      </p>

                      {typeof o.estimatedCost === 'number' && (
                        <p className="text-xs text-muted-foreground">
                          Total: Rp {Number(o.estimatedCost).toFixed(0)}
                        </p>
                      )}

                      {o.paymentNotes ? (
                        <p className="text-xs text-muted-foreground">
                          Catatan: {o.paymentNotes}
                        </p>
                      ) : null}

                      {isTransfer ? (
                        proofOk ? (
                          <p className="text-xs">
                            Bukti:{' '}
                            <a className="underline" href={o.paymentProofUrl!} target="_blank" rel="noreferrer">
                              {o.paymentProofUrl}
                            </a>
                          </p>
                        ) : (
                          <p className="text-xs text-destructive">Transfer tapi bukti belum ada.</p>
                        )
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Bayar di kantor: verifikasi berdasarkan konfirmasi admin (tanpa bukti).
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => verifyPaid(o)}
                        disabled={!!actingId || !canVerify}
                      >
                        {actingId === o.id ? 'Memproses...' : 'Approve (PAID)'}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => rejectPayment(o)}
                        disabled={!!actingId}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}