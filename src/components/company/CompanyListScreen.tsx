import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Buildings, Copy } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { User, Company } from '@/lib/types'

interface CompanyListScreenProps {
  user: User
  onBack: () => void
  onSelectCompany: (companyId: string) => void
}

export default function CompanyListScreen({ user, onBack, onSelectCompany }: CompanyListScreenProps) {
  const [companies] = useKV<Company[]>('companies', [])
  const [users, setUsers] = useKV<User[]>('users', [])
  const [currentUser, setCurrentUser] = useKV<User | null>('current-user', null)

  const existingCompanyIds = (companies || []).map(c => c.id)
  const userCompanyIds = (user.companies || [])
    .filter(m => existingCompanyIds.includes(m.companyId))
    .map(m => m.companyId)
  
  const userCompanies = (companies || []).filter(
    (company) => userCompanyIds.includes(company.id)
  )

  useEffect(() => {
    if (user && user.companies && user.companies.length > 0) {
      const hasInvalidCompanies = user.companies.some(
        m => !existingCompanyIds.includes(m.companyId)
      )

      if (hasInvalidCompanies) {
        const cleanedCompanies = user.companies.filter(m => 
          existingCompanyIds.includes(m.companyId)
        )

        setCurrentUser((prev) => {
          if (!prev) return null
          return {
            ...prev,
            companies: cleanedCompanies
          }
        })

        setUsers((prevUsers) => 
          (prevUsers || []).map(u => {
            if (u.id === user.id) {
              return {
                ...u,
                companies: cleanedCompanies
              }
            }
            return u
          })
        )
      }
    }
  }, [companies, user.id])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Kode berhasil disalin')
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2" />
          Kembali
        </Button>

        <h1 className="text-3xl font-semibold mb-6">Daftar Perusahaan</h1>

        {userCompanies.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Buildings size={64} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Anda belum memiliki perusahaan</p>
              <Button onClick={onBack} className="mt-4">
                Buat atau Gabung Perusahaan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {userCompanies.map((company) => (
              <Card key={company.id} className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Buildings size={32} weight="duotone" className="text-primary" />
                      <span>{company.name}</span>
                    </div>
                    {company.ownerId === user.id && (
                      <span className="text-sm font-normal text-muted-foreground px-3 py-1 bg-secondary rounded-full">
                        Owner
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between bg-muted rounded-lg p-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Kode Perusahaan</p>
                      <p className="font-mono text-lg font-semibold">{company.code}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyCode(company.code)}
                    >
                      <Copy size={20} />
                    </Button>
                  </div>
                  <Button
                    onClick={() => onSelectCompany(company.id)}
                    className="w-full"
                  >
                    Masuk ke Perusahaan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
