import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { User, Package, Courier } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore'

interface CourierUpdateViewProps {
  user: User
}

export default function CourierUpdateView({ user }: CourierUpdateViewProps) {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [courier, setCourier] = useState<Courier | null>(null)
  const [loading, setLoading] = useState(true)

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

  const markDelivered = async () => {
    if (!selectedPackage) return
    try {
      await updateDoc(doc(db, 'packages', selectedPackage.id), {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

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
            <p className="text-sm text-destructive">Profil kurir belum dibuat oleh admin.</p>
          </Card>
        ) : (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Paket Aktif</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : pending.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">Semua paket sudah diselesaikan!</p>
            ) : (
              <div className="space-y-3">
                {pending.map(p => (
                  <div key={p.id} className="flex items-center justify-between border rounded-lg p-4">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Status: {p.status}</p>
                    </div>
                    <Button onClick={() => setSelectedPackage(p)}>Tandai Selesai</Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        <Dialog open={!!selectedPackage} onOpenChange={() => setSelectedPackage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi</DialogTitle>
            </DialogHeader>
            <p className="text-sm">
              Tandai paket <b>{selectedPackage?.name}</b> sebagai terkirim?
            </p>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setSelectedPackage(null)}>
                Batal
              </Button>
              <Button onClick={markDelivered}>Ya, terkirim</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}