import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { User, Company } from '@/lib/types'
import { generateCode } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

interface CreateCompanyScreenProps {
  user: User
  onBack: () => void
  onCompanyCreated: (companyId: string) => void
}

export default function CreateCompanyScreen({
  user,
  onBack,
  onCompanyCreated,
}: CreateCompanyScreenProps) {
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateCompany = async () => {
    if (!companyName.trim()) {
      toast.error('Masukan nama perusahaan')
      return
    }

    try {
      setLoading(true)

      console.log('Creating company (Firestore):', companyName)

      const newCompanyData: Omit<Company, 'id'> = {
        name: companyName.trim(),
        code: generateCode(),
        ownerId: user.id,
        createdAt: new Date().toISOString(),
      }

      const docRef = await addDoc(collection(db, 'companies'), {
        ...newCompanyData,
        createdAt: serverTimestamp(),
      })

      const newCompanyId = docRef.id

      console.log('New company created in Firestore with id:', newCompanyId)

      toast.success(`Perusahaan berhasil dibuat! Kode: ${newCompanyData.code}`)

      onCompanyCreated(newCompanyId)
    } catch (error) {
      console.error('Error creating company in Firestore:', error)
      toast.error('Terjadi kesalahan saat membuat perusahaan di database')
    } finally {
      setLoading(false)
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
              onChange={e => setCompanyName(e.target.value)}
              onKeyDown={e =>
                e.key === 'Enter' && !loading && handleCreateCompany()
              }
            />
          </div>
          <Button
            onClick={handleCreateCompany}
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Buat Perusahaan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}