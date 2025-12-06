import { useState } from 'react'
import { User } from '@/lib/types'
import CustomerSidebar from './CustomerSidebar'
import CustomerHomeView from './CustomerHomeView'

type CustomerView = 'home' | 'orders' | 'track'

interface CustomerDashboardProps {
  user: User
  onLogout: () => void
}

export default function CustomerDashboard({ user, onLogout }: CustomerDashboardProps) {
  const [currentView, setCurrentView] = useState<CustomerView>('home')

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <CustomerHomeView user={user} />
      case 'orders':
        return <CustomerHomeView user={user} />
      case 'track':
        return <CustomerHomeView user={user} />
      default:
        return <CustomerHomeView user={user} />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <CustomerSidebar
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={onLogout}
      />
      <main className="flex-1 lg:ml-48">
        {renderView()}
      </main>
    </div>
  )
}
