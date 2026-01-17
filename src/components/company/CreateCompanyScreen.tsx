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
      // Step 1: Get all existing data
      const existingCompanies = await window.spark.kv.get<Company[]>('companies') || []
      const existingCurrentUser = await window.spark.kv.get<User | null>('current-user')
      const existingUsers = await window.spark.kv.get<User[]>('users') || []
      
      if (!existingCurrentUser) {
        toast.error('Sesi pengguna tidak ditemukan')
        return
      }
      
      // Step 2: Save company first
      const updatedCompanies = [...existingCompanies, newCompany]
      await window.spark.kv.set('companies', updatedCompanies)
      console.log('Companies saved to KV:', updatedCompanies.length)

      // Step 3: Update current user with membership
      const updatedCurrentUser = {
        ...existingCurrentUser,
        companies: [...(existingCurrentUser.companies || []), newMembership]
      }
      await window.spark.kv.set('current-user', updatedCurrentUser)
      console.log('Current user updated in KV with companies:', updatedCurrentUser.companies)

      // Step 4: Update users array
      const updatedUsers = existingUsers.map((u) => {
        if (u.id === user.id) {
          return { 
            ...u, 
            companies: [...(u.companies || []), newMembership]
          }
        }
        return u
      })
      await window.spark.kv.set('users', updatedUsers)
      console.log('Users array updated in KV')

      // Step 5: Update local state with useKV setters
      setCompanies(updatedCompanies)
      setCurrentUser(updatedCurrentUser)
      setUsers(updatedUsers)

      // Step 6: Wait and verify everything was saved
      await new Promise(resolve => setTimeout(resolve, 300))

      const verifyCompanies = await window.spark.kv.get<Company[]>('companies')
      const verifyCurrentUser = await window.spark.kv.get<User | null>('current-user')
      
      console.log('=== POST-CREATION VERIFICATION ===')
      console.log('Verified companies in KV:', verifyCompanies?.length, 'companies')
      console.log('Company IDs:', verifyCompanies?.map(c => c.id))
      console.log('Verified current user memberships:', verifyCurrentUser?.companies?.length)
      console.log('Membership IDs:', verifyCurrentUser?.companies?.map(m => m.companyId))
      
      const companyExists = verifyCompanies?.some(c => c.id === newCompany.id)
      const userHasMembership = verifyCurrentUser?.companies?.some(m => m.companyId === newCompany.id)
      
      console.log('Company exists in KV:', companyExists)
      console.log('User has membership in KV:', userHasMembership)

      if (!companyExists || !userHasMembership) {
        console.error('!!! DATA NOT PROPERLY SAVED !!!')
        toast.error('Terjadi kesalahan. Silakan coba lagi.')
        return
      }

      toast.success(`Perusahaan berhasil dibuat! Kode: ${newCompany.code}`)
      console.log('=== CALLING onCompanyCreated with ID:', newCompany.id, '===')
      onCompanyCreated(newCompany.id)
    } catch (error) {
      console.error('Error creating company:', error)
      toast.error('Terjadi kesalahan saat membuat perusahaan')
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
            <p className="text-xs text-muted-foreground">
              Klik pada peta untuk memilih lokasi kantor.
            </p>

            <OfficeLocationPicker
              value={officeLocation}
              onChange={setOfficeLocation}
              height={360}
            />

            {officeLocation && (
              <p className="text-xs text-muted-foreground">
                Dipilih: <span className="font-mono">{officeLocation.lat.toFixed(6)}, {officeLocation.lng.toFixed(6)}</span>
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