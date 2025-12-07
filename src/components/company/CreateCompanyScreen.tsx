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

  const handleCreateCompany = () => {
    if (!companyName.trim()) {
      toast.error('Masukan nama perusahaan')
      return
    }

    const newCompany: Company = {
      id: generateId(),
      name: companyName.trim(),
      code: generateCode(),
      ownerId: user.id,
      createdAt: new Date().toISOString()
    }

    setCompanies((currentCompanies) => [...(currentCompanies || []), newCompany])
    
    const newMembership = {
      companyId: newCompany.id,
      role: 'admin' as const,
      joinedAt: new Date().toISOString()
    }
    
    setCurrentUser((prev) => {
      if (!prev) return null
      return {
        ...prev,
        companies: [
          ...(prev.companies || []),
          newMembership
        ]
      }
    })

    setUsers((currentUsers) => 
      (currentUsers || []).map((u) => {
        if (u.id === user.id) {
          return { 
            ...u, 
            companies: [...(u.companies || []), newMembership]
          }
        }
        return u
      })
    )

    toast.success(`Perusahaan berhasil dibuat! Kode: ${newCompany.code}`)
    onCompanyCreated(newCompany.id)
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
