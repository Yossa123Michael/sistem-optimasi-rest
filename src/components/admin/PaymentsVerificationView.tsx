import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { User } from '@/lib/types'

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

  paymentMethod?: 'cod' | 'transfer' | null
  paymentStatus?: 'unpaid' | 'cod' | 'pending_verification' | 'paid' | 'rejected'
  paymentProofUrl?: string | null
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

      // NOTE: pakai query sederhana agar tidak butuh composite index
      const snap = await getDocs(
        query(
          collection(db, 'orders'),
          where('companyId', '==', user.companyId),
          where('status', '==', 'assigned'),
        ),
      )

      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as OrderRow))

      // tampilkan yang belum paid atau pending_verification atau cod (opsional)
      const filtered = list.filter(o =>
        (o.paymentStatus || 'unpaid') === 'unpaid' ||
        (o.paymentStatus || 'unpaid') === 'pending_verification' ||
        (o.paymentStatus || 'unpaid') === 'cod' ||
        (o.paymentStatus || 'unpaid') === 'rejected',
      )

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
      toast.success('Bukti pembayaran ditolak')
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
            Verifikasi bukti transfer atau lihat status COD/unpaid.
          </p>
        </div>

        <Card className="p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : count === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada pembayaran yang perlu dicek.</p>
          ) : (
            <div className="space-y-3">
              {rows.map(o => (
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
                      Payment: <span className="font-mono">{o.paymentStatus || 'unpaid'}</span> • Method:{' '}
                      <span className="font-mono">{o.paymentMethod || '-'}</span>
                    </p>
                    {typeof o.estimatedCost === 'number' && (
                      <p className="text-xs text-muted-foreground">
                        Total: Rp {Number(o.estimatedCost).toFixed(0)}
                      </p>
                    )}
                    {o.paymentProofUrl ? (
                      <p className="text-xs">
                        Bukti:{' '}
                        <a className="underline" href={o.paymentProofUrl} target="_blank" rel="noreferrer">
                          {o.paymentProofUrl}
                        </a>
                      </p>
                    ) : null}
                  </div>

                  {/* actions */}
                  <div className="flex gap-2 flex-wrap">
                    {(o.paymentStatus === 'pending_verification') && (
                      <>
                        <Button
                          onClick={() => verifyPaid(o)}
                          disabled={!!actingId || !o.paymentProofUrl}
                        >
                          {actingId === o.id ? 'Memproses...' : 'Verifikasi (PAID)'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => rejectPayment(o)}
                          disabled={!!actingId}
                        >
                          Tolak Bukti
                        </Button>
                      </>
                    )}

                    {(!o.paymentStatus || o.paymentStatus === 'unpaid') && (
                      <p className="text-xs text-destructive">
                        Belum bayar. (Customer harus pilih COD/transfer dulu)
                      </p>
                    )}

                    {o.paymentStatus === 'cod' && (
                      <p className="text-xs text-muted-foreground">
                        COD: boleh lanjut proses kirim (tanpa verifikasi).
                      </p>
                    )}

                    {o.paymentStatus === 'paid' && (
                      <p className="text-xs text-muted-foreground">
                        Sudah PAID.
                      </p>
                    )}

                    {o.paymentStatus === 'rejected' && (
                      <p className="text-xs text-destructive">
                        Bukti ditolak. Customer harus kirim ulang bukti.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}