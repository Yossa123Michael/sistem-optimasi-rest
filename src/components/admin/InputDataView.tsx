import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { User, Package, Courier } from '@/lib/types'
import { generateId, generateTrackingNumber } from '@/lib/auth'

interface InputDataViewProps {
  user: User
}

export default function InputDataView({ user }: InputDataViewProps) {
  const [packageName, setPackageName] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [weight, setWeight] = useState('')
  const [locationDetail, setLocationDetail] = useState('')
  const [errors, setErrors] = useState<Set<string>>(new Set())
  
  const [packages, setPackages] = useKV<Package[]>('packages', [])
  const [couriers] = useKV<Courier[]>('couriers', [])

  const companyPackages = packages?.filter(p => p.companyId === user.companyId) || []
  const companyCouriers = couriers?.filter(c => c.companyId === user.companyId) || []
  const activeCouriers = companyCouriers.filter(c => c.active)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors = new Set<string>()
    
    if (!packageName.trim()) newErrors.add('packageName')
    if (!recipientName.trim()) newErrors.add('recipientName')
    if (!recipientPhone.trim()) newErrors.add('recipientPhone')
    if (!latitude.trim()) newErrors.add('latitude')
    if (!longitude.trim()) newErrors.add('longitude')
    if (!weight.trim()) newErrors.add('weight')
    if (!locationDetail.trim()) newErrors.add('locationDetail')

    if (newErrors.size > 0) {
      setErrors(newErrors)
      toast.error('Data belum lengkap')
      return
    }

    const newPackage: Package = {
      id: generateId(),
      name: packageName,
      recipientName,
      recipientPhone,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      weight: parseFloat(weight),
      locationDetail,
      trackingNumber: generateTrackingNumber(),
      companyId: user.companyId!,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setPackages((current) => [...(current || []), newPackage])
    
    toast.success(`Paket berhasil ditambahkan! Nomor resi: ${newPackage.trackingNumber}`)
    
    setPackageName('')
    setRecipientName('')
    setRecipientPhone('')
    setLatitude('')
    setLongitude('')
    setWeight('')
    setLocationDetail('')
    setErrors(new Set())
  }

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Input Data Paket</h1>
          <p className="text-muted-foreground">Tambahkan paket baru untuk pengiriman</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Jumlah Kurir</p>
            <p className="text-4xl font-semibold">{companyCouriers.length}</p>
          </Card>
          
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Kurir Aktif</p>
            <p className="text-4xl font-semibold">{activeCouriers.length}</p>
          </Card>
          
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Jumlah Paket</p>
            <p className="text-4xl font-semibold">{companyPackages.length}</p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Data Paket</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packageName">Nama Paket *</Label>
                <Input
                  id="packageName"
                  value={packageName}
                  onChange={(e) => {
                    setPackageName(e.target.value)
                    setErrors(prev => { const next = new Set(prev); next.delete('packageName'); return next })
                  }}
                  className={errors.has('packageName') ? 'border-destructive' : ''}
                  placeholder="Contoh: Elektronik"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientName">Nama Penerima *</Label>
                <Input
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => {
                    setRecipientName(e.target.value)
                    setErrors(prev => { const next = new Set(prev); next.delete('recipientName'); return next })
                  }}
                  className={errors.has('recipientName') ? 'border-destructive' : ''}
                  placeholder="Nama lengkap penerima"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientPhone">No. Telepon Penerima *</Label>
                <Input
                  id="recipientPhone"
                  value={recipientPhone}
                  onChange={(e) => {
                    setRecipientPhone(e.target.value)
                    setErrors(prev => { const next = new Set(prev); next.delete('recipientPhone'); return next })
                  }}
                  className={errors.has('recipientPhone') ? 'border-destructive' : ''}
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Berat (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value)
                    setErrors(prev => { const next = new Set(prev); next.delete('weight'); return next })
                  }}
                  className={errors.has('weight') ? 'border-destructive' : ''}
                  placeholder="0.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => {
                    setLatitude(e.target.value)
                    setErrors(prev => { const next = new Set(prev); next.delete('latitude'); return next })
                  }}
                  className={errors.has('latitude') ? 'border-destructive' : ''}
                  placeholder="-6.2088"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => {
                    setLongitude(e.target.value)
                    setErrors(prev => { const next = new Set(prev); next.delete('longitude'); return next })
                  }}
                  className={errors.has('longitude') ? 'border-destructive' : ''}
                  placeholder="106.8456"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationDetail">Detail Lokasi *</Label>
              <Input
                id="locationDetail"
                value={locationDetail}
                onChange={(e) => {
                  setLocationDetail(e.target.value)
                  setErrors(prev => { const next = new Set(prev); next.delete('locationDetail'); return next })
                }}
                className={errors.has('locationDetail') ? 'border-destructive' : ''}
                placeholder="Alamat lengkap penerima"
              />
            </div>

            <Button type="submit" size="lg" className="w-full md:w-auto">
              Simpan Paket
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
