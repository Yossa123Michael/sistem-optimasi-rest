import { useEffect, useMemo, useState } from 'react'
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
          query(
            collection(db, 'couriers'),
            where('companyId', '==', user.companyId),
            where('userId', '==', user.id),
          ),
        )
        const courierDoc = courierSnap.docs[0]
        const courierData = courierDoc
          ? ({ id: courierDoc.id, ...(courierDoc.data() as any) } as Courier)
          : null
        setCourier(courierData)

        if (!courierData?.id) {
          setPackages([])
          setSelectedPackage(null)
          return
        }

        const pSnap = await getDocs(
          query(
            collection(db, 'packages'),
            where('companyId', '==', user.companyId),
            where('courierId', '==', courierData.id),
          ),
        )
        setPackages(pSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.companyId, user.id])

  const activePkgs = useMemo(
    () => packages.filter(p => p.status !== 'delivered' && p.status !== 'failed'),
    [packages],
  )

  // tombol merah: share lokasi kurir (tanpa syarat pilih paket)
  const shareCourierLocationNow = async () => {
    if (!navigator.geolocation) return toast.error('Browser tidak mendukung GPS')
    if (!user.companyId) return toast.error('Company belum dipilih')
    if (!courier?.id) return toast.error('Profil kurir tidak ditemukan')

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

      // Kalau tidak ada paket aktif, tetap kasih info (tapi tidak ada resi yang bisa diupdate)
      if (activePkgs.length === 0) {
        toast.message('Tidak ada paket aktif. Lokasi kurir tidak dikirim ke resi manapun.')
        return
      }

      // Update semua resi paket aktif milik kurir
      await Promise.all(
        activePkgs.map(pkg => {
          if (!pkg.trackingNumber) return Promise.resolve()
          return setDoc(
            doc(db, 'publicTracking', pkg.trackingNumber),
            {
              trackingNumber: pkg.trackingNumber,
              companyId: pkg.companyId,
              status: pkg.status,
              lastLat,
              lastLng,
              lastLocation,
              updatedAt,
              // opsional: info kurir
              courierId: courier.id,
              courierName: courier.name,
            },
            { merge: true },
          )
        }),
      )

      toast.success(`Lokasi dibagikan ke ${activePkgs.length} resi`)
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
      const now = new Date().toISOString()
      await updateDoc(doc(db, 'packages', selectedPackage.id), {
        status: 'delivered',
        deliveredAt: now,
        updatedAt: now,
      })

      if (selectedPackage.trackingNumber) {
        await setDoc(
          doc(db, 'publicTracking', selectedPackage.trackingNumber),
          {
            trackingNumber: selectedPackage.trackingNumber,
            companyId: selectedPackage.companyId,
            status: 'delivered',
            updatedAt: now,
          },
          { merge: true },
        )
      }

      setPackages(prev =>
        prev.map(p => (p.id === selectedPackage.id ? { ...p, status: 'delivered' as any } : p)),
      )
      toast.success('Paket berhasil ditandai selesai!')
      setSelectedPackage(null)
    } catch (e) {
      console.error(e)
      toast.error('Gagal update status paket')
    }
  }

  const pending = packages.filter(p => p.status !== 'delivered')
  const email = selectedPackage ? String((selectedPackage as any).recipientEmail || '-') : '-'

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8 pb-28">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Update Pengiriman</h1>
          <p className="text-muted-foreground">Klik paket untuk lihat detail & tandai selesai</p>
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
                    className="w-full text-left p-4 border rounded-lg hover:bg-secondary/40 transition-colors"
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <p className="font-medium text-lg">{pkg.name}</p>
                    <p className="text-sm text-muted-foreground">{pkg.locationDetail}</p>
                    <p className="text-xs text-muted-foreground mt-1">Resi: {pkg.trackingNumber}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Dialog detail + delivered */}
        <Dialog open={!!selectedPackage} onOpenChange={open => !open && setSelectedPackage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detail Paket</DialogTitle>
            </DialogHeader>

            {selectedPackage && (
              <div className="space-y-3 text-sm">
                <div className="space-y-1">
                  <p><b>Nama Paket:</b> {selectedPackage.name}</p>
                  <p><b>Nama Penerima:</b> {selectedPackage.recipientName}</p>
                  <p><b>No. HP:</b> {selectedPackage.recipientPhone}</p>
                  <p><b>Email:</b> {email}</p>
                  <p><b>Lokasi Detail:</b> {selectedPackage.locationDetail}</p>
                  <p><b>Resi:</b> <span className="font-mono">{selectedPackage.trackingNumber}</span></p>
                  <p><b>Status:</b> {selectedPackage.status}</p>
                </div>

                <Button onClick={markDelivered} className="w-full">
                  Tandai Selesai (Delivered)
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* KOTAK MERAH: selalu 1 tombol share lokasi (tanpa syarat pilih paket) */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-center">
          <Button
            onClick={shareCourierLocationNow}
            disabled={sharing}
            className="w-full max-w-xl h-11"
          >
            {sharing ? 'Membagikan lokasi...' : 'Share lokasi terkini'}
          </Button>
        </div>
      </div>
    </div>
  )
}