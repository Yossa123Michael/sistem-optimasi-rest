import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { User, Company } from '@/lib/types'
import AdminSidebar from './AdminSidebar'
import HomeView from './HomeView'
import InputDataView from './InputDataView'
import CourierView from './CourierView'
import CourierActivationView from './CourierActivationView'
import MonitoringView from './MonitoringView'
import HistoryView from './HistoryView'

type AdminView = 'home' | 'input-data' | 'courier' | 'courier-activation' | 'monitoring' | 'history'

interface AdminDashboardProps {
  user: User
  onLogout: () => void
  onBackToHome?: () => void
}

export default function AdminDashboard({ user, onLogout, onBackToHome }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>('home')
  const [companies] = useKV<Company[]>('companies', [])
  
  useEffect(() => {
    if (!user.companyId) {
      if (onBackToHome) onBackToHome()
      return
    }
    
    const companyExists = (companies || []).some(c => c.id === user.companyId)
    if (!companyExists && onBackToHome) {
      onBackToHome()
    }
  }, [user.companyId, companies, onBackToHome])

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView user={user} />
      case 'input-data':
        return <InputDataView user={user} />
      case 'courier':
        return <CourierView user={user} onActivate={() => setCurrentView('courier-activation')} />
      case 'courier-activation':
        return <CourierActivationView user={user} onBack={() => setCurrentView('courier')} />
      case 'monitoring':
        return <MonitoringView user={user} />
      case 'history':
        return <HistoryView user={user} />
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
      <main className="flex-1 lg:ml-48">
        {renderView()}
      </main>
    </div>
  )
}
