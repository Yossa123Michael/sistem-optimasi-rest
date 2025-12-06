import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User as UserIcon, Truck, ShoppingCart, SignOut } from '@phosphor-icons/react'
import { User, UserRole } from '@/lib/types'

interface RoleSelectionScreenProps {
  user: User
  onRoleSelected: (role: UserRole) => void
  onSignOut: () => void
}

export default function RoleSelectionScreen({ user, onRoleSelected, onSignOut }: RoleSelectionScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary/50 p-4">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-semibold">
            Selamat datang, {user.name || user.email}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Pilih peran Anda untuk melanjutkan
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={() => onRoleSelected('admin')}
              className="group relative overflow-hidden rounded-xl border-2 border-border hover:border-primary transition-all p-8 text-center bg-card hover:bg-primary/5"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="bg-primary rounded-2xl p-6 group-hover:scale-110 transition-transform">
                  <UserIcon size={48} weight="duotone" className="text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Buat Perusahaan</h3>
                  <p className="text-sm text-muted-foreground">
                    Buat perusahaan dan kelola Bisnis Anda
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
                  <h3 className="text-2xl font-semibold mb-2">Gabung Perusahaan</h3>
                  <p className="text-sm text-muted-foreground">
                    Gabung Perusahaan Sebagai Kurir/Admin
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onRoleSelected('customer')}
              className="group relative overflow-hidden rounded-xl border-2 border-border hover:border-secondary transition-all p-8 text-center bg-card hover:bg-secondary/50"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="bg-secondary rounded-2xl p-6 group-hover:scale-110 transition-transform">
                  <ShoppingCart size={48} weight="duotone" className="text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Customer</h3>
                  <p className="text-sm text-muted-foreground">
                    Pesan dan lacak paket Anda
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              onClick={onSignOut}
              variant="outline"
              className="gap-2"
            >
              <SignOut size={20} weight="duotone" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
