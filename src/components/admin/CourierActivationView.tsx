import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { ArrowLeft } from '@phosphor-icons/react'
import { User, Package, Courier } from '@/lib/types'

interface CourierActivationViewProps {
  user: User
  onBack: () => void
}

export default function CourierActivationView({ user, onBack }: CourierActivationViewProps) {
  const [couriers, setCouriers] = useKV<Courier[]>('couriers', [])
  const [packages] = useKV<Package[]>('packages', [])

  const companyCouriers = couriers?.filter(c => c.companyId === user.companyId) || []
  const companyPackages = packages?.filter(p => p.companyId === user.companyId) || []
  const activeCouriers = companyCouriers.filter(c => c.active)

  const handleToggle = (courierId: string, active: boolean) => {
    setCouriers((current) =>
      (current || []).map(c =>
        c.id === courierId ? { ...c, active } : c
      )
    )
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
          <h2 className="text-xl font-semibold mb-6">Status Kurir</h2>
          <div className="space-y-4">
            {companyCouriers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Belum ada kurir terdaftar
              </p>
            ) : (
              companyCouriers.map((courier) => (
                <div
                  key={courier.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{courier.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Kapasitas: {courier.capacity} kg
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {courier.active ? 'Active' : 'Inactive'}
                    </span>
                    <Switch
                      checked={courier.active}
                      onCheckedChange={(checked) => handleToggle(courier.id, checked)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {companyCouriers.length > 0 && (
            <Button onClick={handleSubmit} size="lg" className="w-full mt-6">
              Simpan Perubahan
            </Button>
          )}
        </Card>
      </div>
    </div>
  )
}
