import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from '@/lib/types'

interface CustomerHomeViewProps {
  user: User
}

export default function CustomerHomeView({ user }: CustomerHomeViewProps) {
  const userName = user.name || user.email.split('@')[0]

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 mb-6">
          <h1 className="text-2xl font-medium mb-8">Halo, {userName}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Button 
              variant="outline" 
              className="h-24 text-lg border-2"
            >
              Pesan
            </Button>
            <Button 
              variant="outline" 
              className="h-24 text-lg border-2"
            >
              Cek Status Paket
            </Button>
          </div>
        </Card>

        <Card className="p-8">
          <p className="text-center text-lg text-muted-foreground">Sebagai Customer</p>
        </Card>
      </div>
    </div>
  )
}
