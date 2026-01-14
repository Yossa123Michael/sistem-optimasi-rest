import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from '@/lib/types'

interface CustomerHomeViewProps {
  user: User
  onGoStatus?: () => void
  onGoHistory?: () => void
}

export default function CustomerHomeView({ user, onGoStatus, onGoHistory }: CustomerHomeViewProps) {
  const userName = user.name || user.email.split('@')[0]

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-medium mb-2">Halo, {userName}</h1>
          <p className="text-muted-foreground">Selamat datang di Customer Dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <CardContent className="p-0 space-y-3">
              <h2 className="text-lg font-semibold">Pemesanan</h2>
              <p className="text-sm text-muted-foreground">Buat pesanan pengiriman baru</p>
              <Button className="w-full">Pesan</Button>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardContent className="p-0 space-y-3">
              <h2 className="text-lg font-semibold">Cek Status Paket</h2>
              <p className="text-sm text-muted-foreground">Lihat status paket dan estimasi</p>
              <Button variant="outline" className="w-full" onClick={onGoStatus}>
                Status Paket
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardContent className="p-0 space-y-3">
              <h2 className="text-lg font-semibold">Pembayaran</h2>
              <p className="text-sm text-muted-foreground">Pilih metode pembayaran</p>
              <Button variant="outline" className="w-full" disabled>
                Pembayaran (Next)
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardContent className="p-0 space-y-3">
              <h2 className="text-lg font-semibold">History</h2>
              <p className="text-sm text-muted-foreground">Riwayat pesanan Anda</p>
              <Button variant="outline" className="w-full" onClick={onGoHistory}>
                History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}