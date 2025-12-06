import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserRole } from '@/lib/types'
import { ArrowLeft } from '@phosphor-icons/react'

interface RoleSelectionScreenProps {
  companyName: string
  onBack: () => void
  onRoleSelected: (role: UserRole) => void
}

export default function RoleSelectionScreen({ companyName, onBack, onRoleSelected }: RoleSelectionScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  const handleConfirm = () => {
    if (selectedRole) {
      onRoleSelected(selectedRole)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit mb-4"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2" />
            Kembali
          </Button>
          <CardTitle className="text-2xl">Pilih Role</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Bergabung dengan: <span className="font-medium text-foreground">{companyName}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant={selectedRole === 'admin' ? 'default' : 'outline'}
            className="w-full h-20 text-lg"
            onClick={() => setSelectedRole('admin')}
          >
            Admin
          </Button>
          <Button
            variant={selectedRole === 'courier' ? 'default' : 'outline'}
            className="w-full h-20 text-lg"
            onClick={() => setSelectedRole('courier')}
          >
            Kurir
          </Button>
          <Button
            onClick={handleConfirm}
            className="w-full mt-6"
            disabled={!selectedRole}
          >
            Konfirmasi
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
