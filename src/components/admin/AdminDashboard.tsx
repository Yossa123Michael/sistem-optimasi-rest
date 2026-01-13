import { useEffect, useState } from 'react'
import { User } from '@/lib/types'
import AdminSidebar from './AdminSidebar'
import HomeView from './HomeView'
import CourierView from './CourierView'
import CourierActivationView from './CourierActivationView'
import MonitoringView from './MonitoringView'
import HistoryView from './HistoryView'

export type AdminView =
  | 'home'
  | 'courier'
  | 'courier-activation'
  | 'monitoring'
  | 'history'

interface AdminDashboardProps {
  user: User
  onLogout: () => void
  onBackToHome?: () => void
}

export default function AdminDashboard({ user, onLogout, onBackToHome }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>('home')
  const [showActivation, setShowActivation] = useState(false)

  useEffect(() => {
    // Kalau belum pilih company, paksa balik home utama
    if (!user.companyId || user.role !== 'admin') {
      onBackToHome?.()
    }
  }, [user.companyId, user.role, onBackToHome])

  const renderView = () => {
    if (showActivation) {
      return (
        <CourierActivationView
          user={user}
          onBack={() => setShowActivation(false)}
        />
      )
    }

    switch (currentView) {
      case 'courier':
        return (
          <CourierView
            user={user}
            onActivate={() => setShowActivation(true)}
          />
        )
      case 'monitoring':
        return <MonitoringView user={user} />
      case 'history':
        return <HistoryView user={user} />
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
        onViewChange={(v) => {
          setShowActivation(false)
          setCurrentView(v)
        }}
        onLogout={onLogout}
        onBackToHome={onBackToHome}
      />
      <main className="flex-1 lg:ml-48">{renderView()}</main>
    </div>
  )
}