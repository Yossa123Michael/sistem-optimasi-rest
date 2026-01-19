import { useState } from 'react'
import { User, Company } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { addDoc, collection, doc, setDoc } from 'firebase/firestore'
import OfficeLocationPicker from '@/components/maps/OfficeLocationPicker'

type UserPatch = Pick<User, 'companyId' | 'role' | 'companies'>

interface CreateCompanyScreenProps {
  user: User
  onBack: () => void
  onCompanyCreated: (patch: UserPatch) => void
}

function genCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export default function CreateCompanyScreen({
  user,
  onBack,
  onCompanyCreated,
}: CreateCompanyScreenProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const [officeLocation, setOfficeLocation] = useState<{ lat: number; lng: number } | undefined>(
    undefined,
  )

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('Nama perusahaan wajib diisi')
    if (!officeLocation) return toast.error('Silakan pilih lokasi kantor di peta')

    try {
      setLoading(true)

      const now = new Date().toISOString()

      const payload: Omit<Company, 'id'> & any = {
        name: name.trim(),
        code: genCode(),
        ownerId: user.id,
        createdAt: now,
        updatedAt: now,
        officeLocation,
      }

      const ref = await addDoc(collection(db, 'companies'), payload)

      // user membership
      const membership = { companyId: ref.id, role: 'admin' as const, joinedAt: now }
      const nextCompanies = [...(user.companies || []), membership]

      // 1) set active company untuk owner di users doc
      await setDoc(
        doc(db, 'users', user.id),
        {
          companyId: ref.id,
          role: 'admin',
          companies: nextCompanies,
        },
        { merge: true },
      )

      // 2) Buat juga companyMembers untuk owner, sehingga CompanyList/Selection yang berdasarkan pada companyMembers dapat menampilkannya.
      await setDoc(
        doc(db, 'companyMembers', `${ref.id}_${user.id}`),
        {
          companyId: ref.id,
          userId: user.id,
          role: 'admin',
          active: true,
          joinedAt: now,
          updatedAt: now,
          leftAt: null,
        },
        { merge: true },
      )

      toast.success('Perusahaan berhasil dibuat')

      onCompanyCreated({
        companyId: ref.id,
        role: 'admin',
        companies: nextCompanies,
      })
    } catch (e: any) {
      console.error(e)
      toast.error(`Gagal membuat perusahaan: ${e?.code || e?.message || String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Button variant="ghost" size="sm" className="w-fit mb-4" onClick={onBack}>
            <ArrowLeft className="mr-2" />
            Kembali
          </Button>
          <CardTitle className="text-2xl">Buat Perusahaan</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nama Perusahaan</Label>
            <Input
              id="company-name"
              placeholder="Contoh: PT Maju Jaya"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Lokasi Kantor</Label>
            <p className="text-xs text-muted-foreground">Klik pada peta untuk memilih lokasi kantor.</p>

            <OfficeLocationPicker value={officeLocation} onChange={setOfficeLocation} height={360} />

            {officeLocation && (
              <p className="text-xs text-muted-foreground">
                Dipilih:{' '}
                <span className="font-mono">
                  {officeLocation.lat.toFixed(6)}, {officeLocation.lng.toFixed(6)}
                </span>
              </p>
            )}
          </div>

          <Button className="w-full" onClick={handleCreate} disabled={loading}>
            {loading ? 'Membuat...' : 'Buat'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}