import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Buildings, Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { User, Company } from '@/lib/types'
import { generateId, generateCode } from '@/lib/auth'

interface CompanySelectionScreenProps {
  user: User
  onCompanySet: (companyId: string) => void
}

export default function CompanySelectionScreen({ user, onCompanySet }: CompanySelectionScreenProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [companies, setCompanies] = useKV<Company[]>('companies', [])

  const handleCreateCompany = () => {
    if (!companyName.trim()) {
      toast.error('Masukan nama perusahaan')
      return
    }

    const newCompany: Company = {
      id: generateId(),
      name: companyName,
      code: generateCode(),
      ownerId: user.id,
      createdAt: new Date().toISOString()
    }

    setCompanies((currentCompanies) => [...(currentCompanies || []), newCompany])
    toast.success(`Perusahaan berhasil dibuat! Kode: ${newCompany.code}`)
    onCompanySet(newCompany.id)
  }

  const handleJoinCompany = () => {
    if (!companyCode.trim()) {
      toast.error('Masukan kode perusahaan')
      return
    }

    const company = companies?.find(c => c.code.toUpperCase() === companyCode.toUpperCase())

    if (!company) {
      toast.error('Kode salah')
      return
    }

    toast.success(`Bergabung dengan ${company.name}`)
    onCompanySet(company.id)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary/50 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-2xl p-4">
              <Buildings size={48} weight="duotone" className="text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-semibold">
            Selamat datang, {user.name || user.email}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Buat perusahaan baru atau bergabung dengan yang sudah ada
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="lg"
              className="h-32 flex flex-col gap-3"
            >
              <Plus size={32} weight="bold" />
              <span className="text-lg">Buat Perusahaan</span>
            </Button>

            <Button
              onClick={() => setShowJoinDialog(true)}
              variant="outline"
              size="lg"
              className="h-32 flex flex-col gap-3"
            >
              <Buildings size={32} weight="duotone" />
              <span className="text-lg">Gabung Perusahaan</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Perusahaan Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nama Perusahaan</Label>
              <Input
                id="company-name"
                placeholder="Masukkan nama perusahaan"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateCompany} className="w-full">
              Buat Perusahaan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gabung Perusahaan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="company-code">Kode Perusahaan</Label>
              <Input
                id="company-code"
                placeholder="Masukkan kode perusahaan"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
            <Button onClick={handleJoinCompany} className="w-full">
              Gabung
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
