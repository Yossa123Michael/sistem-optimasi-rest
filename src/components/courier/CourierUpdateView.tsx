import { useState } from 'react'
import { User, Package } from '@/lib/types'

interface CourierUpdateViewProps {
  user: User
  packages: Package[]
  total: number
  completed: number
  remaining: number
  onUpdateStatus: (id: string, status: Package['status']) => void
}

export default function CourierUpdateView({
  user,
  packages,
  total,
  completed,
  remaining,
  onUpdateStatus,
}: CourierUpdateViewProps) {
  const [selected, setSelected] = useState<Package | null>(null)

  const handleVerifyClick = (pkg: Package) => {
    if (pkg.status === 'delivered') return
    setSelected(pkg)
  }

  const markDelivered = () => {
    if (!selected) return
    onUpdateStatus(selected.id, 'delivered')
    setSelected(null)
  }

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* header statistik */}
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* Kiri: list paket + Verifikasi/Sudah */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold mb-4">Update Paket</h2>
            <div className="space-y-2">
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  className="flex items-center justify-between text-sm border-b py-2 last:border-b-0"
                >
                  <span>{pkg.name}</span>
                  {pkg.status === 'delivered' ? (
                    <span className="text-emerald-600 font-medium">
                      Sudah
                    </span>
                  ) : (
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => handleVerifyClick(pkg)}
                    >
                      Verifikasi
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Kanan: detail paket dipilih */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold mb-4">Detail Paket</h2>
            {selected ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Nama Paket
                  </p>
                  <p className="font-medium">{selected.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Nama Penerima
                  </p>
                  <p className="font-medium">{selected.recipientName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Lokasi Detail
                  </p>
                  <p className="font-medium">{selected.locationDetail}</p>
                </div>
                <button
                  onClick={markDelivered}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                >
                  Tandai Selesai
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Pilih paket pada daftar untuk verifikasi.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}