import { useEffect, useMemo, useState } from 'react'
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
  setDoc,
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

function toNumber(v: any) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function randomUpperAlnum(len: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function genTrackingNumber() {
  return `KEL4-${randomUpperAlnum(10)}`
}

export default function InputDataView({
  company,
  couriers,
  packages,
  onSetCouriers,
  onSetPackages,
  onBackToOverview,
}: InputDataViewProps) {
  const [step, setStep] = useState<Step>(1)

  const companyCouriers = useMemo(
    () => couriers.filter(c => c.companyId === company.id),
    [couriers, company.id],
  )
  const companyPackages = useMemo(
    () => packages.filter(p => p.companyId === company.id),
    [packages, company.id],
  )

  const [localCouriers, setLocalCouriers] = useState<Courier[]>(companyCouriers)
  const [localPackages, setLocalPackages] = useState<Package[]>(companyPackages)

  const [saving, setSaving] = useState(false)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    setLocalCouriers(companyCouriers)
  }, [companyCouriers])

  useEffect(() => {
    setLocalPackages(companyPackages)
  }, [companyPackages])

  const totalCourierCapacity = useMemo(
    () => localCouriers.reduce((sum, c) => sum + (toNumber(c.capacity) || 0), 0),
    [localCouriers],
  )

  const totalPackageWeight = useMemo(
    () => localPackages.reduce((sum, p) => sum + (toNumber(p.weight) || 0), 0),
    [localPackages],
  )

  // ===== STEP 1: Kurir (nama readonly, edit kapasitas) =====
  const handleCourierCapacityChange = (id: string, value: string) => {
    setLocalCouriers(prev =>
      prev.map(c => (c.id === id ? { ...c, capacity: toNumber(value) } : c)),
    )
  }

  const handleSaveCouriersAndNext = async () => {
    if (!localCouriers.length) {
      toast.error('Belum ada kurir. Owner harus approve user sebagai kurir terlebih dahulu.')
      return
    }
    const invalid = localCouriers.some(c => toNumber(c.capacity) <= 0)
    if (invalid) {
      toast.error('Kapasitas semua kurir harus lebih dari 0 kg')
      return
    }

    try {
      await Promise.all(
        localCouriers.map(c =>
          updateDoc(doc(db, 'couriers', c.id), { capacity: toNumber(c.capacity) || 0 }),
        ),
      )

      onSetCouriers(prev => {
        const other = prev.filter(c => c.companyId !== company.id)
        return [...other, ...localCouriers]
      })

      toast.success('Kapasitas kurir disimpan')
      setStep(2)
    } catch (err) {
      console.error(err)
      toast.error('Gagal menyimpan data kurir')
    }
  }

  // ===== STEP 2: Paket (tambah paket manual) =====
  const handleAddPackageRow = () => {
    const now = new Date().toISOString()
    const p: Package = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: `Paket ${localPackages.length + 1}`,
      recipientName: '',
      recipientPhone: '',
      latitude: 0,
      longitude: 0,
      weight: 1,
      trackingNumber: genTrackingNumber(),
      companyId: company.id,
      courierId: undefined,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      deliveredAt: undefined,
      locationDetail: '',
    }
    ;(p as any).recipientEmail = ''
    setLocalPackages(prev => [...prev, p])
  }

  const handlePackageChange = (id: string, field: string, value: string) => {
    setLocalPackages(prev =>
      prev.map(p => {
        if (p.id !== id) return p
        const next: any = { ...p, updatedAt: new Date().toISOString() }

        if (field === 'weight' || field === 'latitude' || field === 'longitude') {
          next[field] = toNumber(value)
        } else {
          next[field] = value
        }

        return next
      }),
    )
  }

  const handleRemovePackage = (id: string) => {
    setLocalPackages(prev => prev.filter(p => p.id !== id))
  }

  // ===== Assign packages to ACTIVE couriers (round-robin) =====
  const assignPendingToActiveCouriers = async () => {
    setAssigning(true)
    try {
      const cSnap = await getDocs(
        query(
          collection(db, 'couriers'),
          where('companyId', '==', company.id),
          where('active', '==', true),
        ),
      )
      const activeCouriers = cSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Courier))

      if (activeCouriers.length === 0) {
        toast.error('Tidak ada kurir aktif. Aktifkan kurir terlebih dahulu.')
        return { assigned: 0 }
      }

      const pSnap = await getDocs(
        query(
          collection(db, 'packages'),
          where('companyId', '==', company.id),
          where('status', '==', 'pending'),
        ),
      )
      const pendingPkgs = pSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Package))
      const unassigned = pendingPkgs.filter(p => !p.courierId)

      if (unassigned.length === 0) return { assigned: 0 }

      const now = new Date().toISOString()

      await Promise.all(
        unassigned.map((pkg, idx) => {
          const courier = activeCouriers[idx % activeCouriers.length]
          return updateDoc(doc(db, 'packages', pkg.id), {
            courierId: courier.id,
            status: 'in-transit',
            updatedAt: now,
          })
        }),
      )

      await Promise.all(
        unassigned.map(pkg => {
          if (!pkg.trackingNumber) return Promise.resolve()
          return setDoc(
            doc(db, 'publicTracking', pkg.trackingNumber),
            {
              trackingNumber: pkg.trackingNumber,
              companyId: pkg.companyId,
              status: 'in-transit',
              updatedAt: now,
            },
            { merge: true },
          )
        }),
      )

      // refresh state packages for admin UI
      const refreshed = await getDocs(
        query(collection(db, 'packages'), where('companyId', '==', company.id)),
      )
      const loaded = refreshed.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Package))

      onSetPackages(prev => {
        const other = prev.filter(pp => pp.companyId !== company.id)
        return [...other, ...loaded]
      })
      setLocalPackages(loaded.filter(p => p.companyId === company.id))

      return { assigned: unassigned.length }
    } finally {
      setAssigning(false)
    }
  }

  const handleSavePackages = async () => {
    if (!localPackages.length) {
      toast.error('Tambahkan minimal 1 paket')
      return
    }

    const invalid = localPackages.some(p => {
      const email = String((p as any).recipientEmail || '').trim()

      if (!String(p.name || '').trim()) return true
      if (!String(p.recipientName || '').trim()) return true
      if (!String(p.recipientPhone || '').trim()) return true
      if (!email) return true
      if (!String(p.locationDetail || '').trim()) return true
      if (toNumber(p.weight) <= 0) return true
      if (toNumber(p.latitude) === 0 || toNumber(p.longitude) === 0) return true
      if (!String(p.trackingNumber || '').trim()) return true

      return false
    })

    if (invalid) {
      toast.error('Lengkapi semua paket: nama paket, nama penerima, no HP, email, lokasi, lat, lng, berat.')
      return
    }

    setSaving(true)
    try {
      // replace packages for this company
      const snap = await getDocs(
        query(collection(db, 'packages'), where('companyId', '==', company.id)),
      )
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'packages', d.id))))

      const now = new Date().toISOString()
      const newPackages: Package[] = []

      for (const p of localPackages) {
        const payload: any = {
          companyId: company.id,
          name: String(p.name || '').trim(),
          recipientName: String(p.recipientName || '').trim(),
          recipientPhone: String(p.recipientPhone || '').trim(),
          recipientEmail: String((p as any).recipientEmail || '').trim(),
          locationDetail: String(p.locationDetail || '').trim(),
          latitude: toNumber(p.latitude),
          longitude: toNumber(p.longitude),
          weight: toNumber(p.weight),
          trackingNumber: String(p.trackingNumber || '').trim(),
          courierId: null, // start unassigned
          status: 'pending',
          createdAt: p.createdAt || now,
          updatedAt: now,
        }

        const ref = await addDoc(collection(db, 'packages'), payload)

        await setDoc(
          doc(db, 'publicTracking', payload.trackingNumber),
          {
            trackingNumber: payload.trackingNumber,
            packageId: ref.id,
            companyId: company.id,
            status: payload.status,
            lastLocation: payload.locationDetail,
            updatedAt: now,
            recipientName: payload.recipientName,
          },
          { merge: true },
        )

        const saved: Package = { ...p, id: ref.id, status: 'pending', updatedAt: now, courierId: undefined }
        ;(saved as any).recipientEmail = payload.recipientEmail
        newPackages.push(saved)
      }

      setLocalPackages(newPackages)
      onSetPackages(prev => {
        const other = prev.filter(pp => pp.companyId !== company.id)
        return [...other, ...newPackages]
      })

      // AUTO ASSIGN after submit
      const result = await assignPendingToActiveCouriers()
      if (result.assigned > 0) {
        toast.success(`Paket disimpan & otomatis ditugaskan (${result.assigned} paket)`)
      } else {
        toast.success('Paket disimpan (belum ada paket yang perlu ditugaskan / atau tidak ada kurir aktif)')
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal menyimpan data paket')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <button
              onClick={onBackToOverview}
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Kembali
            </button>
            <h1 className="text-2xl font-semibold mt-2">Input Data</h1>
            <p className="text-sm text-muted-foreground">
              Step 1: Kurir → Step 2: Paket (Perusahaan:{' '}
              <span className="font-medium">{company.name}</span>)
            </p>
          </div>

          <div className="flex gap-2">
            <StepPill active={step === 1} label="Kurir" />
            <StepPill active={step === 2} label="Paket" />
          </div>
        </div>

        {step === 1 ? (
          <Card className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Masukan jumlah kurir</Label>
                <Input value={String(localCouriers.length)} disabled />
                <p className="text-xs text-muted-foreground">
                  Kurir otomatis dari user yang sudah diterima sebagai kurir (tidak bisa ditambah dari sini).
                </p>
              </div>
              <div className="space-y-2">
                <Label>Total kapasitas kurir (kg)</Label>
                <Input value={String(totalCourierCapacity)} disabled />
              </div>
            </div>

            {localCouriers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada kurir. Owner harus approve user sebagai kurir terlebih dahulu.
              </p>
            ) : (
              <div className="space-y-3">
                {localCouriers.map(c => (
                  <div
                    key={c.id}
                    className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-3 items-end border rounded-lg p-3"
                  >
                    <div>
                      <Label className="text-xs">Nama Kurir</Label>
                      <Input value={c.name} disabled />
                    </div>
                    <div>
                      <Label className="text-xs">Kapasitas (kg)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={c.capacity}
                        onChange={e => handleCourierCapacityChange(c.id, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSaveCouriersAndNext} disabled={!localCouriers.length}>
                Simpan & Lanjut
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Data Paket</h2>
                <p className="text-xs text-muted-foreground">
                  Field: nama paket, nama penerima, no HP, email, lokasi detail, lat, lng, berat. Resi otomatis.
                </p>
              </div>

              <Button type="button" variant="outline" onClick={handleAddPackageRow} disabled={saving || assigning}>
                + Tambah Paket
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total berat paket (kg)</Label>
                <Input value={String(totalPackageWeight)} disabled />
              </div>
            </div>

            {localPackages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada paket. Klik “+ Tambah Paket”.
              </p>
            ) : (
              <div className="space-y-3">
                {localPackages.map((p, idx) => (
                  <div key={p.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Paket #{idx + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleRemovePackage(p.id)}
                        disabled={saving || assigning}
                      >
                        Hapus
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nama Paket</Label>
                        <Input
                          value={p.name}
                          onChange={e => handlePackageChange(p.id, 'name', e.target.value)}
                          disabled={saving || assigning}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Nama Penerima</Label>
                        <Input
                          value={p.recipientName}
                          onChange={e => handlePackageChange(p.id, 'recipientName', e.target.value)}
                          disabled={saving || assigning}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">No. HP</Label>
                        <Input
                          value={p.recipientPhone}
                          onChange={e => handlePackageChange(p.id, 'recipientPhone', e.target.value)}
                          disabled={saving || assigning}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input
                          value={String((p as any).recipientEmail || '')}
                          onChange={e => handlePackageChange(p.id, 'recipientEmail', e.target.value)}
                          disabled={saving || assigning}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Lokasi Detail</Label>
                        <Input
                          value={p.locationDetail}
                          onChange={e => handlePackageChange(p.id, 'locationDetail', e.target.value)}
                          disabled={saving || assigning}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Berat (kg)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={p.weight}
                          onChange={e => handlePackageChange(p.id, 'weight', e.target.value)}
                          disabled={saving || assigning}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Lat</Label>
                        <Input
                          type="number"
                          value={p.latitude}
                          onChange={e => handlePackageChange(p.id, 'latitude', e.target.value)}
                          disabled={saving || assigning}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Lng</Label>
                        <Input
                          type="number"
                          value={p.longitude}
                          onChange={e => handlePackageChange(p.id, 'longitude', e.target.value)}
                          disabled={saving || assigning}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">No. Resi (otomatis)</Label>
                      <Input value={p.trackingNumber} disabled />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(1)} disabled={saving || assigning}>
                ‹ Kembali
              </Button>

              <Button
                onClick={handleSavePackages}
                disabled={!localPackages.length || saving || assigning}
              >
                {saving || assigning ? 'Memproses...' : 'Submit'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function StepPill({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`px-3 py-1 rounded-full text-xs border ${
        active ? 'bg-secondary text-foreground' : 'text-muted-foreground'
      }`}
    >
      {label}
    </div>
  )
}