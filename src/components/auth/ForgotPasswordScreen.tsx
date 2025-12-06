import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { validateEmail } from '@/lib/auth'

interface ForgotPasswordScreenProps {
  onBack: () => void
  onRegister: () => void
}

export default function ForgotPasswordScreen({ onBack, onRegister }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Masukan email')
      return
    }

    if (!validateEmail(email)) {
      toast.error('Format email tidak valid')
      return
    }

    toast.success('Link reset password telah dikirim ke email Anda')
    setTimeout(() => {
      onBack()
    }, 1500)
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
          <CardTitle className="text-3xl font-semibold">Reset Password</CardTitle>
          <p className="text-muted-foreground mt-2">
            Masukkan email Anda untuk menerima link reset password
          </p>
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

            <Button type="submit" className="w-full" size="lg">
              Kirim Link Reset
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-center text-sm">
            <button
              onClick={onBack}
              className="text-primary hover:underline font-medium"
            >
              Kembali ke Login
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
        </CardContent>
      </Card>
    </div>
  )
}
