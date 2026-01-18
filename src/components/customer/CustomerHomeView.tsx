import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from '@/lib/types'

interface Props {
  user: User
  onGoOrder: () => void
  onGoStatus: () => void
  onGoHistory: () => void
  onGoPayment: () => void // NEW
}

export default function CustomerHomeView({
  user,
  onGoOrder,
  onGoStatus,
  onGoHistory,
  onGoPayment,
}: Props) {
  const userName = user.name || user.email.split('@')[0]

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-medium mb-2">Halo, {userName}</h1>
          <p className="text-muted-foreground">Apa yang ingin Anda lakukan hari ini?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <CardContent className="p-0 space-y-3">
              <h2 className="text-lg font-semibold">Pesan</h2>
              <p className="text-sm text-muted-foreground">Buat pesanan baru</p>
              <Button className="w-full" onClick={onGoOrder}>
                Pesan
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardContent className="p-0 space-y-3">
              <h2 className="text-lg font-semibold">Cek Status Paket</h2>
              <p className="text-sm text-muted-foreground">Pantau status pengiriman</p>
              <Button variant="outline" className="w-full" onClick={onGoStatus}>
                Status Paket
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardContent className="p-0 space-y-3">
              <h2 className="text-lg font-semibold">Pembayaran</h2>
              <p className="text-sm text-muted-foreground">COD atau transfer (upload bukti)</p>
              <Button variant="outline" className="w-full" onClick={onGoPayment}>
                Pembayaran
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardContent className="p-0 space-y-3">
              <h2 className="text-lg font-semibold">History</h2>
              <p className="text-sm text-muted-foreground">Riwayat pesanan</p>
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