import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { User, Company, UserRole } from '@/lib/types'
import RoleSelectionScreen from './RoleSelectionScreen'

interface JoinCompanyScreenProps {
  user: User
  onBack: () => void
  onCompanyJoined: (companyId: string, role: UserRole) => void
}

export default function JoinCompanyScreen({ user, onBack, onCompanyJoined }: JoinCompanyScreenProps) {
  const [companyCode, setCompanyCode] = useState('')
  const [companies] = useKV<Company[]>('companies', [])
  const [currentUser, setCurrentUser] = useKV<User | null>('current-user', null)
  const [users, setUsers] = useKV<User[]>('users', [])
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  const handleJoinCompany = () => {
    if (!companyCode.trim()) {
      toast.error('Masukan kode perusahaan')
      return
    }

    const company = (companies || []).find(c => c.code.toUpperCase() === companyCode.toUpperCase())

    if (!company) {
      toast.error('Kode salah')
      return
    }

    const alreadyJoined = (user.companies || []).some(m => m.companyId === company.id)
    if (alreadyJoined) {
      toast.error('Anda sudah bergabung dengan perusahaan ini')
      return
    }

    setSelectedCompany(company)
    setShowRoleSelection(true)
  }

  const handleRoleSelected = (role: UserRole) => {
    if (selectedCompany) {
      const newMembership = {
        companyId: selectedCompany.id,
        role: role,
        joinedAt: new Date().toISOString()
      }

      setCurrentUser((prev) => {
        if (!prev) return null
        const existingCompanies = prev.companies || []
        return {
          ...prev,
          companies: [
            ...existingCompanies,
            newMembership
          ]
        }
      })

      setUsers((currentUsers) => 
        (currentUsers || []).map((u) => 
          u.id === user.id 
            ? { 
                ...u, 
                companies: [...(u.companies || []), newMembership]
              }
            : u
        )
      )

      toast.success(`Bergabung dengan ${selectedCompany.name} sebagai ${role === 'admin' ? 'Admin' : 'Kurir'}`)
      onCompanyJoined(selectedCompany.id, role)
    }
  }

  const handleBackFromRoleSelection = () => {
    setShowRoleSelection(false)
    setSelectedCompany(null)
  }

  if (showRoleSelection && selectedCompany) {
    return (
      <RoleSelectionScreen
        companyName={selectedCompany.name}
        onBack={handleBackFromRoleSelection}
        onRoleSelected={handleRoleSelected}
      />
    )
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
          <CardTitle className="text-2xl">Gabung Perusahaan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company-code">Kode Perusahaan</Label>
            <Input
              id="company-code"
              placeholder="Masukkan kode perusahaan"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinCompany()}
              className="font-mono"
            />
          </div>
          <Button onClick={handleJoinCompany} className="w-full">
            Gabung
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
