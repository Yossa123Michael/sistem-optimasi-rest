import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { User, Company } from '@/lib/types'
import { generateCode } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface CreateCompanyScreenProps {
  user: User
  onBack: () => void
  onCompanyCreated: (companyId: string) => void
}

function OfficePicker({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function CreateCompanyScreen({
  user,
  onBack,
  onCompanyCreated,
}: CreateCompanyScreenProps) {
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [officeLocation, setOfficeLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: -6.2088,
    lng: 106.8456,
  })

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        setMapCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      () => {
        // ignore, pakai default
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const handleCreateCompany = async () => {
    if (!companyName.trim()) {
      toast.error('Masukan nama perusahaan')
      return
    }
    if (!officeLocation) {
      toast.error('Pilih lokasi kantor pada peta')
      return
    }

    try {
      setLoading(true)
      const newCompanyData: Omit<Company, 'id'> = {
        name: companyName.trim(),
        code: generateCode(),
        ownerId: user.id,
        createdAt: new Date().toISOString(),
        officeLocation: {
          lat: officeLocation.lat,
          lng: officeLocation.lng,
        },
      }

      const docRef = await addDoc(collection(db, 'companies'), {
        ...newCompanyData,
        createdAt: serverTimestamp(),
      })

      const newCompanyId = docRef.id
      console.log('New company created in Firestore with id:', newCompanyId)

      toast.success(`Perusahaan berhasil dibuat! Kode: ${newCompanyData.code}`)
      onCompanyCreated(newCompanyId)
    } catch (error) {
      console.error('Error creating company in Firestore:', error)
      toast.error('Terjadi kesalahan saat membuat perusahaan di database')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit mb-4"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2" />
            Kembali
          </Button>
          <CardTitle className="text-2xl">Buat Perusahaan Baru</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nama Perusahaan</Label>
            <Input
              id="company-name"
              placeholder="Masukkan nama perusahaan"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              onKeyDown={e =>
                e.key === 'Enter' && !loading && handleCreateCompany()
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Lokasi Kantor (klik pada peta)</Label>

            <div className="h-64 w-full overflow-hidden rounded-lg border">
              <MapContainer
                center={[mapCenter.lat, mapCenter.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />

                <OfficePicker
                  onPick={(lat, lng) => {
                    setOfficeLocation({ lat, lng })
                  }}
                />

                {officeLocation && (
                  <Marker position={[officeLocation.lat, officeLocation.lng]} />
                )}
              </MapContainer>
            </div>

            {!officeLocation && (
              <p className="text-xs text-muted-foreground">
                Pilih titik lokasi kantor pada peta.
              </p>
            )}
          </div>

          <Button
            onClick={handleCreateCompany}
            className="w-full"
            disabled={loading || !officeLocation}
          >
            {loading ? 'Menyimpan...' : 'Buat Perusahaan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}