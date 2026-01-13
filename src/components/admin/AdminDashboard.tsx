import { useEffect, useState } from 'react'
import { User } from '@/lib/types'
import AdminSidebar from './AdminSidebar'
import HomeView from './HomeView'
import CourierView from './CourierView'
import CourierActivationView from './CourierActivationView'
import MonitoringView from './MonitoringView'
import HistoryView from './HistoryView'

import EmployeeRequestsView from './EmployeeRequestsView'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export type AdminView =
  | 'home'
  | 'courier'
  | 'courier-activation'
  | 'monitoring'
  | 'requests'
  | 'history'

interface AdminDashboardProps {
  user: User
  onLogout: () => void
  onBackToHome?: () => void
}

export default function AdminDashboard({ user, onLogout, onBackToHome }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>('home')
  const [showActivation, setShowActivation] = useState(false)

  const [company, setCompany] = useState<Company | null>(null)
  const [loadingCompany, setLoadingCompany] = useState(true)

    useEffect(() => {
    // Kalau belum pilih company, paksa balik home utama
    if (!user.companyId || user.role !== 'admin') {
      onBackToHome?.()
    }
  }, [user.companyId, user.role, onBackToHome])

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCompany(true)
        if (!user.companyId) {
          setCompany(null)
          return
        }
        const snap = await getDoc(doc(db, 'companies', user.companyId))
        setCompany(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Company) : null)
      } finally {
        setLoadingCompany(false)
      }
    }
    load()
  }, [user.companyId])

  const renderView = () => {
    if (showActivation) {
      return <CourierActivationView user={user} onBack={() => setShowActivation(false)} />
    }

    switch (currentView) {
      case 'courier':
        return <CourierView user={user} onActivate={() => setShowActivation(true)} />

      case 'monitoring':
        return <MonitoringView user={user} />

      case 'requests': {
        if (loadingCompany) return <div className="p-6">Memuat...</div>
        if (!company) return <div className="p-6">Company tidak ditemukan.</div>

        // callbacks ini dipakai EmployeeRequestsView, kita buat versi “no-op” yang aman
        const onUpdateStatus = (_id: string, _status: EmployeeRequest['status']) => {}
        const onApproveAsRole = (_req: EmployeeRequest, _role: Exclude<UserRole, 'customer'>) => {}

        return (
          <EmployeeRequestsView
            company={company}
            currentUser={user}
            requests={[]}
            onUpdateStatus={onUpdateStatus}
            onApproveAsRole={onApproveAsRole}
            onBackToOverview={() => setCurrentView('home')}
          />
        )
      }

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