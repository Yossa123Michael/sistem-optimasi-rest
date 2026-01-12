import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { User, Package } from '@/lib/types'

interface CourierPackageListViewProps {
  user: User
  packages: Package[]
  myRoute: string[]
  total: number
  completed: number
  remaining: number
}

export default function CourierPackageListView({
  packages,
  myRoute,
  total,
  completed,
  remaining,
}: CourierPackageListViewProps) {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)

  const courierPackages =
    myRoute && myRoute.length
      ? (myRoute
          .map(id => packages.find(p => p.id === id))
          .filter(Boolean) as Package[])
      : packages

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-1">List Paket</h1>
            <p className="text-muted-foreground">
              Daftar paket pengiriman hari ini
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Paket hari ini</p>
              <p className="text-2xl font-semibold">{total}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paket Tersisa</p>
              <p className="text-2xl font-semibold">{remaining}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Paket Terselesaikan
              </p>
              <p className="text-2xl font-semibold">{completed}</p>
            </div>
          </div>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">List Paket</h2>
          <div className="space-y-3">
            {courierPackages.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                Belum ada paket ditugaskan
              </p>
            ) : (
              courierPackages.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className="w-full p-4 border rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{pkg.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pkg.locationDetail}
                      </p>
                    </div>
                    <Badge
                      variant={pkg.status === 'delivered' ? 'default' : 'outline'}
                      className={pkg.status === 'delivered' ? 'bg-accent' : ''}
                    >
                      {pkg.status === 'delivered' ? 'Selesai' : 'Pending'}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {selectedPackage && (
        <Dialog
          open={!!selectedPackage}
          onOpenChange={() => setSelectedPackage(null)}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detail Paket</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Nama Paket
                    </p>
                    <p className="font-medium">{selectedPackage.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Nama Penerima
                    </p>
                    <p className="font-medium">{selectedPackage.recipientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">No. HP</p>
                    <p className="font-medium font-mono">
                      {selectedPackage.recipientPhone}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Lokasi Detail
                  </p>
                  <p className="font-medium">{selectedPackage.locationDetail}</p>
                </div>
              </div>

              <div className="h-[400px] w-full rounded-lg overflow-hidden border flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Peta lokasi paket ({selectedPackage.latitude},{' '}
                  {selectedPackage.longitude})
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}