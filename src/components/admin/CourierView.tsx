import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { User, Package, Courier } from '@/lib/types'
import { db } from '@/lib/firebase'
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore'

interface CourierViewProps {
  user: User
  onActivate: () => void
}

export default function CourierView({ user, onActivate }: CourierViewProps) {
  const [courierName, setCourierName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [errors, setErrors] = useState<Set<string>>(new Set())

  const [couriers, setCouriers] = useState<Courier[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        if (!user.companyId) return

        const cSnap = await getDocs(query(collection(db, 'couriers'), where('companyId', '==', user.companyId)))
        setCouriers(cSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))

        const pSnap = await getDocs(query(collection(db, 'packages'), where('companyId', '==', user.companyId)))
        setPackages(pSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.companyId])

  const companyCouriers = useMemo(() => couriers, [couriers])
  const companyPackages = useMemo(() => packages, [packages])
  const activeCouriers = useMemo(() => companyCouriers.filter(c => c.active), [companyCouriers])

  const handleActivate = async () => {
    const newErrors = new Set<string>()
    if (!courierName.trim()) newErrors.add('courierName')
    if (!capacity.trim()) newErrors.add('capacity')

    if (newErrors.size > 0) {
      setErrors(newErrors)
      toast.error('Data kurir belum lengkap')
      return
    }

    if (!user.companyId) {
      toast.error('Company belum dipilih')
      return
    }

    try {
      const newCourier: Omit<Courier, 'id'> & any = {
        name: courierName.trim(),
        capacity: parseFloat(capacity),
        active: false,
        companyId: user.companyId,
        // optional: link ke user pembuat. Silakan sesuaikan logic Anda.
        userId: user.id,
        createdAt: new Date().toISOString(),
      }

      const ref = await addDoc(collection(db, 'couriers'), newCourier)
      setCouriers(prev => [...prev, { id: ref.id, ...(newCourier as any) }])

      setCourierName('')
      setCapacity('')
      setErrors(new Set())

      toast.success('Kurir berhasil ditambahkan')
      onActivate()
    } catch (e) {
      console.error(e)
      toast.error('Gagal menambahkan kurir')
    }
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
            <p className="text-4xl font-semibold">{loading ? '-' : companyCouriers.length}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Kurir Aktif</p>
            <p className="text-4xl font-semibold">{loading ? '-' : activeCouriers.length}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Jumlah Paket</p>
            <p className="text-4xl font-semibold">{loading ? '-' : companyPackages.length}</p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Tambah Kurir</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Kurir</Label>
              <Input
                value={courierName}
                onChange={e => setCourierName(e.target.value)}
                className={errors.has('courierName') ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label>Kapasitas</Label>
              <Input
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                className={errors.has('capacity') ? 'border-destructive' : ''}
              />
            </div>
          </div>

          <Button className="mt-4 w-full" onClick={handleActivate} disabled={loading}>
            Tambah Kurir
          </Button>
        </Card>
      </div>
    </div>
  )
}