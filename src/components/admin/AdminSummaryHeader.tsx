import { Card } from '@/components/ui/card'
import { Company, Courier, Package } from '@/lib/types'
import { useMemo } from 'react'

interface AdminSummaryHeaderProps {
  company: Company
  couriers: Courier[]
  packages: Package[]
}

export default function AdminSummaryHeader({
  company,
  couriers,
  packages,
}: AdminSummaryHeaderProps) {
  const { courierCount, packageCount } = useMemo(() => {
    const courierCount = couriers.filter(
      c => c.companyId === company.id,
    ).length

    const packageCount = packages.filter(
      p => p.companyId === company.id,
    ).length

    return { courierCount, packageCount }
  }, [company.id, couriers, packages])

  return (
    <div className="mb-6">
      <Card className="rounded-2xl border border-slate-200 px-6 py-4 shadow-sm bg-white">
        <div className="flex flex-col gap-2 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="font-medium text-slate-800">
              Masukan jumlah kurir
            </p>
            <p className="font-medium text-slate-800">
              Masukan jumlah Paket
            </p>
          </div>

          <div className="mt-2 flex flex-col items-end gap-1 text-right text-sm md:mt-0">
            <p className="font-semibold text-slate-900">
              {courierCount}
            </p>
            <p className="font-semibold text-slate-900">
              {packageCount}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}