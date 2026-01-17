import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { ArrowLeft } from '@phosphor-icons/react'
import { User, Package, Courier } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore'

interface CourierActivationViewProps {
  user: User
  onBack: () => void
}

export default function CourierActivationView({ user, onBack }: CourierActivationViewProps) {
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

  const handleToggle = async (courierId: string, active: boolean) => {
    try {
      await updateDoc(doc(db, 'couriers', courierId), { active })
      setCouriers(prev => prev.map(c => (c.id === courierId ? { ...c, active } : c)))
    } catch (e) {
      console.error(e)
      toast.error('Gagal mengubah status kurir')
    }
  }

  const handleSubmit = () => {
    toast.success('Status kurir berhasil diperbarui')
    onBack()
  }

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft size={20} className="mr-2" />
          Kembali
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Aktivasi Kurir</h1>
          <p className="text-muted-foreground">Kelola status aktif kurir</p>
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
          <h2 className="text-xl font-semibold mb-6">Status Kurir</h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Memuat...</p>
            ) : companyCouriers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Belum ada kurir terdaftar</p>
            ) : (
              companyCouriers.map(courier => (
                <div key={courier.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{courier.name}</p>
                    <p className="text-xs text-muted-foreground">Kapasitas: {courier.capacity}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground">{courier.active ? 'Aktif' : 'Nonaktif'}</p>
                    <Switch checked={!!courier.active} onCheckedChange={v => handleToggle(courier.id, v)} />
                  </div>
                </div>
              ))
            )}
          </div>

          <Button className="mt-6 w-full" onClick={handleSubmit} disabled={loading}>
            Simpan
          </Button>
        </Card>
      </div>
    </div>
  )
}