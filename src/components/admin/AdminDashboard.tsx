import { useEffect, useState } from 'react'
import { User } from '@/lib/types'
import AdminSidebar from './AdminSidebar'
import HomeView from './HomeView'

// NOTE: view lain akan kita migrasi setelah ini
type AdminView = 'home' | 'input-data' | 'courier' | 'courier-activation' | 'monitoring' | 'history'

interface AdminDashboardProps {
  user: User
  onLogout: () => void
  onBackToHome?: () => void
}

export default function AdminDashboard({ user, onLogout, onBackToHome }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>('home')

  useEffect(() => {
    if (!user.companyId || user.role !== 'admin') {
      onBackToHome?.()
    }
  }, [user.companyId, user.role, onBackToHome])

  const renderView = () => {
    switch (currentView) {
      case 'home':
      default:
        return <HomeView user={user} />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={onLogout}
        onBackToHome={onBackToHome}
      />
      <main className="flex-1 lg:ml-48">{renderView()}</main>
    </div>
  )
}