import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { User } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, getDocs, limit, onSnapshot, orderBy, query, where, doc } from 'firebase/firestore'
import TrackingMap from '@/components/tracking/TrackingMap'

type OrderDoc = {
  id: string
  customerId: string
  companyId: string
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

type PublicTrackingDoc = {
  trackingNumber: string
  companyId: string
  status?: string
  updatedAt?: string
  lastLocation?: string
  lastLat?: number
  lastLng?: number
}

export default function CostumerStatusview({ user }: { user: User }) {
  const userName = user.name || user.email.split('@')[0]
  const [latestOrder, setLatestOrder] = useState<OrderDoc | null>(null)
  const [tracking, setTracking] = useState<PublicTrackingDoc | null>(null)
  const [loading, setLoading] = useState(true)

  // unsubscribe realtime tracking saat resi berubah
  const unsubRef = useRef<null | (() => void)>(null)

  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current()
      unsubRef.current = null
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setTracking(null)

        // stop previous tracking listener
        if (unsubRef.current) {
          unsubRef.current()
          unsubRef.current = null
        }

        // latest order
        const snap = await getDocs(
          query(
            collection(db, 'orders'),
            where('customerId', '==', user.id),
            orderBy('createdAt', 'desc'),
            limit(1),
          ),
        )

        const order = snap.docs[0]
          ? ({ id: snap.docs[0].id, ...(snap.docs[0].data() as any) } as OrderDoc)
          : null

        setLatestOrder(order)

        // attach realtime tracking if trackingNumber exists
        const tn = order?.trackingNumber?.trim()
        if (tn) {
          const ref = doc(db, 'publicTracking', tn)
          unsubRef.current = onSnapshot(
            ref,
            s => {
              if (!s.exists()) {
                setTracking(null)
                return
              }
              setTracking({ ...(s.data() as any) } as PublicTrackingDoc)
            },
            err => {
              console.error(err)
              setTracking(null)
            },
          )
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user.id])

  const effectiveStatus = useMemo(() => {
    // prioritas: publicTracking (realtime)
    if (tracking?.status) return tracking.status
    // fallback: order.status
    return latestOrder?.status || '-'
  }, [tracking?.status, latestOrder?.status])

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-medium mb-2">Halo, {userName}</h1>
          <p className="text-muted-foreground">Status Paket</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-3">Status Paketmu (Realtime)</h2>

            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : !latestOrder ? (
              <p className="text-sm text-muted-foreground">Belum ada pesanan.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p><b>Nama Paket:</b> {latestOrder.packageName}</p>
                    <p><b>Nama Penerima:</b> {latestOrder.recipientName}</p>
                    <p><b>No. HP:</b> {latestOrder.recipientPhone}</p>
                    <p><b>Email:</b> {latestOrder.recipientEmail || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p><b>Status:</b> {effectiveStatus}</p>
                    <p><b>Resi:</b> <span className="font-mono">{latestOrder.trackingNumber || '-'}</span></p>
                    <p><b>Lokasi Kurir:</b> {tracking?.lastLocation || '-'}</p>
                    <p><b>Update terakhir:</b> {tracking?.updatedAt || latestOrder.updatedAt || '-'}</p>
                  </div>
                </div>

                {typeof tracking?.lastLat === 'number' && typeof tracking?.lastLng === 'number' && (
                  <TrackingMap
                    lat={tracking.lastLat}
                    lng={tracking.lastLng}
                    label={tracking.lastLocation || 'Posisi kurir'}
                  />
                )}

                {!latestOrder.trackingNumber && (
                  <p className="text-xs text-muted-foreground">
                    Pesanan Anda masih menunggu approve admin (belum ada resi).
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}