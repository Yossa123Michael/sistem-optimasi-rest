import { useState } from 'react'
import { User } from '@/lib/types'
import CustomerSidebar from './CustomerSidebar'
import CustomerHomeView from './CustomerHomeView'
import CustomerStatusView from './CustomerStatusView'
import CustomerHistoryView from './CustomerHistoryView'

type CustomerView = 'home' | 'status' | 'history'

interface CustomerDashboardProps {
  user: User
  onLogout: () => void
  onBackToHome?: () => void
}

export default function CustomerDashboard({ user, onLogout, onBackToHome }: CustomerDashboardProps) {
  const [currentView, setCurrentView] = useState<CustomerView>('home')

  const renderView = () => {
    switch (currentView) {
      case 'status':
        return <CustomerStatusView user={user} />
      case 'history':
        return <CustomerHistoryView user={user} />
      case 'home':
      default:
        return <CustomerHomeView user={user} onGoStatus={() => setCurrentView('status')} onGoHistory={() => setCurrentView('history')} />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <CustomerSidebar
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