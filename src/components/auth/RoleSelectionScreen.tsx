import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User as UserIcon, Truck } from '@phosphor-icons/react'
import { User, UserRole } from '@/lib/types'

interface RoleSelectionScreenProps {
  user: User
  onRoleSelected: (role: UserRole) => void
}

export default function RoleSelectionScreen({ user, onRoleSelected }: RoleSelectionScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary/50 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-semibold">
            Selamat datang, {user.name || user.email}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Pilih peran Anda untuk melanjutkan
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => onRoleSelected('admin')}
              className="group relative overflow-hidden rounded-xl border-2 border-border hover:border-primary transition-all p-8 text-center bg-card hover:bg-primary/5"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="bg-primary rounded-2xl p-6 group-hover:scale-110 transition-transform">
                  <UserIcon size={48} weight="duotone" className="text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Admin</h3>
                  <p className="text-sm text-muted-foreground">
                    Kelola perusahaan, kurir, dan paket
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onRoleSelected('courier')}
              className="group relative overflow-hidden rounded-xl border-2 border-border hover:border-accent transition-all p-8 text-center bg-card hover:bg-accent/5"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="bg-accent rounded-2xl p-6 group-hover:scale-110 transition-transform">
                  <Truck size={48} weight="duotone" className="text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Kurir</h3>
                  <p className="text-sm text-muted-foreground">
                    Lihat dan kelola pengiriman paket
                  </p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
