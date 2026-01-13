import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { User, Package, Courier } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, updateDoc, doc, setDoc } from 'firebase/firestore'

interface CourierUpdateViewProps {
  user: User
}

type ShareMode = 'travel' | 'stop'

export default function CourierUpdateView({ user }: CourierUpdateViewProps) {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [courier, setCourier] = useState<Courier | null>(null)
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        if (!user.companyId) return

        const courierSnap = await getDocs(
          query(collection(db, 'couriers'), where('companyId', '==', user.companyId), where('userId', '==', user.id)),
        )
        const courierDoc = courierSnap.docs[0]
        const courierData = courierDoc ? ({ id: courierDoc.id, ...(courierDoc.data() as any) } as Courier) : null
        setCourier(courierData)

        if (!courierData?.id) {
          setPackages([])
          return
        }

        const pSnap = await getDocs(
          query(collection(db, 'packages'), where('companyId', '==', user.companyId), where('courierId', '==', courierData.id)),
        )
        setPackages(pSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.companyId, user.id])

  const shareLiveLocation = async () => {
  if (!selectedPackage?.trackingNumber) return toast.error('Tracking number kosong')
  if (!navigator.geolocation) return toast.error('Browser tidak mendukung GPS')

  try {
    setSharing(true)
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      })
    })

    const lastLat = pos.coords.latitude
    const lastLng = pos.coords.longitude
    const updatedAt = new Date().toISOString()
    const lastLocation = `Lat ${lastLat.toFixed(6)}, Lng ${lastLng.toFixed(6)}`

    await setDoc(
      doc(db, 'publicTracking', selectedPackage.trackingNumber),
      {
        trackingNumber: selectedPackage.trackingNumber,
        companyId: selectedPackage.companyId,
        status: selectedPackage.status,
        lastLat,
        lastLng,
        lastLocation,
        updatedAt,
      },
      { merge: true },
    )

    toast.success('Lokasi terkini berhasil dibagikan')
  } catch (e: any) {
    console.error(e)
    toast.error(`Gagal membagikan lokasi: ${e?.message || String(e)}`)
  } finally {
    setSharing(false)
  }
}

  const markDelivered = async () => {
    if (!selectedPackage) return
    try {
      await updateDoc(doc(db, 'packages', selectedPackage.id), {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Optional: update publik juga supaya status tracking ikut berubah cepat
      if (selectedPackage.trackingNumber) {
        await setDoc(
          doc(db, 'publicTracking', selectedPackage.trackingNumber),
          {
            trackingNumber: selectedPackage.trackingNumber,
            companyId: selectedPackage.companyId,
            status: 'delivered',
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        )
      }

      setPackages(prev => prev.map(p => (p.id === selectedPackage.id ? { ...p, status: 'delivered' as any } : p)))
      toast.success('Paket berhasil ditandai selesai!')
      setSelectedPackage(null)
    } catch (e) {
      console.error(e)
      toast.error('Gagal update status paket')
    }
  }

  const pending = packages.filter(p => p.status !== 'delivered')

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Update Pengiriman</h1>
          <p className="text-muted-foreground">Tandai paket yang telah diselesaikan</p>
        </div>

        {!user.companyId ? (
          <Card className="p-6">
            <p className="text-sm text-destructive">Belum pilih perusahaan.</p>
          </Card>
        ) : !courier && !loading ? (
          <Card className="p-6">
            <p className="text-sm text-destructive">Profil kurir tidak ditemukan.</p>
          </Card>
        ) : (
          <Card className="p-6">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada paket yang perlu diupdate.</p>
            ) : (
              <div className="space-y-3">
                {pending.map(pkg => (
                  <button
                    key={pkg.id}
                    className="w-full text-left p-4 border rounded-lg hover:bg-secondary transition-colors"
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <p className="font-medium">{pkg.name}</p>
                    <p className="text-sm text-muted-foreground">{pkg.locationDetail}</p>
                    <p className="text-xs text-muted-foreground mt-1">Resi: {pkg.trackingNumber}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}

        <Dialog open={!!selectedPackage} onOpenChange={open => !open && setSelectedPackage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Paket</DialogTitle>
                <Button variant="outline" onClick={shareLiveLocation} disabled={sharing}>
                  {sharing ? 'Memproses...' : 'Share lokasi terkini'}
                </Button>
            </DialogHeader>

            {selectedPackage && (
              <div className="space-y-3">
                <div className="text-sm space-y-1">
                  <p><b>Paket:</b> {selectedPackage.name}</p>
                  <p><b>Resi:</b> {selectedPackage.trackingNumber}</p>
                  <p><b>Status:</b> {selectedPackage.status}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => shareLiveLocation('travel')}
                    disabled={sharing}
                  >
                    {sharing ? 'Memproses...' : 'Share lokasi (Perjalanan)'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => shareLiveLocation('stop')}
                    disabled={sharing}
                  >
                    {sharing ? 'Memproses...' : 'Share lokasi (Sampai Stop)'}
                  </Button>
                </div>

                <Button onClick={markDelivered} className="w-full">
                  Tandai Selesai (Delivered)
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}