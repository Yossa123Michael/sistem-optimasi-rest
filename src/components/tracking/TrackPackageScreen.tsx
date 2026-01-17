import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from '@phosphor-icons/react'
import { auth, db } from '@/lib/firebase'
import { collection, doc, getDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore'
import { toast } from 'sonner'
import TrackingMap from './TrackingMap'

interface TrackPackageScreenProps {
  onBack: () => void
}

export default function TrackPackageScreen({ onBack }: TrackPackageScreenProps) {
  console.log('TrackPackageScreen build signature: onSnapshot-imported')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  // simpan unsubscribe listener realtime
  const unsubRef = useRef<null | (() => void)>(null)

  // cleanup saat unmount
  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
    }
  }, [])

  const stopListener = () => {
    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }
  }

  const handleSearch = async () => {
    const resi = code.trim()
    if (!resi) return toast.error('Masukkan kode / resi')

    try {
      setLoading(true)
      setResult(null)

      // stop listener lama lalu start listener baru
      stopListener()

      const ref = doc(db, 'publicTracking', resi)

      unsubRef.current = onSnapshot(
        ref,
        snap => {
          if (!snap.exists()) {
            setResult(null)
            toast.error('Paket tidak ditemukan')
            stopListener()
            return
          }
          setResult({ id: snap.id, ...(snap.data() as any) })
        },
        err => {
          console.error(err)
          toast.error(`Tracking realtime error: ${err?.code || err?.message || String(err)}`)
        },
      )
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    stopListener()
    onBack()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button variant="ghost" size="sm" className="w-fit mb-4" onClick={handleBack}>
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
            {loading ? 'Memulai realtime...' : 'Cari (Realtime)'}
          </Button>

          {result && (
            <div className="mt-4 text-sm space-y-2">
              <div className="space-y-1">
                <p><b>Resi:</b> {result.trackingNumber || result.id}</p>
                <p><b>Status:</b> {result.status || '-'}</p>
                <p><b>Posisi Kurir:</b> {result.lastLocation || '-'}</p>
                <p><b>Update terakhir:</b> {result.updatedAt || '-'}</p>
              </div>

              {/* Jika map leaflet sudah ada */}
              {/* {typeof result.lastLat === 'number' && typeof result.lastLng === 'number' && (
                <TrackingMap lat={result.lastLat} lng={result.lastLng} label={result.lastLocation || 'Posisi kurir'} />
              )} */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}