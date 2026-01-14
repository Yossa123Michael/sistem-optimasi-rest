import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { User } from '@/lib/types'
import { db } from '@/lib/firebase'
import { addDoc, collection, getDocs } from 'firebase/firestore'
import LocationPickerMap from './LocationPickerMap'

type CompanyDoc = {
  id: string
  name: string
  officeLocation?: { lat: number; lng: number } // schema baru
  officeLat?: number // fallback schema lama
  officeLng?: number // fallback schema lama
  officeAddress?: string
  ratePerKm?: number
  archived?: boolean
}

type SortMode = 'cheapest' | 'nearest'

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

function getOffice(c: CompanyDoc) {
  const lat = Number(c.officeLocation?.lat ?? (c as any).officeLat)
  const lng = Number(c.officeLocation?.lng ?? (c as any).officeLng)
  const ok = Number.isFinite(lat) && Number.isFinite(lng)
  return { ok, lat, lng }
}

export default function CustomerOrderView({ user }: { user: User }) {
  const userName = user.name || user.email.split('@')[0]

  // step 1: input paket + pin tujuan, step 2: pilih perusahaan
  const [step, setStep] = useState<1 | 2>(1)

  // companies
  const [companies, setCompanies] = useState<CompanyDoc[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<CompanyDoc | null>(null)

  // search + sort
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('cheapest')

  // NEW: lokasi user sekarang (share GPS)
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [locLoading, setLocLoading] = useState(false)

  // form
  const [packageName, setPackageName] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [destinationDetail, setDestinationDetail] = useState('')
  const [weight, setWeight] = useState<number>(1)

  // destination pin (lokasi tujuan)
  const [dest, setDest] = useState<{ lat: number; lng: number }>({
    lat: -6.2088,
    lng: 106.8456,
  })

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true)
        const snap = await getDocs(collection(db, 'companies'))
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as CompanyDoc[]
        setCompanies(list.filter(c => !c.archived && (c as any).isOpen !== false))
      } catch (e) {
        console.error(e)
        toast.error('Gagal memuat perusahaan')
      } finally {
        setLoadingCompanies(false)
      }
    }
    loadCompanies()
  }, [])

  const canNextToCompany = useMemo(() => {
    return (
      packageName.trim() &&
      recipientName.trim() &&
      recipientPhone.trim() &&
      destinationDetail.trim() &&
      Number(weight) > 0
    )
  }, [packageName, recipientName, recipientPhone, destinationDetail, weight])

  const canSubmit = useMemo(() => {
    return !!selectedCompany && canNextToCompany
  }, [selectedCompany, canNextToCompany])

  const requestUserLocation = async () => {
    if (!navigator.geolocation) return toast.error('Browser tidak mendukung GPS')
    try {
      setLocLoading(true)
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      })
      setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      toast.success('Lokasi Anda berhasil diambil')
    } catch (e: any) {
      console.error(e)
      toast.error('Gagal mengambil lokasi. Izinkan akses lokasi di browser.')
    } finally {
      setLocLoading(false)
    }
  }

  const computedCompanies = useMemo(() => {
    const q = search.trim().toLowerCase()

    const enriched = companies
      .map(c => {
        const office = getOffice(c)
        const rate = Number((c as any).ratePerKm)
        const hasRate = Number.isFinite(rate) && rate > 0

        // biaya tetap berdasarkan kantor -> tujuan (dest)
        const kmToDest = office.ok ? haversineKm({ lat: office.lat, lng: office.lng }, dest) : Infinity
        const estCost = office.ok && hasRate ? Number(weight) * kmToDest * rate : Infinity

        // NEAREST: berdasarkan lokasi user sekarang -> kantor
        const kmToUser = office.ok && userLoc ? haversineKm({ lat: office.lat, lng: office.lng }, userLoc) : Infinity

        const haystack = `${c.name || ''} ${(c as any).officeAddress || ''}`.toLowerCase()
        const match = !q || haystack.includes(q)

        return {
          company: c,
          officeOk: office.ok,
          rate,
          hasRate,
          kmToDest,
          kmToUser,
          estCost,
          match,
        }
      })
      .filter(x => x.match)

    const sorted = [...enriched].sort((a, b) => {
      if (sortMode === 'nearest') {
        // jika userLoc belum ada, semua Infinity -> urutan tidak berubah
        return a.kmToUser - b.kmToUser
      }
      return a.estCost - b.estCost
    })

    return sorted
  }, [companies, dest, weight, search, sortMode, userLoc])

  const handleSubmit = async () => {
    if (!selectedCompany) return toast.error('Pilih perusahaan dulu')
    if (!canSubmit) return toast.error('Lengkapi semua field wajib.')

    const office = getOffice(selectedCompany)
    const rate = Number((selectedCompany as any).ratePerKm)

    if (!office.ok) return toast.error('Lokasi kantor perusahaan belum di-set admin.')
    if (!Number.isFinite(rate) || rate <= 0) return toast.error('Argo/km perusahaan belum di-set.')

    const distanceKm = haversineKm({ lat: office.lat, lng: office.lng }, dest)
    const estimatedCost = Number(weight) * distanceKm * rate

    try {
      const now = new Date().toISOString()

      await addDoc(collection(db, 'orders'), {
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,

        officeLocation: { lat: office.lat, lng: office.lng },
        officeAddress: (selectedCompany as any).officeAddress || '',
        ratePerKm: rate,

        // hasil hitung
        distanceKm,
        estimatedCost,

        // lokasi user saat order (optional, tapi berguna)
        customerLocation: userLoc ? { ...userLoc } : null,

        customerId: user.id,
        customerName: userName,
        customerEmail: user.email,

        packageName: packageName.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientEmail: recipientEmail.trim(),

        destinationDetail: destinationDetail.trim(),
        latitude: dest.lat,
        longitude: dest.lng,
        weight: Number(weight),

        status: 'created',
        trackingNumber: null,

        createdAt: now,
        updatedAt: now,
      })

      toast.success('Pesanan berhasil dibuat. Menunggu approve admin.')

      // reset
      setPackageName('')
      setRecipientName('')
      setRecipientPhone('')
      setRecipientEmail('')
      setDestinationDetail('')
      setWeight(1)
      setStep(1)
      setSelectedCompany(null)
      setSearch('')
      setSortMode('cheapest')
      setUserLoc(null)
    } catch (e: any) {
      console.error(e)
      toast.error(
        e?.message?.includes('permissions')
          ? 'Rules Firestore belum mengizinkan orders'
          : 'Gagal membuat pesanan',
      )
    }
  }

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-medium mb-2">Pemesanan</h1>
          <p className="text-muted-foreground">Halo, {userName}</p>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <CardContent className="p-0 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Data Paket</h2>
                  <p className="text-xs text-muted-foreground">
                    Isi data paket dan pilih lokasi tujuan. Setelah itu baru pilih perusahaan.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Nama Paket</Label>
                  <Input value={packageName} onChange={e => setPackageName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Nama Penerima</Label>
                  <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>No. HP Penerima</Label>
                  <Input value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Email Penerima (opsional)</Label>
                  <Input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Alamat Detail Tujuan</Label>
                  <Input value={destinationDetail} onChange={e => setDestinationDetail(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Berat (KG)</Label>
                  <Input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={weight}
                    onChange={e => setWeight(Number(e.target.value))}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    if (!canNextToCompany) return toast.error('Lengkapi data paket dulu')
                    setStep(2)
                  }}
                  disabled={!canNextToCompany}
                >
                  Lanjut Pilih Perusahaan
                </Button>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0 space-y-3">
                <div>
                  <h2 className="text-lg font-semibold">Lokasi Tujuan (Pin)</h2>
                  <p className="text-xs text-muted-foreground">
                    Klik peta untuk memindahkan pin tujuan.
                  </p>
                </div>

                <LocationPickerMap
                  value={dest}
                  onChange={setDest}
                  className="h-[420px] w-full rounded-xl overflow-hidden border"
                />

                <div className="text-xs text-muted-foreground">
                  Tujuan: <span className="font-mono">{dest.lat.toFixed(6)}</span>,{' '}
                  <span className="font-mono">{dest.lng.toFixed(6)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {/* CARD 1: Header + Ringkasan + Search + Sort */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Pilih Perusahaan</h2>
                    <p className="text-xs text-muted-foreground">
                      Biaya = Berat (KG) × Jarak (KM) × Argo/km
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Kembali
                  </Button>
                </div>

                <div className="border rounded-lg p-4 text-sm space-y-1">
                  <p><b>Paket:</b> {packageName || '-'}</p>
                  <p><b>Berat:</b> {Number(weight) || 0} kg</p>
                  <p>
                    <b>Tujuan:</b>{' '}
                    <span className="font-mono">
                      {dest.lat.toFixed(6)}, {dest.lng.toFixed(6)}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <Label>Cari Perusahaan</Label>
                    <Input
                      placeholder="Ketik nama/alamat perusahaan..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Lokasi Anda (untuk sort terdekat)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={requestUserLocation}
                      disabled={locLoading}
                    >
                      {locLoading
                        ? 'Mengambil lokasi...'
                        : userLoc
                          ? `Lokasi OK (${userLoc.lat.toFixed(3)}, ${userLoc.lng.toFixed(3)})`
                          : 'Ambil Lokasi Saya'}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <div className="text-sm font-medium">Urutkan:</div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={sortMode === 'cheapest' ? 'default' : 'outline'}
                      onClick={() => setSortMode('cheapest')}
                    >
                      Termurah
                    </Button>
                    <Button
                      type="button"
                      variant={sortMode === 'nearest' ? 'default' : 'outline'}
                      onClick={() => {
                        setSortMode('nearest')
                        if (!userLoc) toast.message('Klik "Ambil Lokasi Saya" supaya urutan terdekat akurat.')
                      }}
                    >
                      Terdekat (dari Anda)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 2: List perusahaan + sticky footer submit */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="max-h-[52vh] overflow-y-auto p-6">
                  {loadingCompanies ? (
                    <p className="text-sm text-muted-foreground">Memuat perusahaan...</p>
                  ) : computedCompanies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Perusahaan tidak ditemukan.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {computedCompanies.map(({ company: c, officeOk, hasRate, rate, kmToDest, kmToUser, estCost }) => {
                        const isSelected = selectedCompany?.id === c.id
                        const destKmText = Number.isFinite(kmToDest) ? kmToDest.toFixed(2) : '-'
                        const userKmText = Number.isFinite(kmToUser) ? kmToUser.toFixed(2) : '-'
                        const costText = Number.isFinite(estCost) ? `Rp ${estCost.toFixed(0)}` : '-'

                        return (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCompany(c)}
                            className={`text-left border rounded-xl p-4 transition-colors ${
                              isSelected ? 'bg-secondary border-primary/40' : 'hover:bg-secondary/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{c.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(c as any).officeAddress ? String((c as any).officeAddress) : 'Alamat kantor belum diisi'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] text-muted-foreground">Argo/km</p>
                                <p className="font-semibold">{hasRate ? rate : 0}</p>
                              </div>
                            </div>

                            <div className="mt-3 text-sm space-y-1">
                              <p><b>Jarak (ke tujuan):</b> {officeOk ? destKmText : '-'} km</p>
                              <p><b>Jarak (ke Anda):</b> {officeOk && userLoc ? userKmText : userLoc ? '-' : 'Ambil lokasi Anda'} </p>
                              <p><b>Estimasi biaya:</b> {officeOk && hasRate ? costText : '-'}</p>
                            </div>

                            {!officeOk && (
                              <p className="mt-2 text-xs text-destructive">Lokasi kantor belum di-set admin.</p>
                            )}
                            {officeOk && !hasRate && (
                              <p className="mt-2 text-xs text-destructive">Argo/km belum di-set admin.</p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 border-t bg-card p-4">
                  <Button className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
                    Buat Pesanan (Menunggu Approve)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}