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

  // NEW (optional kalau ada)
  distanceKm?: number
  ratePerKm?: number
  estimatedCost?: number

  paymentMethod?: 'cod' | 'transfer' | null
  paymentStatus?: 'unpaid' | 'cod' | 'pending_verification' | 'paid' | 'rejected'
  paymentProofUrl?: string | null
  paymentCreatedAt?: string
  paymentVerifiedAt?: string
  paymentVerifiedBy?: string
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

      // 1) menunggu approve
      const createdSnap = await getDocs(
        query(
          collection(db, 'orders'),
          where('companyId', '==', user.companyId),
          where('status', '==', 'created'),
        ),
      )
      setCreatedOrders(createdSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as OrderDoc)))

      // 2) menunggu verifikasi pembayaran transfer
      // (order sudah assigned + paymentStatus pending_verification)
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

      // 1) packages (operasional)
      const pkgPayload: any = {
        companyId: o.companyId,
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

      // 2) publicTracking
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

      // 3) update order
      await updateDoc(doc(db, 'orders', o.id), {
        status: 'assigned',
        trackingNumber,
        // payment tetap unpaid sampai customer pilih COD/Transfer
        paymentStatus: o.paymentStatus || 'unpaid',
        paymentMethod: o.paymentMethod || null,
        updatedAt: now,
      })

      await assignPendingPackagesToActiveCouriers(user.companyId)

      toast.success('Order di-approve & paket dibuat')
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

  const verifyPaid = async (o: OrderDoc) => {
    try {
      setActingId(o.id)
      await updateDoc(doc(db, 'orders', o.id), {
        paymentStatus: 'paid',
        paymentVerifiedAt: new Date().toISOString(),
        paymentVerifiedBy: user.id,
        updatedAt: new Date().toISOString(),
      })
      toast.success('Pembayaran diverifikasi (PAID)')
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
      toast.success('Bukti pembayaran ditolak')
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
              Kelola approve/reject order dan verifikasi pembayaran transfer.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={tab === 'created' ? 'default' : 'outline'}
              onClick={() => setTab('created')}
            >
              Menunggu Approve ({createdCount})
            </Button>
            <Button
              type="button"
              variant={tab === 'payment' ? 'default' : 'outline'}
              onClick={() => setTab('payment')}
            >
              Verifikasi Transfer ({paymentCount})
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
                      {(o.customerName || o.customerEmail) && (
                        <p className="text-xs text-muted-foreground">
                          Customer: {o.customerName || '-'} • {o.customerEmail || '-'}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Payment: <span className="font-mono">{o.paymentStatus || 'unpaid'}</span>
                      </p>
                      {typeof o.estimatedCost === 'number' && (
                        <p className="text-xs text-muted-foreground">
                          Estimasi: Rp {Number(o.estimatedCost).toFixed(0)}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button onClick={() => approve(o)} disabled={!!actingId} className="w-full md:w-auto">
                        {actingId === o.id ? 'Memproses...' : 'Approve'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => reject(o)}
                        disabled={!!actingId}
                        className="w-full md:w-auto"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : paymentCount === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada pembayaran transfer yang menunggu verifikasi.</p>
          ) : (
            <div className="space-y-3">
              {paymentOrders.map(o => (
                <div key={o.id} className="border rounded-lg p-4">
                  <div className="space-y-1">
                    <p className="font-semibold">{o.packageName}</p>
                    <p className="text-sm text-muted-foreground">
                      Customer: {o.customerName || '-'} • {o.customerEmail || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status order: <span className="font-mono">{o.status}</span> • Tracking:{' '}
                      <span className="font-mono">{o.trackingNumber || '-'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Payment: <span className="font-mono">{o.paymentStatus}</span> • Method:{' '}
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
                    ) : (
                      <p className="text-xs text-destructive">Bukti belum ada.</p>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Button
                      onClick={() => verifyPaid(o)}
                      disabled={!!actingId || !o.paymentProofUrl}
                      className="w-full md:w-auto"
                    >
                      {actingId === o.id ? 'Memproses...' : 'Verifikasi (PAID)'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => rejectPayment(o)}
                      disabled={!!actingId}
                      className="w-full md:w-auto"
                    >
                      Tolak Bukti
                    </Button>
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