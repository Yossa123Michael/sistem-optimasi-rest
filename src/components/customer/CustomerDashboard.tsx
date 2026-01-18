import { useState } from 'react'
import { User } from '@/lib/types'
import CustomerSidebar from './CustomerSidebar'
import CustomerHomeView from './CustomerHomeView'
import CustomerHistoryView from './CustomerHistoryView'
import CustomerOrderView from './CustomerOrderView'
import CostumerStatusview from './CustomerStatusView'
import CustomerPaymentHubView from './CustomerPaymentHubView' // NEW

type CustomerView = 'home' | 'pemesanan' | 'status' | 'history' | 'payment' // NEW

interface CustomerDashboardProps {
  user: User
  onLogout: () => void
  onBackToHome?: () => void
}

export default function CustomerDashboard({ user, onLogout, onBackToHome }: CustomerDashboardProps) {
  const [currentView, setCurrentView] = useState<CustomerView>('home')

  const renderView = () => {
    switch (currentView) {
      case 'pemesanan':
        return <CustomerOrderView user={user} />
      case 'status':
        return <CostumerStatusview user={user} />
      case 'history':
        return <CustomerHistoryView user={user} onBack={() => setCurrentView('home')} />
      case 'payment':
        return <CustomerPaymentHubView user={user} onBack={() => setCurrentView('home')} />
      case 'home':
      default:
        return (
          <CustomerHomeView
            user={user}
            onGoOrder={() => setCurrentView('pemesanan')}
            onGoStatus={() => setCurrentView('status')}
            onGoHistory={() => setCurrentView('history')}
            onGoPayment={() => setCurrentView('payment')}
          />
        )
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <CustomerSidebar
        user={user}
        currentView={currentView as any}
        onViewChange={setCurrentView as any}
        onLogout={onLogout}
        onBackToHome={onBackToHome}
      />
      <main className="flex-1 lg:ml-48">{renderView()}</main>
    </div>
  )
}