import { useState } from 'react'
import { User } from '@/lib/types'
import CourierSidebar from './CourierSidebar'
import CourierHomeView from './CourierHomeView'
import CourierRecommendationView from './CourierRecommendationView'
import CourierUpdateView from './CourierUpdateView'
import CourierHistoryView from './CourierHistoryView'
import { db } from '@/lib/firebase'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { toast } from 'sonner'

type CourierView = 'home' | 'recommendation' | 'update' | 'history'

interface CourierDashboardProps {
  user: User
  onLogout: () => void
  onBackToHome?: () => void
  // legacy props from old code: keep to avoid App.tsx mismatch
  onUpdatePackageStatus?: any
  allPackages?: any
}

export default function CourierDashboard({ user, onLogout, onBackToHome }: CourierDashboardProps) {
  const [currentView, setCurrentView] = useState<CourierView>('home')

  const leaveCompany = async () => {
    if (!user.companyId) return
    const companyId = user.companyId

    try {
      // set member inactive (ignore jika doc belum ada)
      try {
        await updateDoc(doc(db, 'companyMembers', `${companyId}_${user.id}`), {
          active: false,
          leftAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      } catch (e) {
        // ignore
      }

      await setDoc(doc(db, 'users', user.id), { companyId: '', role: 'customer' }, { merge: true })

      toast.success('Keluar perusahaan berhasil')
      onBackToHome?.()
    } catch (e) {
      console.error(e)
      toast.error('Gagal keluar perusahaan')
    }
  }

  const renderView = () => {
    switch (currentView) {
      case 'recommendation':
        return <CourierRecommendationView user={user} />
      case 'update':
        return <CourierUpdateView user={user} />
      case 'history':
        return <CourierHistoryView user={user} />
      case 'home':
      default:
        return <CourierHomeView user={user} onGoRecommendation={() => setCurrentView('recommendation')} />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <CourierSidebar
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={onLogout}
        onBackToHome={onBackToHome}
        onLeaveCompany={leaveCompany}
      />
      <main className="flex-1 lg:ml-48">{renderView()}</main>
    </div>
  )
}