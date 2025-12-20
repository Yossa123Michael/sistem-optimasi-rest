import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { User } from '@/lib/types'
import { auth, googleProvider } from '@/lib/firebase'
import { signInWithPopup } from 'firebase/auth'

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
  onTrackPackage,
}: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loadingGoogle, setLoadingGoogle] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.error('Login dengan email/password akan diganti. Gunakan Login dengan Google.')
  }

  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true)
      const result = await signInWithPopup(auth, googleProvider)
      const fUser = result.user

      if (!fUser.email) {
        toast.error('Akun Google tidak memiliki email.')
        return
      }

      const user: User = {
        id: fUser.uid,
        email: fUser.email,
        password: '',
        name: fUser.displayName || fUser.email.split('@')[0],
      }

      toast.success('Login Google berhasil')
      onLoginSuccess(user)
    } catch (error: any) {
      console.error('Error login Google:', error)
      toast.error('Login Google gagal')
    } finally {
      setLoadingGoogle(false)
    }
  }

  const handlePhoneClick = () => {
    toast.info('Segera hadir')
  }

  const handleGuestLogin = () => {
    const guestUser: User = {
      id: 'guest-' + Date.now(),
      email: 'guest@routeoptima.com',
      password: '',
      name: 'Guest User',
    }
    toast.success('Masuk sebagai tamu')
    onLoginSuccess(guestUser)
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
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" variant="outline">
              Login (lama) – akan diganti
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={handleGoogleLogin}
              disabled={loadingGoogle}
            >
              {loadingGoogle ? 'Sedang masuk...' : 'Login dengan Google'}
            </Button>

            <Button
              type="button"
              className="w-full"
              size="lg"
              variant="outline"
              onClick={handlePhoneClick}
            >
              Login dengan Nomor HP (Segera Hadir)
            </Button>

            <Button
              type="button"
              className="w-full"
              size="lg"
              variant="secondary"
              onClick={handleGuestLogin}
            >
              Masuk sebagai Tamu (Testing)
            </Button>
          </div>

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