import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { User, Package, Courier } from '@/lib/types'

interface HistoryViewProps {
  user: User
}

export default function HistoryView({ user }: HistoryViewProps) {
  const [packages] = useKV<Package[]>('packages', [])
  const [couriers] = useKV<Courier[]>('couriers', [])

  const companyPackages = packages?.filter(
    p => p.companyId === user.companyId && (p.status === 'delivered' || p.status === 'failed')
  ) || []

  const getCourierName = (courierId?: string) => {
    if (!courierId) return '-'
    const courier = couriers?.find(c => c.id === courierId)
    return courier?.name || '-'
  }

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">
            History ({new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})
          </h1>
          <p className="text-muted-foreground">Riwayat pengiriman paket</p>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paket</TableHead>
                <TableHead>Kurir</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companyPackages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    Belum ada riwayat pengiriman
                  </TableCell>
                </TableRow>
              ) : (
                companyPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>{getCourierName(pkg.courierId)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={pkg.status === 'delivered' ? 'default' : 'destructive'}
                        className={pkg.status === 'delivered' ? 'bg-accent' : ''}
                      >
                        {pkg.status === 'delivered' ? 'Terkirim' : 'Gagal'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {pkg.deliveredAt
                        ? new Date(pkg.deliveredAt).toLocaleString('id-ID')
                        : new Date(pkg.updatedAt).toLocaleString('id-ID')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
