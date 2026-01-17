import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

interface RegisterScreenProps {
  onRegisterSuccess: () => void
  onLogin: () => void
}

export default function RegisterScreen({ onRegisterSuccess, onLogin }: RegisterScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) return toast.error('Masukan email')
    if (!password) return toast.error('Masukan password')

    try {
      setLoading(true)
      const cred = await createUserWithEmailAndPassword(auth, email, password)

      const displayName = email.split('@')[0]
      await updateProfile(cred.user, { displayName })

      // buat doc user di Firestore
      await setDoc(
        doc(db, 'users', cred.user.uid),
        {
          id: cred.user.uid,
          email,
          name: displayName,
          companies: [],
        },
        { merge: true },
      )

      toast.success('Registrasi berhasil')
      onRegisterSuccess()
    } catch (err: any) {
      console.error('Register error', err)
      toast.error(err?.message || 'Registrasi gagal')
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
              <Package size={48} weight="duotone" className="text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-semibold">Create Account</CardTitle>
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
              {loading ? 'Loading...' : 'Daftar'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Sudah punya akun?</span>
            <button onClick={onLogin} className="text-primary hover:underline font-medium" type="button">
              Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}