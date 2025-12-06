import { useState } from 'react'
import { User } from '@/lib/types'
import CourierSidebar from './CourierSidebar'
import CourierHomeView from './CourierHomeView'
import CourierPackageListView from './CourierPackageListView'
import CourierRecommendationView from './CourierRecommendationView'
import CourierUpdateView from './CourierUpdateView'

type CourierView = 'home' | 'package-list' | 'recommendation' | 'update'

interface CourierDashboardProps {
  user: User
  onLogout: () => void
}

export default function CourierDashboard({ user, onLogout }: CourierDashboardProps) {
  const [currentView, setCurrentView] = useState<CourierView>('home')

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <CourierHomeView user={user} />
      case 'package-list':
        return <CourierPackageListView user={user} />
      case 'recommendation':
        return <CourierRecommendationView user={user} />
      case 'update':
        return <CourierUpdateView user={user} />
      default:
        return <CourierHomeView user={user} />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <CourierSidebar
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={onLogout}
      />
      <main className="flex-1 lg:ml-64">
        {renderView()}
      </main>
    </div>
  )
}
