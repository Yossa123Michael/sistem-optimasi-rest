import { useEffect, useState } from 'react'
import { User, Company, UserRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, setDoc } from 'firebase/firestore'
import { toast } from 'sonner'

interface CompanySelectionScreenProps {
  user: User
  onSelected: () => void
  onBack?: () => void
}

export default function CompanySelectionScreen({ user, onSelected, onBack }: CompanySelectionScreenProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const snap = await getDocs(collection(db, 'companies'))
        setCompanies(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const userCompanies = (user.companies || [])
    .map(m => {
      const c = companies.find(x => x.id === m.companyId)
      return c ? { ...c, role: m.role as UserRole } : null
    })
    .filter(Boolean) as Array<Company & { role: UserRole }>

  const choose = async (companyId: string, role: UserRole) => {
    try {
      await setDoc(doc(db, 'users', user.id), { companyId, role }, { merge: true })
      toast.success('Perusahaan dipilih')
      onSelected()
    } catch (e) {
      console.error(e)
      toast.error('Gagal memilih perusahaan')
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Pilih Perusahaan</h1>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Kembali
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : userCompanies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Anda belum punya perusahaan.</p>
        ) : (
          <div className="space-y-3">
            {userCompanies.map(c => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">Role: {c.role}</p>
                  </div>
                  <Button onClick={() => choose(c.id, c.role)}>Pilih</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}