import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { User, UserRole } from '@/lib/types'
import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import LocationPickerMap from '@/components/customer/LocationPickerMap'

type CompanyDoc = {
  id: string
  name: string
  ownerId?: string
  code?: string
  ratePerKm?: number
  officeLat?: number
  officeLng?: number
  officeAddress?: string
  isOpen?: boolean

  // NEW: rekening
  bankName?: string
  bankAccountName?: string
  bankAccountNumber?: string
}

type Tab = 'settings' | 'employees'

function upsertMembership(companies: any[], companyId: string, role: UserRole) {
  const arr = Array.isArray(companies) ? companies : []
  const idx = arr.findIndex((m: any) => m?.companyId === companyId)
  const next = {
    companyId,
    role,
    joinedAt: new Date().toISOString(),
  }
  if (idx >= 0) return arr.map((m: any, i: number) => (i === idx ? { ...m, role } : m))
  return [...arr, next]
}

function removeMembership(companies: any[], companyId: string) {
  const arr = Array.isArray(companies) ? companies : []
  return arr.filter((m: any) => m?.companyId !== companyId)
}

export default function CompanySettingsView({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>('settings')

  const [company, setCompany] = useState<CompanyDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [ratePerKm, setRatePerKm] = useState<number>(0)
  const [officeAddress, setOfficeAddress] = useState('')
  const [isOpen, setIsOpen] = useState(true)

  const [office, setOffice] = useState<{ lat: number; lng: number }>({
    lat: -6.2088,
    lng: 106.8456,
  })

  // NEW: rekening (owner only)
  const [bankName, setBankName] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')

  // employees
  const [employees, setEmployees] = useState<User[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  const isOwner = useMemo(
    () => !!company?.ownerId && company.ownerId === user.id,
    [company?.ownerId, user.id],
  )

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        if (!user.companyId) {
          setCompany(null)
          return
        }

        const ref = doc(db, 'companies', user.companyId)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          setCompany(null)
          return
        }

        const c = { id: snap.id, ...(snap.data() as any) } as CompanyDoc
        setCompany(c)

        const r = Number((c as any).ratePerKm)
        setRatePerKm(Number.isFinite(r) ? r : 0)

        setOfficeAddress(String((c as any).officeAddress || ''))
        setIsOpen((c as any).isOpen !== false)

        const lat = Number((c as any).officeLat)
        const lng = Number((c as any).officeLng)
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setOffice({ lat, lng })
        }

        // NEW: rekening load
        setBankName(String((c as any).bankName || ''))
        setBankAccountName(String((c as any).bankAccountName || ''))
        setBankAccountNumber(String((c as any).bankAccountNumber || ''))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user.companyId])

  const loadEmployees = async () => {
    if (!user.companyId) return
    try {
      setLoadingEmployees(true)

      // Tampilkan karyawan yang sedang aktif di company ini
      const snap = await getDocs(
        query(
          collection(db, 'users'),
          where('companyId', '==', user.companyId),
        ),
      )

      const list = snap.docs
        .map(d => ({ id: d.id, ...(d.data() as any) } as User))
        .filter(u => u.role === 'admin' || u.role === 'courier')
        // jangan tampilkan owner sebagai "karyawan" (opsional)
        .filter(u => u.id !== company?.ownerId)

      setEmployees(list)
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat karyawan')
      setEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }

  useEffect(() => {
    if (tab === 'employees') loadEmployees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user.companyId, company?.ownerId])

  const canSave = useMemo(() => {
    return !!user.companyId && Number(ratePerKm) >= 0 && !!office && !saving
  }, [user.companyId, ratePerKm, office, saving])

  const save = async () => {
    if (!user.companyId) return toast.error('Company belum dipilih')
    if (!company) return toast.error('Company tidak ditemukan')

    try {
      setSaving(true)
      await updateDoc(doc(db, 'companies', user.companyId), {
        ratePerKm: Number(ratePerKm),
        officeAddress: officeAddress.trim(),
        officeLat: office.lat,
        officeLng: office.lng,
        isOpen: !!isOpen,

        // NEW: rekening (boleh tetap disimpan walau kosong)
        bankName: bankName.trim(),
        bankAccountName: bankAccountName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),

        updatedAt: new Date().toISOString(),
      })
      toast.success('Pengaturan perusahaan tersimpan')
    } catch (e) {
      console.error(e)
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  const fireEmployee = async (employee: User) => {
    if (!user.companyId) return
    if (!isOwner) return toast.error('Hanya owner yang bisa pecat karyawan')

    try {
      const ref = doc(db, 'users', employee.id)
      const snap = await getDoc(ref)
      if (!snap.exists()) return toast.error('User tidak ditemukan')

      const data = snap.data() as any
      const nextCompanies = removeMembership(data.companies || [], user.companyId)

      await updateDoc(ref, {
        companies: nextCompanies,
        companyId: '',
        role: 'customer',
        updatedAt: new Date().toISOString(),
      })

      toast.success('Karyawan berhasil dipecat')
      loadEmployees()
    } catch (e) {
      console.error(e)
      toast.error('Gagal memecat karyawan')
    }
  }

  const changeRole = async (employee: User, role: Exclude<UserRole, 'customer'>) => {
    if (!user.companyId) return
    if (!isOwner) return toast.error('Hanya owner yang bisa mengubah role')

    try {
      const ref = doc(db, 'users', employee.id)
      const snap = await getDoc(ref)
      if (!snap.exists()) return toast.error('User tidak ditemukan')

      const data = snap.data() as any
      const nextCompanies = upsertMembership(data.companies || [], user.companyId, role)

      const patch: any = {
        companies: nextCompanies,
        updatedAt: new Date().toISOString(),
      }
      if (data.companyId === user.companyId) patch.role = role

      await updateDoc(ref, patch)

      toast.success('Role karyawan berhasil diubah')
      loadEmployees()
    } catch (e) {
      console.error(e)
      toast.error('Gagal mengubah role')
    }
  }

  if (!user.companyId) {
    return (
      <div className="p-4 md:p-8 pt-20 lg:pt-8">
        <Card className="p-6">
          <p className="text-sm text-destructive">Anda belum memilih perusahaan.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold mb-1">Pengaturan Perusahaan</h1>
            <p className="text-muted-foreground text-sm">
              Atur status buka/tutup, tarif, lokasi kantor, dan (owner) kelola karyawan.
            </p>

            {isOwner && company?.code ? (
              <p className="text-xs text-muted-foreground mt-2">
                Kode Perusahaan (Owner): <span className="font-mono">{company.code}</span>
              </p>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={tab === 'settings' ? 'default' : 'outline'}
              onClick={() => setTab('settings')}
            >
              Pengaturan
            </Button>
            {isOwner && (
              <Button
                type="button"
                variant={tab === 'employees' ? 'default' : 'outline'}
                onClick={() => setTab('employees')}
              >
                Karyawan
              </Button>
            )}
          </div>
        </div>

        <Card className="p-6 space-y-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : !company ? (
            <p className="text-sm text-destructive">Company tidak ditemukan.</p>
          ) : tab === 'settings' ? (
            <>
              <div className="space-y-2">
                <Label>Status Perusahaan (untuk Pemesanan Customer)</Label>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button type="button" variant={isOpen ? 'default' : 'outline'} onClick={() => setIsOpen(true)}>
                    Buka
                  </Button>
                  <Button type="button" variant={!isOpen ? 'destructive' : 'outline'} onClick={() => setIsOpen(false)}>
                    Tutup
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {isOpen
                      ? 'Perusahaan akan muncul di pencarian pemesanan.'
                      : 'Perusahaan disembunyikan dari pencarian pemesanan.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Argo per KM</Label>
                    <Input
                      type="number"
                      value={ratePerKm}
                      onChange={e => setRatePerKm(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Alamat Kantor</Label>
                    <Input value={officeAddress} onChange={e => setOfficeAddress(e.target.value)} />
                  </div>

                  {/* NEW: rekening */}
                  {isOwner && (
                    <div className="space-y-4 border-t pt-4">
                      <h2 className="font-semibold">Rekening Pembayaran (Owner)</h2>

                      <div className="space-y-2">
                        <Label>Nama Bank</Label>
                        <Input
                          value={bankName}
                          onChange={e => setBankName(e.target.value)}
                          placeholder="BCA / BRI / Mandiri"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Nama Pemilik Rekening</Label>
                        <Input
                          value={bankAccountName}
                          onChange={e => setBankAccountName(e.target.value)}
                          placeholder="Nama sesuai rekening"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Nomor Rekening</Label>
                        <Input
                          value={bankAccountNumber}
                          onChange={e => setBankAccountNumber(e.target.value)}
                          placeholder="1234567890"
                        />
                      </div>
                    </div>
                  )}

                  <Button onClick={save} disabled={!canSave} className="w-full">
                    {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Lokasi Kantor (Pin)</Label>
                  <LocationPickerMap
                    value={office}
                    onChange={setOffice}
                    className="h-[360px] w-full rounded-xl overflow-hidden border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Kantor: <span className="font-mono">{office.lat.toFixed(6)}</span>,{' '}
                    <span className="font-mono">{office.lng.toFixed(6)}</span>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-semibold">Karyawan</h2>
                <p className="text-xs text-muted-foreground">
                  Anda bisa memecat karyawan dan mengganti role. (Hanya owner)
                </p>
              </div>

              {loadingEmployees ? (
                <p className="text-sm text-muted-foreground">Memuat karyawan...</p>
              ) : employees.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada karyawan aktif.</p>
              ) : (
                <div className="space-y-3">
                  {employees.map(emp => (
                    <div
                      key={emp.id}
                      className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{emp.name || emp.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Role: <span className="font-mono">{emp.role}</span>
                        </p>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant={emp.role === 'admin' ? 'default' : 'outline'}
                          onClick={() => changeRole(emp, 'admin')}
                        >
                          Jadikan Admin
                        </Button>

                        <Button
                          type="button"
                          variant={emp.role === 'courier' ? 'default' : 'outline'}
                          onClick={() => changeRole(emp, 'courier')}
                        >
                          Jadikan Kurir
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            const ok = confirm(`Pecat ${emp.name || emp.email}?`)
                            if (!ok) return
                            fireEmployee(emp)
                          }}
                        >
                          Pecat
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}