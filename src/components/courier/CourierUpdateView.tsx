import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { User, Package, Courier } from '@/lib/types'

interface CourierUpdateViewProps {
  user: User
}

export default function CourierUpdateView({ user }: CourierUpdateViewProps) {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [packages, setPackages] = useKV<Package[]>('packages', [])
  const [couriers] = useKV<Courier[]>('couriers', [])

  const courier = couriers?.find(c => c.userId === user.id)
  const courierPackages = packages?.filter(p => p.courierId === courier?.id) || []
  const totalToday = courierPackages.length
  const remaining = courierPackages.filter(p => p.status !== 'delivered').length
  const completed = courierPackages.filter(p => p.status === 'delivered').length

  const handleMarkDelivered = () => {
    if (!selectedPackage) return

    setPackages((current) =>
      (current || []).map(p =>
        p.id === selectedPackage.id
          ? { ...p, status: 'delivered', deliveredAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : p
      )
    )

    toast.success('Paket berhasil ditandai selesai!')
    setSelectedPackage(null)
  }

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Update Pengiriman</h1>
          <p className="text-muted-foreground">Tandai paket yang telah diselesaikan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 md:col-span-1">
            <p className="text-sm text-muted-foreground mb-2">Paket Hari Ini</p>
            <p className="text-4xl font-semibold text-accent">{totalToday}</p>
          </Card>
          
          <div className="grid grid-cols-2 gap-6 md:col-span-2">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Paket Tersisa</p>
              <p className="text-4xl font-semibold text-primary">{remaining}</p>
            </Card>
            
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Paket Terselesaikan</p>
              <p className="text-4xl font-semibold text-accent">{completed}</p>
            </Card>
          </div>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Update Paket</h2>
          <div className="space-y-3">
            {courierPackages.filter(p => p.status !== 'delivered').length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                Semua paket sudah diselesaikan!
              </p>
            ) : (
              courierPackages
                .filter(p => p.status !== 'delivered')
                .map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className="w-full p-4 border rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{pkg.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{pkg.recipientName}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Update
                      </Button>
                    </div>
                  </button>
                ))
            )}
          </div>
        </Card>
      </div>

      {selectedPackage && (
        <Dialog open={!!selectedPackage} onOpenChange={() => setSelectedPackage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Info Paket</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nama Paket</p>
                    <p className="font-medium">{selectedPackage.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nama Penerima</p>
                    <p className="font-medium">{selectedPackage.recipientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">No. HP</p>
                    <p className="font-medium font-mono">{selectedPackage.recipientPhone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lokasi Detail</p>
                  <p className="font-medium">{selectedPackage.locationDetail}</p>
                </div>
              </div>
              <Button onClick={handleMarkDelivered} className="w-full" size="lg">
                Sudah Terkirim
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
