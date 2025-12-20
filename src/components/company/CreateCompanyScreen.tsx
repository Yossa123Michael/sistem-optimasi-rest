import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { User, Company } from '@/lib/types'
import { generateId, generateCode } from '@/lib/auth'

interface CreateCompanyScreenProps {
  user: User
  onBack: () => void
  onCompanyCreated: (companyId: string) => void
}

export default function CreateCompanyScreen({ user, onBack, onCompanyCreated }: CreateCompanyScreenProps) {
  const [companyName, setCompanyName] = useState('')
  const [companies, setCompanies] = useKV<Company[]>('companies', [])
  const [currentUser, setCurrentUser] = useKV<User | null>('current-user', null)
  const [users, setUsers] = useKV<User[]>('users', [])

  const handleCreateCompany = async () => {
    if (!companyName.trim()) {
      toast.error('Masukan nama perusahaan')
      return
    }

    console.log('Creating company:', companyName)

    const newCompany: Company = {
      id: generateId(),
      name: companyName.trim(),
      code: generateCode(),
      ownerId: user.id,
      createdAt: new Date().toISOString()
    }

    console.log('New company object:', newCompany)

    const newMembership = {
      companyId: newCompany.id,
      role: 'admin' as const,
      joinedAt: new Date().toISOString()
    }

    console.log('New membership:', newMembership)

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
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit mb-4"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2" />
            Kembali
          </Button>
          <CardTitle className="text-2xl">Buat Perusahaan Baru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nama Perusahaan</Label>
            <Input
              id="company-name"
              placeholder="Masukkan nama perusahaan"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCompany()}
            />
          </div>
          <Button onClick={handleCreateCompany} className="w-full">
            Buat Perusahaan
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
