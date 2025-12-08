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

    try {
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

      // Update companies list
      setCompanies((currentCompanies) => {
        const existingCompanies = currentCompanies || []
        console.log('Adding company to list. Current count:', existingCompanies.length)
        const updated = [...existingCompanies, newCompany]
        console.log('New company list count:', updated.length)
        return updated
      })

      // Wait longer to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update current user
      setCurrentUser((prev) => {
        if (!prev) return null
        const updated = {
          ...prev,
          companies: [
            ...(prev.companies || []),
            newMembership
          ]
        }
        console.log('Updated current user companies:', updated.companies)
        return updated
      })

      // Wait longer to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 500))

      // Update users array
      setUsers((currentUsers) => 
        (currentUsers || []).map((u) => {
          if (u.id === user.id) {
            const updated = { 
              ...u, 
              companies: [...(u.companies || []), newMembership]
            }
            console.log('Updated user in users array:', updated)
            return updated
          }
          return u
        })
      )

      // Wait for final KV operation to complete
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log('Company creation completed successfully')
      toast.success(`Perusahaan berhasil dibuat! Kode: ${newCompany.code}`)
      console.log('Calling onCompanyCreated with ID:', newCompany.id)
      onCompanyCreated(newCompany.id)
    } catch (error) {
      console.error('Error creating company:', error)
      
      // Check if it's a rate limit error
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('rate limit')) {
        toast.error('Terlalu banyak permintaan. Silakan tunggu sebentar dan coba lagi.')
      } else {
        toast.error('Terjadi kesalahan saat membuat perusahaan. Silakan coba lagi.')
      }
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
