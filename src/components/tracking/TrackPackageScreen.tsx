import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from '@phosphor-icons/react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { toast } from 'sonner'

interface TrackPackageScreenProps {
  onBack: () => void
}

export default function TrackPackageScreen({ onBack }: TrackPackageScreenProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  const handleSearch = async () => {
    if (!code.trim()) return toast.error('Masukkan kode / resi')

    try {
      setLoading(true)
      setResult(null)

      // Asumsi field trackingNumber atau code. Sesuaikan dengan schema Anda.
      const snap = await getDocs(
        query(collection(db, 'packages'), where('trackingNumber', '==', code.trim()))
      )

      if (snap.empty) {
        toast.error('Paket tidak ditemukan')
        return
      }

      const d = snap.docs[0]
      setResult({ id: d.id, ...(d.data() as any) })
    } catch (e) {
      console.error(e)
      toast.error('Gagal mencari paket')
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
            <div className="mt-4 text-sm">
              <p><b>Nama Paket:</b> {result.name || '-'}</p>
              <p><b>Status:</b> {result.status || '-'}</p>
              <p><b>Penerima:</b> {result.recipientName || '-'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}