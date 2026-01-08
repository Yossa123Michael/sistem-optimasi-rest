import { User, Package } from '@/lib/types'
import AdminMap from '@/components/admin/AdminMap'

interface CourierRecommendationViewProps {
  user: User
  packages: Package[]
}

export default function CourierRecommendationView({
  user,
  packages,
}: CourierRecommendationViewProps) {
  // sementara: urutan rekomendasi = urutan array apa adanya
  const ordered = packages
  const textRoute =
    ordered.length === 0
      ? 'Belum ada paket untuk direkomendasikan'
      : ordered.map(p => p.name).join(' -> ')

    const packagesWithLocation = (packages || []).filter(
    p =>
      typeof p.latitude === 'number' &&
      typeof p.longitude === 'number' &&
      (p.latitude !== 0 || p.longitude !== 0),
  )

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Rekomendasi Pengantaran
            </h1>
            <p className="text-sm text-muted-foreground">
              Urutan paket yang direkomendasikan untuk hari ini
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-0 h-[400px] overflow-hidden">
          {packagesWithLocation.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Belum ada paket dengan lokasi untuk ditampilkan di peta.
              </p>
            </div>
          ) : (
            <AdminMap packages={packagesWithLocation} />
          )}
        </div>
      </div>
    </div>
  )
}