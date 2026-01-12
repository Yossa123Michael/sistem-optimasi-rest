import { Card, CardContent } from '@/components/ui/card'
import { User } from '@/lib/types'

interface CourierRecommendationViewProps {
  user: User
}

export default function CourierRecommendationView({ user }: CourierRecommendationViewProps) {
  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div>
          <h1 className="text-3xl font-medium mb-2">Rekomendasi Rute</h1>
          <p className="text-muted-foreground">Perusahaan aktif: {user.companyId || '-'}</p>
        </div>

        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Fitur rekomendasi rute akan memakai data paket dari Firestore + OSRM.
            Untuk sekarang ini placeholder agar aplikasi compile dan tidak pakai Spark KV.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}