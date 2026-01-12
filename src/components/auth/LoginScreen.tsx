import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

interface LoginScreenProps {
  onLoginSuccess: () => void
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
  const [loading, setLoading] = useState(false)

  const ensureUserDoc = async (uid: string, payload: any) => {
    const userRef = doc(db, 'users', uid)
    const snap = await getDoc(userRef)
    if (!snap.exists()) {
      await setDoc(
        userRef,
        {
          id: uid,
          companies: [],
          ...payload,
        },
        { merge: true },
      )
    } else {
      // optional merge update name/email if changed
      await setDoc(userRef, payload, { merge: true })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) return toast.error('Masukan email')
    if (!password) return toast.error('Masukan password')

    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      toast.success('Login berhasil')
      onLoginSuccess()
    } catch (err: any) {
      console.error('Login error', err)
      toast.error(err?.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)

      const fbUser = cred.user
      await ensureUserDoc(fbUser.uid, {
        email: fbUser.email || '',
        name:
          fbUser.displayName ||
          (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
      })

      toast.success('Login Google berhasil')
      onLoginSuccess()
    } catch (err: any) {
      console.error('Google login error', err)
      toast.error(err?.message || 'Login Google gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary/50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-2xl p-4">
              <Package
                size={48}
                weight="duotone"
                className="text-primary-foreground"
              />
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

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Loading...' : 'Login'}
            </Button>
          </form>

          <div className="mt-4">
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full"
              size="lg"
              disabled={loading}
              type="button"
            >
              {loading ? 'Loading...' : 'Login dengan Google'}
            </Button>
          </div>

          <div className="mt-6 flex flex-col gap-3 text-center text-sm">
            <button
              onClick={onForgotPassword}
              className="text-primary hover:underline font-medium"
              type="button"
            >
              Lupa Password?
            </button>

            <div className="flex items-center justify-center gap-2">
              <span className="text-muted-foreground">Belum punya akun?</span>
              <button
                onClick={onRegister}
                className="text-primary hover:underline font-medium"
                type="button"
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
              type="button"
            >
              Cek Paket
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}