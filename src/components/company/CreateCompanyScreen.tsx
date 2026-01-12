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

interface CreateCompanyScreenProps {
  user: User
  onBack: () => void
  onCompanyCreated: () => void
}

function genCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export default function CreateCompanyScreen({ user, onBack, onCompanyCreated }: CreateCompanyScreenProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('Nama perusahaan wajib diisi')

    try {
      setLoading(true)

      const payload: Omit<Company, 'id'> & any = {
        name: name.trim(),
        code: genCode(),
        ownerId: user.id,
        createdAt: new Date().toISOString(),
      }

      const ref = await addDoc(collection(db, 'companies'), payload)

      // otomatis: owner menjadi admin dan punya membership
      const membership = { companyId: ref.id, role: 'admin', joinedAt: new Date().toISOString() }

      await setDoc(
        doc(db, 'users', user.id),
        {
          companyId: ref.id,
          role: 'admin',
          companies: [...(user.companies || []), membership],
        },
        { merge: true },
      )

      toast.success('Perusahaan berhasil dibuat')
      onCompanyCreated()
    } catch (e: any) {
  console.error(e)
  toast.error(`Gagal membuat perusahaan: ${e?.code || e?.message || String(e)}`)
} finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button variant="ghost" size="sm" className="w-fit mb-4" onClick={onBack}>
            <ArrowLeft className="mr-2" />
            Kembali
          </Button>
          <CardTitle className="text-2xl">Buat Perusahaan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nama Perusahaan</Label>
            <Input
              id="company-name"
              placeholder="Contoh: PT Maju Jaya"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <Button className="w-full" onClick={handleCreate} disabled={loading}>
            {loading ? 'Membuat...' : 'Buat'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}