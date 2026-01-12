import { useMemo, useState } from 'react'
import { Company, Courier, Package } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface InputDataViewProps {
  company: Company
  couriers: Courier[]
  packages: Package[]
  onSetCouriers: (couriers: Courier[]) => void
  onSetPackages: (packages: Package[]) => void
  onBackToOverview: () => void
}

type Step = 1 | 2

export default function InputDataView({
  company,
  couriers,
  packages,
  onSetCouriers,
  onSetPackages,
  onBackToOverview,
}: InputDataViewProps) {
  const [step, setStep] = useState<Step>(1)

  const [localCouriers, setLocalCouriers] = useState<Courier[]>(
    couriers.filter(c => c.companyId === company.id),
  )
  const [localPackages, setLocalPackages] = useState<Package[]>(
    packages.filter(p => p.companyId === company.id),
  )

  const totalCourierCapacity = useMemo(
    () => localCouriers.reduce((sum, c) => sum + (Number(c.capacity) || 0), 0),
    [localCouriers],
  )

  const totalPackageWeight = useMemo(
    () => localPackages.reduce((sum, p) => sum + (Number(p.weight) || 0), 0),
    [localPackages],
  )

  // ===== STEP 1: KELOLA KURIR (no tambah/hapus manual) =====
  const handleCourierChange = (
    id: string,
    field: keyof Courier,
    value: string,
  ) => {
    setLocalCouriers(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              [field]:
                field === 'capacity'
                  ? Number(value) || 0
                  : field === 'active'
                    ? value === 'true'
                    : value,
            }
          : c,
      ),
    )
  }

  const handleSaveCouriersAndNext = async () => {
    if (!localCouriers.length) {
      toast.error(
        'Belum ada kurir. Approve user sebagai kurir terlebih dahulu.',
      )
      return
    }

    const invalid = localCouriers.some(c => Number(c.capacity) <= 0)
    if (invalid) {
      toast.error('Kapasitas semua kurir harus lebih dari 0')
      return
    }

    try {
      await Promise.all(
        localCouriers.map(c =>
          updateDoc(doc(db, 'couriers', c.id), {
            capacity: Number(c.capacity) || 0,
            active: !!c.active,
            name: c.name || 'Kurir',
          }),
        ),
      )

      onSetCouriers(prev => {
        const other = prev.filter(c => c.companyId !== company.id)
        return [...other, ...localCouriers]
      })

      toast.success('Data kurir diperbarui')
      setStep(2)
    } catch (err) {
      console.error('Gagal update data kurir ke Firestore', err)
      toast.error('Gagal menyimpan data kurir ke server')
    }
  }

  // ===== STEP 2: PAKET (sementara delete-all) =====
  const handleAddPackageRow = () => {
    const now = new Date().toISOString()
    const newPackage: Package = {
      id: crypto.randomUUID(),
      name: `Paket ${localPackages.length + 1}`,
      recipientName: '',
      recipientPhone: '',
      latitude: 0,
      longitude: 0,
      weight: 1,
      trackingNumber: '',
      companyId: company.id,
      courierId: undefined,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      deliveredAt: undefined,
      locationDetail: '',
    }
    setLocalPackages(prev => [...prev, newPackage])
  }

  const handlePackageChange = (
    id: string,
    field: keyof Package,
    value: string,
  ) => {
    setLocalPackages(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              [field]:
                field === 'weight' ||
                field === 'latitude' ||
                field === 'longitude'
                  ? Number(value) || 0
                  : value,
            }
          : p,
      ),
    )
  }

  const handleRemovePackage = (id: string) => {
    setLocalPackages(prev => prev.filter(p => p.id !== id))
  }

  const handleSavePackages = async () => {
    if (!localPackages.length) {
      toast.error('Tambahkan minimal satu paket terlebih dahulu')
      return
    }

    const invalid = localPackages.some(
      p => !p.name || !p.recipientName || !p.locationDetail || !p.recipientPhone,
    )
    if (invalid) {
      toast.error(
        'Isi nama paket, nama penerima, no HP, dan lokasi detail untuk semua paket',
      )
      return
    }

    try {
      const snap = await getDocs(
        query(collection(db, 'packages'), where('companyId', '==', company.id)),
      )

      const deletePromises = snap.docs.map(d =>
        deleteDoc(doc(db, 'packages', d.id)),
      )
      await Promise.all(deletePromises)

      const now = new Date().toISOString()
      const newPackages: Package[] = []
      for (const p of localPackages) {
        const { id: _ignore, ...rest } = p

        const payload: any = {
          ...rest,
          companyId: company.id,
          updatedAt: now,
        }

        if (payload.courierId === undefined) delete payload.courierId
        if (payload.deliveredAt === undefined) delete payload.deliveredAt

        const ref = await addDoc(collection(db, 'packages'), payload)
        newPackages.push({ ...p, id: ref.id, updatedAt: now })
      }

      setLocalPackages(newPackages)
      onSetPackages(prev => {
        const other = prev.filter(p => p.companyId !== company.id)
        return [...other, ...newPackages]
      })

      toast.success('Data paket disimpan')
    } catch (err) {
      console.error('Gagal menyimpan data paket ke Firestore', err)
      toast.error('Gagal menyimpan data paket ke server')
    }
  }

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBackToOverview}
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Kembali ke Overview
            </button>
            <h1 className="text-2xl font-semibold mt-2">Input Data</h1>
            <p className="text-sm text-muted-foreground">
              Kelola data kurir dan paket untuk perusahaan{' '}
              <span className="font-medium">{company.name}</span>.
            </p>
          </div>

          <div className="flex gap-2">
            <StepIndicator step={1} active={step === 1} label="Kurir" />
            <StepIndicator step={2} active={step === 2} label="Paket" />
          </div>
        </div>

        {step === 1 ? (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-semibold">Kelola Kurir</h2>
                <p className="text-xs text-muted-foreground">
                  Kurir berasal dari user yang sudah di-approve sebagai kurir.
                  Atur kapasitas & status aktif di sini.
                </p>
              </div>
            </div>

            {localCouriers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada kurir. Approve user sebagai kurir terlebih dahulu dari menu Permintaan.
              </p>
            ) : (
              <div className="space-y-3">
                {localCouriers.map(courier => (
                  <div
                    key={courier.id}
                    className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr] gap-2 items-end border rounded-lg p-3"
                  >
                    <div>
                      <Label className="text-xs">Nama Kurir</Label>
                      <Input value={courier.name} disabled />
                    </div>

                    <div>
                      <Label className="text-xs">Kapasitas (kg)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={courier.capacity}
                        onChange={e =>
                          handleCourierChange(courier.id, 'capacity', e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Status</Label>
                      <select
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={courier.active ? 'true' : 'false'}
                        onChange={e =>
                          handleCourierChange(courier.id, 'active', e.target.value)
                        }
                      >
                        <option value="true">Active</option>
                        <option value="false">Non Active</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t mt-2">
              <p className="text-xs text-muted-foreground">
                Total kapasitas: {totalCourierCapacity} kg
              </p>
              <Button onClick={handleSaveCouriersAndNext} disabled={!localCouriers.length}>
                Simpan & Lanjut ke Paket
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-semibold">Data Paket</h2>
                <p className="text-xs text-muted-foreground">
                  Masukkan data paket pengiriman hari ini.
                </p>
              </div>
              <Button size="sm" onClick={handleAddPackageRow}>
                + Tambah Paket
              </Button>
            </div>

            {localPackages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada paket. Tambahkan paket pertama Anda.
              </p>
            ) : (
              <div className="space-y-3">
                {localPackages.map(pkg => (
                  <div
                    key={pkg.id}
                    className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,1fr,auto] gap-2 items-end border rounded-lg p-3"
                  >
                    <div>
                      <Label className="text-xs">Nama Paket</Label>
                      <Input
                        value={pkg.name}
                        onChange={e => handlePackageChange(pkg.id, 'name', e.target.value)}
                      />
                      <Label className="text-xs mt-2 block">Nama Penerima</Label>
                      <Input
                        value={pkg.recipientName}
                        onChange={e =>
                          handlePackageChange(pkg.id, 'recipientName', e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Berat (kg)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={pkg.weight}
                        onChange={e => handlePackageChange(pkg.id, 'weight', e.target.value)}
                      />
                      <Label className="text-xs mt-2 block">No. HP</Label>
                      <Input
                        value={pkg.recipientPhone}
                        onChange={e =>
                          handlePackageChange(pkg.id, 'recipientPhone', e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Latitude</Label>
                      <Input
                        type="number"
                        value={pkg.latitude}
                        onChange={e =>
                          handlePackageChange(pkg.id, 'latitude', e.target.value)
                        }
                      />
                      <Label className="text-xs mt-2 block">Longitude</Label>
                      <Input
                        type="number"
                        value={pkg.longitude}
                        onChange={e =>
                          handlePackageChange(pkg.id, 'longitude', e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Lokasi Detail</Label>
                      <Input
                        value={pkg.locationDetail}
                        onChange={e =>
                          handlePackageChange(pkg.id, 'locationDetail', e.target.value)
                        }
                      />
                      <Label className="text-xs mt-2 block">No. Resi (opsional)</Label>
                      <Input
                        value={pkg.trackingNumber}
                        onChange={e =>
                          handlePackageChange(pkg.id, 'trackingNumber', e.target.value)
                        }
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button variant="ghost" size="icon" onClick={() => handleRemovePackage(pkg.id)}>
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t mt-2">
              <p className="text-xs text-muted-foreground">
                Total berat paket: {totalPackageWeight} kg
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  ‹ Kembali ke Kurir
                </Button>
                <Button onClick={handleSavePackages}>Simpan Paket</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

interface StepIndicatorProps {
  step: number
  active: boolean
  label: string
}

function StepIndicator({ step, active, label }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
          active ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
        }`}
      >
        {step}
      </div>
      <span className={`text-xs ${active ? 'font-semibold' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  )
}