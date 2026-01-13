import { useState } from 'react'
import { User, Company, UserRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore'

type UserPatch = Pick<User, 'companyId' | 'role' | 'companies'>

interface JoinCompanyScreenProps {
  user: User
  onBack: () => void
  onRequestSent: (patch: UserPatch) => void
}

export default function JoinCompanyScreen({ user, onBack, onRequestSent }: JoinCompanyScreenProps) {
  const [companyCode, setCompanyCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [foundCompany, setFoundCompany] = useState<Company | null>(null)

  const findCompany = async () => {
    if (!companyCode.trim()) return toast.error('Masukkan kode perusahaan')

    try {
      setLoading(true)
      setFoundCompany(null)

      const snap = await getDocs(
        query(collection(db, 'companies'), where('code', '==', companyCode.trim().toUpperCase())),
      )

      if (snap.empty) {
        toast.error('Kode perusahaan tidak ditemukan')
        return
      }

      const d = snap.docs[0]
      setFoundCompany({ id: d.id, ...(d.data() as any) } as Company)
    } catch (e) {
      console.error(e)
      toast.error('Gagal mencari perusahaan')
    } finally {
      setLoading(false)
    }
  }

  const joinAs = async (role: UserRole) => {
    if (!foundCompany) return

    const already = (user.companies || []).some(m => m.companyId === foundCompany.id)
    if (already) return toast.error('Anda sudah bergabung dengan perusahaan ini')

    try {
      setLoading(true)
      const membership = { companyId: foundCompany.id, role, joinedAt: new Date().toISOString() }
      const nextCompanies = [...(user.companies || []), membership]

      await setDoc(
        doc(db, 'users', user.id),
        {
          companyId: foundCompany.id,
          role,
          companies: nextCompanies,
        },
        { merge: true },
      )

      toast.success(`Bergabung dengan ${foundCompany.name} sebagai ${role === 'admin' ? 'Admin' : 'Kurir'}`)

      // PATCH user state di App langsung
      onRequestSent({
        companyId: foundCompany.id,
        role,
        companies: nextCompanies,
      })
    } catch (e: any) {
      console.error(e)
      toast.error(`Gagal bergabung: ${e?.code || e?.message || String(e)}`)
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
          <CardTitle className="text-2xl">Gabung Perusahaan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-code">Kode Perusahaan</Label>
            <Input
              id="company-code"
              placeholder="Masukkan kode perusahaan"
              value={companyCode}
              onChange={e => setCompanyCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && findCompany()}
              className="font-mono"
            />
          </div>

          <Button onClick={findCompany} className="w-full" disabled={loading}>
            {loading ? 'Mencari...' : 'Cari'}
          </Button>

          {foundCompany && (
            <div className="border rounded-lg p-4 space-y-3">
              <div>
                <p className="font-medium">{foundCompany.name}</p>
                <p className="text-xs text-muted-foreground">Kode: {foundCompany.code}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => joinAs('admin')} disabled={loading}>
                  Sebagai Admin
                </Button>
                <Button variant="outline" onClick={() => joinAs('courier')} disabled={loading}>
                  Sebagai Kurir
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}