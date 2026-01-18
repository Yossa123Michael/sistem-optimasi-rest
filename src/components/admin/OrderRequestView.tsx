import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { User } from '@/lib/types'
import { db } from '@/lib/firebase'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { assignPendingPackagesToActiveCouriers } from '@/lib/assign'

type Tab = 'created' | 'payment'

type OrderDoc = {
  id: string
  companyId: string
  companyName?: string

  customerId: string
  customerName?: string
  customerEmail?: string

  packageName: string
  recipientName: string
  recipientPhone: string
  recipientEmail?: string

  destinationDetail: string
  latitude: number
  longitude: number
  weight: number

  status: string
  trackingNumber?: string

  createdAt: string
  updatedAt: string

  estimatedCost?: number

  paymentMethod?: 'bayar_di_kantor' | 'transfer' | null
  paymentStatus?: 'unpaid' | 'pending_verification' | 'paid' | 'rejected'
  paymentProofUrl?: string | null
  paymentNotes?: string | null
  paymentCreatedAt?: string
  paymentVerifiedAt?: string
  paymentVerifiedBy?: string

  packageId?: string
}

function genTrackingNumber(prefix = 'KEL4') {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  const rand2 = Math.random().toString(36).slice(2, 4).toUpperCase()
  return `${prefix}-${rand}${rand2}`
}

