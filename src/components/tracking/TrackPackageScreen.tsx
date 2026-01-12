import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package as PackageIcon, ArrowLeft, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Package } from '@/lib/types'
import MapView from '@/components/maps/MapView'

interface TrackPackageScreenProps {
  onBack: () => void
}

export default function TrackPackageScreen({ onBack }: TrackPackageScreenProps) {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [foundPackage, setFoundPackage] = useState<Package | null>(null)
  const [packages] = useKV<Package[]>('packages', [])

  const handleTrack = () => {
    if (!trackingNumber.trim()) {
      toast.error('Masukan nomor resi')
      return
    }

    const pkg = packages?.find(p => p.trackingNumber === trackingNumber.toUpperCase())

    if (!pkg) {
      toast.error('Nomor resi salah')
      return
    }

    const packageDate = new Date(pkg.createdAt)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    if (packageDate < sixMonthsAgo) {
      toast.error('Paket hanya bisa di cek 6 bulan')
      return
    }

    setFoundPackage(pkg)
  }

  const getStatusTimeline = (pkg: Package) => {
    const timeline = [
      { status: 'Paket diterima seller', completed: true, timestamp: pkg.createdAt },
      { status: 'Paket di warehouse', completed: pkg.status !== 'pending', timestamp: pkg.updatedAt },
      { status: 'Paket dalam pengiriman', completed: pkg.status === 'in-transit' || pkg.status === 'delivered', timestamp: pkg.updatedAt },
      { status: 'Paket sampai tujuan', completed: pkg.status === 'delivered', timestamp: pkg.deliveredAt || '' }
    ]
    return timeline
  }

  if (foundPackage) {
    const timeline = getStatusTimeline(foundPackage)

    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button onClick={() => setFoundPackage(null)} variant="ghost" className="mb-4">
            <ArrowLeft size={20} className="mr-2" />
            Kembali
          </Button>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Status Pengiriman</CardTitle>
              <p className="text-muted-foreground font-mono">{foundPackage.trackingNumber}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`rounded-full p-2 ${item.completed ? 'bg-accent' : 'bg-muted'}`}>
                        {item.completed && <Check size={20} className="text-accent-foreground" />}
                        {!item.completed && <div className="w-5 h-5" />}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className={`w-0.5 h-16 ${item.completed ? 'bg-accent' : 'bg-muted'}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <p className={`font-medium ${item.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {item.status}
                      </p>
                      {item.timestamp && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(item.timestamp).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold mb-4">Lokasi Paket</h3>
                <MapView
                  center={[foundPackage.latitude, foundPackage.longitude]}
                  markers={[
                    {
                      position: [foundPackage.latitude, foundPackage.longitude],
                      label: foundPackage.name,
                      color: '#10B981'
                    }
                  ]}
                  className="h-[400px] w-full rounded-lg overflow-hidden"
                />
              </div>

              <Button onClick={() => setFoundPackage(null)} className="w-full">
                Cek Paket Lain
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary/50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-accent rounded-2xl p-4">
              <PackageIcon size={48} weight="duotone" className="text-accent-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-semibold">Cek Paket</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Paket hanya bisa di cek 6 bulan
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tracking">Nomor Resi</Label>
              <Input
                id="tracking"
                placeholder="Masukkan nomor resi"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>

            <Button onClick={handleTrack} className="w-full" size="lg">
              Cek Status
            </Button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-primary hover:underline font-medium text-sm"
            >Kembali ke Home</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
