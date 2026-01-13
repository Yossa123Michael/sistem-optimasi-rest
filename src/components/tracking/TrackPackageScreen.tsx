import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from '@phosphor-icons/react'
import { auth, db } from '@/lib/firebase'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { toast } from 'sonner'
import TrackingMap from './TrackingMap'

interface TrackPackageScreenProps {
  onBack: () => void
}

type PublicTracking = {
  trackingNumber?: string
  status?: string
  lastLocation?: string
  lastLat?: number
  lastLng?: number
  updatedAt?: string
}

type MyPackage = {
  trackingNumber: string
  queueIndex?: number
  nextStopName?: string
  updatedAt?: string
}

export default function TrackPackageScreen({ onBack }: TrackPackageScreenProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const [result, setResult] = useState<(PublicTracking & { id: string }) | null>(null)
  const [myPkg, setMyPkg] = useState<MyPackage | null>(null)

  const handleSearch = async () => {
    const resi = code.trim()
    if (!resi) return toast.error('Masukkan kode / resi')

    try {
      setLoading(true)
      setResult(null)
      setMyPkg(null)

      // 1) PUBLIC tracking (tanpa login bisa)
      const snap = await getDoc(doc(db, 'publicTracking', resi))
      if (!snap.exists()) {
        toast.error('Paket tidak ditemukan')
        return
      }
      const publicData = { id: snap.id, ...(snap.data() as any) } as any
      setResult(publicData)

      // 2) Jika login: cek apakah paket ini milik user (via users/{uid}/myPackages)
      const uid = auth.currentUser?.uid
      if (uid) {
        const mySnap = await getDocs(
          query(collection(db, 'users', uid, 'myPackages'), where('trackingNumber', '==', resi)),
        )
        if (!mySnap.empty) {
          setMyPkg(mySnap.docs[0].data() as MyPackage)
        }
      }
    } catch (e: any) {
      console.error(e)
      toast.error(`Gagal mencari paket: ${e?.code || e?.message || String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button variant="ghost" size="sm" className="w-fit mb-4" onClick={onBack}>
            <ArrowLeft className="mr-2" />
            Kembali
          </Button>
          <CardTitle className="text-2xl">Cek Paket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Masukkan resi / tracking"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <Button className="w-full" onClick={handleSearch} disabled={loading}>
            {loading ? 'Mencari...' : 'Cari'}
          </Button>

          {result && (
            <div className="mt-4 text-sm space-y-3">
              {myPkg && (
                <div className="rounded-lg border p-3 bg-primary/5">
                  <p className="font-medium">
                    Paket anda dalam antrian ke{' '}
                    <span className="text-primary">
                      {myPkg.nextStopName || '(tujuan berikutnya belum di-set)'}
                    </span>
                  </p>
                  {typeof myPkg.queueIndex === 'number' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Posisi antrian: {myPkg.queueIndex}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <p><b>Resi:</b> {result.trackingNumber || result.id}</p>
                <p><b>Status:</b> {result.status || '-'}</p>
                <p><b>Posisi Kurir:</b> {result.lastLocation || '-'}</p>
                <p><b>Update terakhir:</b> {result.updatedAt || '-'}</p>
              </div>

              {typeof result.lastLat === 'number' && typeof result.lastLng === 'number' && (
                <TrackingMap
                  lat={result.lastLat}
                  lng={result.lastLng}
                  label={result.lastLocation || 'Posisi terakhir kurir'}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}