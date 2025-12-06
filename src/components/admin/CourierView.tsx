import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { User, Package, Courier } from '@/lib/types'
import { generateId } from '@/lib/auth'

interface CourierViewProps {
  user: User
  onActivate: () => void
}

export default function CourierView({ user, onActivate }: CourierViewProps) {
  const [courierName, setCourierName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [errors, setErrors] = useState<Set<string>>(new Set())
  
  const [couriers, setCouriers] = useKV<Courier[]>('couriers', [])
  const [packages] = useKV<Package[]>('packages', [])

  const companyCouriers = couriers?.filter(c => c.companyId === user.companyId) || []
  const companyPackages = packages?.filter(p => p.companyId === user.companyId) || []
  const activeCouriers = companyCouriers.filter(c => c.active)

  const handleActivate = () => {
    const newErrors = new Set<string>()
    
    if (!courierName.trim()) newErrors.add('courierName')
    if (!capacity.trim()) newErrors.add('capacity')

    if (newErrors.size > 0) {
      setErrors(newErrors)
      toast.error('Data kurir belum lengkap')
      return
    }

    const newCourier: Courier = {
      id: generateId(),
      name: courierName,
      capacity: parseFloat(capacity),
      active: false,
      companyId: user.companyId!,
      userId: user.id
    }

    setCouriers((current) => [...(current || []), newCourier])
    
    setCourierName('')
    setCapacity('')
    setErrors(new Set())
    
    onActivate()
  }

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Manajemen Kurir</h1>
          <p className="text-muted-foreground">Kelola data kurir pengiriman</p>
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
          <h2 className="text-xl font-semibold mb-6">Data Kurir</h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courierName">Nama Kurir *</Label>
                <Input
                  id="courierName"
                  value={courierName}
                  onChange={(e) => {
                    setCourierName(e.target.value)
                    setErrors(prev => { const next = new Set(prev); next.delete('courierName'); return next })
                  }}
                  className={errors.has('courierName') ? 'border-destructive' : ''}
                  placeholder="Nama lengkap kurir"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Kapasitas (kg) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  step="0.1"
                  value={capacity}
                  onChange={(e) => {
                    setCapacity(e.target.value)
                    setErrors(prev => { const next = new Set(prev); next.delete('capacity'); return next })
                  }}
                  className={errors.has('capacity') ? 'border-destructive' : ''}
                  placeholder="0.0"
                />
              </div>
            </div>

            <Button onClick={handleActivate} size="lg" className="w-full md:w-auto">
              Aktivasi Kurir
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
