import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { User } from '@/lib/types'
import { generateId, validateEmail, hashPassword } from '@/lib/auth'

interface RegisterScreenProps {
  onRegisterSuccess: (user: User) => void
  onLogin: () => void
}

export default function RegisterScreen({ onRegisterSuccess, onLogin }: RegisterScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [users, setUsers] = useKV<User[]>('users', [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Masukan email')
      return
    }

    if (!password) {
      toast.error('Masukan password')
      return
    }

    if (!validateEmail(email)) {
      toast.error('Format email tidak valid')
      return
    }

    const existingUser = users?.find(u => u.email === email)
    if (existingUser) {
      toast.error('Email sudah terdaftar')
      return
    }

    const newUser: User = {
      id: generateId(),
      email,
      password: hashPassword(password),
      name: email.split('@')[0]
    }

    setUsers((currentUsers) => [...(currentUsers || []), newUser])
    toast.success('Registrasi berhasil')
    onRegisterSuccess(newUser)
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
              Daftar
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Sudah punya akun?</span>
            <button
              onClick={onLogin}
              className="text-primary hover:underline font-medium"
            >
              Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
