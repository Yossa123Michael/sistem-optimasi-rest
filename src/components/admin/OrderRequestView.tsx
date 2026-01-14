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

type OrderDoc = {
  id: string
  companyId: string

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
}

function genTrackingNumber(prefix = 'KEL4') {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  const rand2 = Math.random().toString(36).slice(2, 4).toUpperCase()
  return `${prefix}-${rand}${rand2}`
}

export default function OrderRequestsView({ user }: { user: User }) {
  const [orders, setOrders] = useState<OrderDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      if (!user.companyId) return setOrders([])

      const snap = await getDocs(
        query(
          collection(db, 'orders'),
          where('companyId', '==', user.companyId),
          where('status', '==', 'created'),
        ),
      )
      setOrders(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as OrderDoc)))
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
        updatedAt: now,
      })

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

  const count = useMemo(() => orders.length, [orders])

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Order Masuk</h1>
          <p className="text-muted-foreground">Menunggu approve/reject (status: created)</p>
        </div>

        <Card className="p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : count === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada order yang menunggu.</p>
          ) : (
            <div className="space-y-3">
              {orders.map(o => (
                <div key={o.id} className="border rounded-lg p-4">
                  <div className="space-y-1">
                    <p className="font-semibold">{o.packageName}</p>
                    <p className="text-sm text-muted-foreground">
                      Penerima: {o.recipientName} • HP: {o.recipientPhone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Lokasi: {o.destinationDetail}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Koordinat: {o.latitude}, {o.longitude} • Berat: {o.weight} kg
                    </p>
                    {(o.customerName || o.customerEmail) && (
                      <p className="text-xs text-muted-foreground">
                        Customer: {o.customerName || '-'} • {o.customerEmail || '-'}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={() => approve(o)}
                      disabled={!!actingId}
                      className="w-full md:w-auto"
                    >
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
          )}
        </Card>
      </div>
    </div>
  )
}