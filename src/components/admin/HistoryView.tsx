import { Company, Courier, Package } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { useMemo } from 'react'

interface HistoryViewProps {
  company: Company
  couriers: Courier[]
  packages: Package[]
  onBackToHome: () => void
}

export default function HistoryView({
  company,
  couriers,
  packages,
  onBackToHome,
}: HistoryViewProps) {
  const delivered = useMemo(
    () =>
      packages
        .filter(p => p.status === 'delivered')
        .sort(
          (a, b) =>
            (b.deliveredAt ? Date.parse(b.deliveredAt as any) : 0) -
            (a.deliveredAt ? Date.parse(a.deliveredAt as any) : 0),
        ),
    [packages],
  )

  const withCourier = delivered.map(p => ({
    ...p,
    courierName:
      couriers.find(c => c.id === p.courierId)?.name || 'Tidak diketahui',
  }))

  return (
    <div className="p-6 md:p-10 w-full h-full">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBackToHome}
              className="text-xs text-muted-foreground hover:underline"
            >
              ← Kembali ke Home
            </button>
            <h1 className="text-xl font-semibold mt-2">
              Riwayat Pengiriman
            </h1>
            <p className="text-xs text-muted-foreground">
              Rekap paket yang sudah terkirim untuk perusahaan{' '}
              <span className="font-medium">{company.name}</span>.
            </p>
          </div>
        </div>

        <Card className="p-4 overflow-x-auto">
          {withCourier.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada paket yang berstatus terkirim.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-[11px] text-muted-foreground">
                  <th className="py-2 pr-2 text-left">Tanggal</th>
                  <th className="py-2 pr-2 text-left">Paket</th>
                  <th className="py-2 pr-2 text-left">Penerima</th>
                  <th className="py-2 pr-2 text-left">Kurir</th>
                  <th className="py-2 pr-2 text-left">Lokasi</th>
                </tr>
              </thead>
              <tbody>
                {withCourier.map(p => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-2 align-top">
                      {p.deliveredAt
                        ? new Date(p.deliveredAt as any).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '-'}
                    </td>
                    <td className="py-2 pr-2 align-top">{p.name}</td>
                    <td className="py-2 pr-2 align-top">
                      {p.recipientName}
                    </td>
                    <td className="py-2 pr-2 align-top">{p.courierName}</td>
                    <td className="py-2 pr-2 align-top text-muted-foreground">
                      {p.locationDetail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  )
}