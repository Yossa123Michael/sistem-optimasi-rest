import { User, Package } from '@/lib/types'

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

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-2">Rekomendasi Pengantaran</h2>
          <p className="text-sm text-muted-foreground">{textRoute}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 h-[400px] flex items-center justify-center">
          {/* nanti MapView dengan urutan marker */}
          <p className="text-sm text-muted-foreground">
            Peta dan mark urutan lokasi
          </p>
        </div>
      </div>
    </div>
  )
}