import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { User, Company, UserRole } from '@/lib/types'
import RoleSelectionScreen from './RoleSelectionScreen'

import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

interface JoinCompanyScreenProps {
  user: User
  onBack: () => void
  onRequestJoin: (companyId: string, role: UserRole) => void
}

export default function JoinCompanyScreen({
  user,
  onBack,
  onRequestJoin,
}: JoinCompanyScreenProps) {
  const [companyCode, setCompanyCode] = useState('')
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(false)

  const handleJoinCompany = async () => {
    if (!companyCode.trim()) {
      toast.error('Masukan kode perusahaan')
      return
    }

    try {
      setLoading(true)

      const code = companyCode.trim().toUpperCase()

      const companiesRef = collection(db, 'companies')
      const q = query(companiesRef, where('code', '==', code))
      const snap = await getDocs(q)

      console.log('JoinCompanyScreen query for code:', code)
      console.log('JoinCompanyScreen snap empty?', snap.empty)
      snap.forEach(d => {
        console.log('Found company doc:', d.id, d.data())
      })

      if (snap.empty) {
        toast.error('Kode salah')
        return
      }

      const docSnap = snap.docs[0]
      const data = docSnap.data()

      const company: Company = {
        id: docSnap.id,
        name: (data as any).name ?? '',
        ownerId: (data as any).ownerId ?? '',
        code: (data as any).code ?? code,
        createdAt: (data as any).createdAt,
      }

      // Cek apakah user sudah punya membership ke company ini
      const alreadyJoined = (user.companies || []).some(
        m => m.companyId === company.id,
      )
      if (alreadyJoined) {
        toast.error('Anda sudah bergabung dengan perusahaan ini')
        return
      }

      setSelectedCompany(company)
      setShowRoleSelection(true)
    } catch (err) {
      console.error('JoinCompanyScreen: gagal mencari perusahaan', err)
      toast.error('Terjadi kesalahan saat mencari perusahaan')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleSelected = (role: UserRole) => {
    if (!selectedCompany) return

    onRequestJoin(selectedCompany.id, role)

    toast.success(
      `Permintaan bergabung ke ${selectedCompany.name} sebagai ${
        role === 'admin' ? 'Admin' : role === 'courier' ? 'Kurir' : role
      } telah dikirim. Tunggu persetujuan owner.`,
    )

    onBack()
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
              onChange={e => setCompanyCode(e.target.value.toUpperCase())}
              onKeyDown={e =>
                e.key === 'Enter' && !loading && handleJoinCompany()
              }
              className="font-mono"
              disabled={loading}
            />
          </div>
          <Button
            onClick={handleJoinCompany}
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Mencari...' : 'Gabung'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}