export default function OrderRequestsView({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>('created')

  const [createdOrders, setCreatedOrders] = useState<OrderDoc[]>([])
  const [paymentOrders, setPaymentOrders] = useState<OrderDoc[]>([])

  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      if (!user.companyId) {
        setCreatedOrders([])
        setPaymentOrders([])
        return
      }

      const createdSnap = await getDocs(
        query(
          collection(db, 'orders'),
          where('companyId', '==', user.companyId),
          where('status', '==', 'created'),
        ),
      )
      setCreatedOrders(createdSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as OrderDoc)))

      // payment waiting verification (transfer + bayar di kantor)
      const paySnap = await getDocs(
        query(
          collection(db, 'orders'),
          where('companyId', '==', user.companyId),
          where('status', '==', 'assigned'),
          where('paymentStatus', '==', 'pending_verification'),
        ),
      )
      setPaymentOrders(paySnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as OrderDoc)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.companyId])

  const approve = async (o: OrderDoc) => {
    if (!user.companyId) return toast.error('Company belum dipilih')

    try {
      setActingId(o.id)

      const now = new Date().toISOString()
      const trackingNumber = genTrackingNumber()

      const pkgPayload: any = {
        companyId: o.companyId,
        orderId: o.id,
        awaitingPayment: true,
        courierId: '',
        name: o.packageName,
        recipientName: o.recipientName,
        recipientPhone: o.recipientPhone,
        recipientEmail: o.recipientEmail || '',
        latitude: Number(o.latitude) || 0,
        longitude: Number(o.longitude) || 0,
        weight: Number(o.weight) || 1,
        trackingNumber,
        locationDetail: o.destinationDetail || '',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      }

      const pkgRef = await addDoc(collection(db, 'packages'), pkgPayload)

      await setDoc(
        doc(db, 'publicTracking', trackingNumber),
        {
          trackingNumber,
          companyId: o.companyId,
          packageId: pkgRef.id,
          status: 'pending',
          updatedAt: now,
          lastLocation: '',
        },
        { merge: true },
      )

      await updateDoc(doc(db, 'orders', o.id), {
        status: 'assigned',
        trackingNumber,
        packageId: pkgRef.id,
        paymentStatus: o.paymentStatus || 'unpaid',
        paymentMethod: o.paymentMethod || null,
        updatedAt: now,
      })

      toast.success('Order di-approve. Menunggu pembayaran sebelum dikirim.')
      await load()
    } catch (e) {
      console.error(e)
      toast.error('Gagal approve order')
    } finally {
      setActingId(null)
    }
  }

  const reject = async (o: OrderDoc) => {
    try {
      setActingId(o.id)
      await updateDoc(doc(db, 'orders', o.id), {
        status: 'failed',
        updatedAt: new Date().toISOString(),
      })
      toast.success('Order ditolak')
      await load()
    } catch (e) {
      console.error(e)
      toast.error('Gagal reject order')
    } finally {
      setActingId(null)
    }
  }

  const unlockAndAssign = async (o: OrderDoc) => {
    if (!user.companyId) return
    if (!o.packageId) return

    await updateDoc(doc(db, 'packages', o.packageId), {
      awaitingPayment: false,
      updatedAt: new Date().toISOString(),
    })

    await assignPendingPackagesToActiveCouriers(user.companyId)
  }

  const verifyPaid = async (o: OrderDoc) => {
    try {
      setActingId(o.id)

      await updateDoc(doc(db, 'orders', o.id), {
        paymentStatus: 'paid',
        paymentVerifiedAt: new Date().toISOString(),
        paymentVerifiedBy: user.id,
        updatedAt: new Date().toISOString(),
      })

      await unlockAndAssign(o)

      toast.success('Pembayaran diverifikasi (PAID). Paket siap diantar.')
      await load()
    } catch (e) {
      console.error(e)
      toast.error('Gagal verifikasi pembayaran')
    } finally {
      setActingId(null)
    }
  }

  const rejectPayment = async (o: OrderDoc) => {
    try {
      setActingId(o.id)
      await updateDoc(doc(db, 'orders', o.id), {
        paymentStatus: 'rejected',
        paymentVerifiedAt: new Date().toISOString(),
        paymentVerifiedBy: user.id,
        updatedAt: new Date().toISOString(),
      })
      toast.success('Pembayaran ditolak')
      await load()
    } catch (e) {
      console.error(e)
      toast.error('Gagal menolak pembayaran')
    } finally {
      setActingId(null)
    }
  }

  const createdCount = useMemo(() => createdOrders.length, [createdOrders])
  const paymentCount = useMemo(() => paymentOrders.length, [paymentOrders])

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Order Masuk</h1>
            <p className="text-muted-foreground">
              Approve order → customer bayar (bayar di kantor / transfer) → admin verifikasi → baru paket diantar kurir.
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant={tab === 'created' ? 'default' : 'outline'} onClick={() => setTab('created')}>
              Menunggu Approve ({createdCount})
            </Button>
            <Button type="button" variant={tab === 'payment' ? 'default' : 'outline'} onClick={() => setTab('payment')}>
              Verifikasi Pembayaran ({paymentCount})
            </Button>
          </div>
        </div>

        <Card className="p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : tab === 'created' ? (
            createdCount === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada order yang menunggu.</p>
            ) : (
              <div className="space-y-3">
                {createdOrders.map(o => (
                  <div key={o.id} className="border rounded-lg p-4">
                    <div className="space-y-1">
                      <p className="font-semibold">{o.packageName}</p>
                      <p className="text-sm text-muted-foreground">
                        Penerima: {o.recipientName} • HP: {o.recipientPhone}
                      </p>
                      <p className="text-sm text-muted-foreground">Lokasi: {o.destinationDetail}</p>
                      <p className="text-xs text-muted-foreground">
                        Koordinat: {o.latitude}, {o.longitude} • Berat: {o.weight} kg
                      </p>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button onClick={() => approve(o)} disabled={!!actingId} className="w-full md:w-auto">
                        {actingId === o.id ? 'Memproses...' : 'Approve'}
                      </Button>
                      <Button variant="outline" onClick={() => reject(o)} disabled={!!actingId} className="w-full md:w-auto">
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : paymentCount === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada pembayaran yang menunggu verifikasi.</p>
          ) : (
            <div className="space-y-3">
              {paymentOrders.map(o => {
                const isTransfer = o.paymentMethod === 'transfer'
                const canVerify = !isTransfer || !!o.paymentProofUrl

                return (
                  <div key={o.id} className="border rounded-lg p-4">
                    <div className="space-y-1">
                      <p className="font-semibold">{o.packageName}</p>
                      <p className="text-sm text-muted-foreground">
                        Customer: {o.customerName || '-'} • {o.customerEmail || '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Method: <span className="font-mono">{o.paymentMethod || '-'}</span> • Status:{' '}
                        <span className="font-mono">{o.paymentStatus}</span>
                      </p>
                      {o.paymentNotes ? (
                        <p className="text-xs text-muted-foreground">
                          Catatan: {o.paymentNotes}
                        </p>
                      ) : null}

                      {isTransfer ? (
                        o.paymentProofUrl ? (
                          <p className="text-xs">
                            Bukti:{' '}
                            <a className="underline" href={o.paymentProofUrl} target="_blank" rel="noreferrer">
                              {o.paymentProofUrl}
                            </a>
                          </p>
                        ) : (
                          <p className="text-xs text-destructive">Transfer tapi bukti belum ada.</p>
                        )
                      ) : (
                        <p className="text-xs text-muted-foreground">Bayar di kantor: tidak butuh bukti.</p>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2 flex-wrap">
                      <Button
                        onClick={() => verifyPaid(o)}
                        disabled={!!actingId || !canVerify}
                        className="w-full md:w-auto"
                      >
                        {actingId === o.id ? 'Memproses...' : 'Approve Pembayaran (PAID)'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => rejectPayment(o)}
                        disabled={!!actingId}
                        className="w-full md:w-auto"
                      >
                        Reject Pembayaran
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