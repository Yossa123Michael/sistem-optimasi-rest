import { useEffect, useMemo, useState } from 'react'
import { User, Company, UserRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore'
import { toast } from 'sonner'

type CompanyMember = {
  id: string
  companyId: string
  userId: string
  role: UserRole
  active?: boolean
}

interface CompanySelectionScreenProps {
  user: User
  onSelected: () => void
  onBack?: () => void
}

export default function CompanySelectionScreen({ user, onSelected, onBack }: CompanySelectionScreenProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [memberships, setMemberships] = useState<CompanyMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)

        const [cSnap, mSnap] = await Promise.all([
          getDocs(collection(db, 'companies')),
          getDocs(
            query(
              collection(db, 'companyMembers'),
              where('userId', '==', user.id),
              where('active', '==', true),
            ),
          ),
        ])

        setCompanies(cSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Company)))
        setMemberships(mSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as CompanyMember)))
      } catch (e: any) {
        console.error(e)
        toast.error(`Gagal memuat perusahaan: ${e?.code || e?.message || String(e)}`)
        setCompanies([])
        setMemberships([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user.id])

  const userCompanies = useMemo(() => {
    const mapCompany = new Map(companies.map(c => [c.id, c]))
    return memberships
      .map(m => {
        const c = mapCompany.get(m.companyId)
        return c ? ({ ...c, role: m.role } as Company & { role: UserRole }) : null
      })
      .filter(Boolean) as Array<Company & { role: UserRole }>
  }, [companies, memberships])

  const choose = async (companyId: string, role: UserRole) => {
    try {
      await setDoc(doc(db, 'users', user.id), { companyId, role }, { merge: true })
      toast.success('Perusahaan dipilih')
      onSelected()
    } catch (e: any) {
      console.error(e)
      toast.error(`Gagal memilih perusahaan: ${e?.code || e?.message || String(e)}`)
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