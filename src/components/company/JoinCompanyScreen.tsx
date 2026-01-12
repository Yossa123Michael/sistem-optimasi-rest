import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { User, UserRole } from '@/lib/types'
import { db } from '@/lib/firebase'
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore'
import RoleSelectionScreen from './RoleSelectionScreen'

interface JoinCompanyScreenProps {
  user: User
  onBack: () => void
  onRequestSent: () => void
}

export default function JoinCompanyScreen({ user, onBack, onRequestSent }: JoinCompanyScreenProps) {
  const [companyCode, setCompanyCode] = useState('')
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string } | null>(null)

  const handleLookupCompany = async () => {
    if (!companyCode.trim()) {
      toast.error('Masukan kode perusahaan')
      return
    }

    const q = query(
      collection(db, 'companies'),
      where('code', '==', companyCode.trim().toUpperCase()),
    )
    const snap = await getDocs(q)
    if (snap.empty) {
      toast.error('Kode salah')
      return
    }

    const d = snap.docs[0]
    const data = d.data() as any
    setSelectedCompany({ id: d.id, name: data.name })
    setShowRoleSelection(true)
  }

  const handleRoleSelected = async (role: UserRole) => {
    if (!selectedCompany) return

    try {
      await addDoc(collection(db, 'employeeRequests'), {
        companyId: selectedCompany.id,
        userId: user.id,
        userEmail: user.email,
        userName: user.name || user.email,
        status: 'pending',
        requestedRole: role,
        createdAt: new Date().toISOString(),
      })

      toast.success(`Permintaan terkirim ke ${selectedCompany.name}`)
      onRequestSent()
    } catch (e) {
      console.error('Failed to create employee request', e)
      toast.error('Gagal mengirim permintaan')
    } finally {
      setShowRoleSelection(false)
      setSelectedCompany(null)
      setCompanyCode('')
    }
  }

  if (showRoleSelection && selectedCompany) {
    return (
      <RoleSelectionScreen
        companyName={selectedCompany.name}
        onBack={() => {
          setShowRoleSelection(false)
          setSelectedCompany(null)
        }}
        onRoleSelected={handleRoleSelected}
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button variant="ghost" size="sm" className="w-fit mb-4" onClick={onBack}>
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
              onChange={e => setCompanyCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleLookupCompany()}
              className="font-mono"
            />
          </div>
          <Button onClick={handleLookupCompany} className="w-full">
            Gabung
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}