import { User, Package } from '@/lib/types'

interface CourierHomeViewProps {
  user: User
  packages: Package[]
  total: number
  completed: number
  remaining: number
}

export default function CourierHomeView({
  user,
  packages,
  total,
  completed,
  remaining,
}: CourierHomeViewProps) {
  // nanti kamu bisa hitung center peta dari packages
  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header dengan statistik */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Halo,{' '}
              <span className="font-semibold">{user.name || user.email}</span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Paket hari ini</p>
              <p className="text-2xl font-semibold">{total}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paket Tersisa</p>
              <p className="text-2xl font-semibold">{remaining}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Paket Terselesaikan
              </p>
              <p className="text-2xl font-semibold">{completed}</p>
            </div>
          </div>
        </div>

        {/* Peta dan mark lokasi pengiriman paket */}
        <div className="rounded-xl border bg-card p-4 h-[400px] flex items-center justify-center">
          {/* Nanti ganti dengan MapView */}
          <p className="text-sm text-muted-foreground">
            Peta dan mark lokasi pengiriman paket
          </p>
        </div>
      </div>
    </div>
  )
}