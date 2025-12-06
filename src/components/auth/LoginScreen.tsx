import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { User } from '@/lib/types'
import { verifyPassword } from '@/lib/auth'

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void
  onForgotPassword: () => void
  onRegister: () => void
  onTrackPackage: () => void
}

export default function LoginScreen({
  onLoginSuccess,
  onForgotPassword,
  onRegister,
  onTrackPackage
}: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [users] = useKV<User[]>('users', [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email && !password) {
      toast.error('Masukan email dan password')
      return
    }

    if (!email) {
      toast.error('Masukan email')
      return
    }

    if (!password) {
      toast.error('Masukan password')
      return
    }

    const user = users?.find(u => u.email === email)

    if (!user || !verifyPassword(password, user.password)) {
      toast.error('Email atau password salah')
      return
    }

    toast.success('Login berhasil')
    onLoginSuccess(user)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary/50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-2xl p-4">
              <Package size={48} weight="duotone" className="text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-semibold">Welcome Back</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Login
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-center text-sm">
            <button
              onClick={onForgotPassword}
              className="text-primary hover:underline font-medium"
            >
              Lupa Password?
            </button>
            
            <div className="flex items-center justify-center gap-2">
              <span className="text-muted-foreground">Belum punya akun?</span>
              <button
                onClick={onRegister}
                className="text-primary hover:underline font-medium"
              >
                Daftar
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={onTrackPackage}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Cek Paket
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
