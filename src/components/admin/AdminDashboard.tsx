import { useEffect, useMemo, useState } from 'react'
import { User, Company, EmployeeRequest, UserRole, Courier, Package } from '@/lib/types'
import AdminSidebar from './AdminSidebar'
import HomeView from './HomeView'
import CourierActivationView from './CourierActivationView'
import MonitoringView from './MonitoringView'
import HistoryView from './HistoryView'
import EmployeeRequestsView from './EmployeeRequestsView'
import InputDataView from './InputDataView'
import OrderRequestsView from './OrderRequestView'
import { db } from '@/lib/firebase'
import CompanySettingsView from './CompanySettingsView'
import EmployeesView from './EmployeesView'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  writeBatch,
  deleteDoc,
  limit,
  updateDoc,
} from 'firebase/firestore'
import { toast } from 'sonner'

export type AdminView =
  | 'home'
  | 'input-data'
  | 'courier'
  | 'orders'
  | 'company-settings'
  | 'employees' // NEW
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
  const [companies] = useKV<Company[]>('companies', [])
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    if (!user.companyId || user.role !== 'admin') {
      onBackToHome?.()
    }
  }, [user.companyId, user.role, onBackToHome])

  useEffect(() => {
    const loadCompany = async () => {
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
    loadCompany()
  }, [user.companyId])

  const isOwner = useMemo(() => !!company && user.id === company.ownerId, [company, user.id])

  const reloadCompanyData = async () => {
    if (!user.companyId) {
      console.log('AdminDashboard: User does not have companyId, waiting...')
      return
    }
    
    const companyExists = (companies || []).some(c => c.id === user.companyId)
    if (!companyExists) {
      console.log('AdminDashboard: Company does not exist')
      if (onBackToHome) onBackToHome()
      return
    }
    
    console.log('AdminDashboard: Ready to render')
    setIsReady(true)
  }, [user.companyId, companies, onBackToHome])

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  const renderView = () => {
    if (showActivation) {
      return <CourierActivationView user={user} onBack={() => setShowActivation(false)} />
    }

    switch (currentView) {
      case 'orders':
        return <OrderRequestsView user={user} />

      case 'input-data': {
        if (loadingCompany || loadingData) return <div className="p-6">Memuat...</div>
        if (!company) return <div className="p-6">Company tidak ditemukan.</div>

        return (
          <InputDataView
            company={company}
            couriers={couriers}
            packages={packages}
            onSetCouriers={setCouriers}
            onSetPackages={setPackages}
            onBackToOverview={() => setCurrentView('home')}
          />
        )
      }

      case 'courier':
        return <CourierActivationView user={user} onBack={() => setCurrentView('home')} />

      case 'monitoring':
        return <MonitoringView user={user} />

      case 'employees':
        return isOwner ? <EmployeesView user={user} /> : <HomeView user={user} />

      case 'requests': {
        if (!isOwner) return <HomeView user={user} />
        if (loadingCompany) return <div className="p-6">Memuat...</div>
        if (!company) return <div className="p-6">Company tidak ditemukan.</div>

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

      case 'company-settings':
        return <CompanySettingsView user={user} />

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
        isOwner={isOwner}
        onViewChange={(v) => {
          setShowActivation(false)
          setCurrentView(v)
        }}
        onLogout={onLogout}
        onBackToHome={onBackToHome}
        onLeaveCompany={isOwner ? undefined : leaveCompany}
        onDeleteCompany={isOwner ? deleteCompanyCascade : undefined}
      />
      <main className="flex-1 lg:ml-48">{renderView()}</main>
    </div>
  )
}