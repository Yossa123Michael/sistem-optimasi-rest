import { Card, CardContent } from '@/components/ui/card'
import { User, Company } from '@/lib/types'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'

interface HomeViewProps {
  user: User
}

export default function HomeView({ user }: HomeViewProps) {
  const userName = user.name || user.email.split('@')[0]
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        if (!user.companyId) {
          setCompany(null)
          return
        }
        const snap = await getDoc(doc(db, 'companies', user.companyId))
        setCompany(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Company) : null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.companyId])

  if (!user.companyId) {
    return (
      <div className="p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          <Card className="border-destructive/50">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-medium mb-2 text-destructive">Belum pilih perusahaan</h2>
              <p className="text-muted-foreground">Silakan kembali ke Home dan pilih perusahaan.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!loading && !company) {
    return (
      <div className="p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          <Card className="border-destructive/50">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-medium mb-2 text-destructive">Perusahaan Tidak Ditemukan</h2>
              <p className="text-muted-foreground">Perusahaan ini sudah dihapus atau tidak tersedia lagi.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-medium mb-2">Dashboard Admin</h1>
          <p className="text-lg text-muted-foreground">Selamat datang, {userName}</p>
          {company && <p className="text-sm text-muted-foreground mt-1">Perusahaan: {company.name}</p>}
        </div>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-medium mb-4">Ringkasan</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>• Company ID: <span className="font-mono font-medium text-foreground">{user.companyId}</span></p>
              {company?.code && (
                <p>• Kode Perusahaan: <span className="font-mono font-medium text-foreground">{company.code}</span></p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}