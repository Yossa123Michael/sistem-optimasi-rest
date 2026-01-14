import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { User } from '@/lib/types'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import LocationPickerMap from '@/components/customer/LocationPickerMap'

type CompanyDoc = {
  id: string
  name: string
  ownerId?: string
  ratePerKm?: number
  officeLat?: number
  officeLng?: number
  officeAddress?: string
}

export default function CompanySettingsView({ user }: { user: User }) {
  const [company, setCompany] = useState<CompanyDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [ratePerKm, setRatePerKm] = useState<number>(0)
  const [officeAddress, setOfficeAddress] = useState('')

  const [office, setOffice] = useState<{ lat: number; lng: number }>({
    lat: -6.2088,
    lng: 106.8456,
  })

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

        const lat = Number((c as any).officeLat)
        const lng = Number((c as any).officeLng)
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setOffice({ lat, lng })
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user.companyId])

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
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Pengaturan Perusahaan</h1>
          <p className="text-muted-foreground">
            Set tarif argo per km dan lokasi kantor untuk perhitungan biaya customer.
          </p>
        </div>

        {loading ? (
          <Card className="p-6">Memuat...</Card>
        ) : !company ? (
          <Card className="p-6">Company tidak ditemukan.</Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Perusahaan</p>
                  <p className="text-lg font-semibold">{company.name}</p>
                </div>

                <div className="space-y-2">
                  <Label>Argo per km</Label>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={ratePerKm}
                    onChange={e => setRatePerKm(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Contoh: 5000 berarti Rp 5.000 per 1 km.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Alamat Kantor (opsional)</Label>
                  <Input value={officeAddress} onChange={e => setOfficeAddress(e.target.value)} />
                </div>

                <div className="text-xs text-muted-foreground">
                  Lokasi kantor: <span className="font-mono">{office.lat.toFixed(6)}</span>,{' '}
                  <span className="font-mono">{office.lng.toFixed(6)}</span>
                </div>

                <Button className="w-full" onClick={save} disabled={!canSave}>
                  {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold">Pin Lokasi Kantor</h2>
                  <p className="text-xs text-muted-foreground">
                    Klik peta untuk memindahkan pin kantor.
                  </p>
                </div>

                <LocationPickerMap value={office} onChange={setOffice} className="h-[380px] w-full rounded-xl overflow-hidden border" />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}