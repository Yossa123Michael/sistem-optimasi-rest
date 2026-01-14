import { useEffect, useMemo, useState } from 'react'
import { User, Company, EmployeeRequest, UserRole, Courier, Package } from '@/lib/types'
import AdminSidebar from './AdminSidebar'
import HomeView from './HomeView'
import CourierActivationView from './CourierActivationView' // keep
import MonitoringView from './MonitoringView'
import HistoryView from './HistoryView'
import EmployeeRequestsView from './EmployeeRequestsView'
import InputDataView from './InputDataView'
import { db } from '@/lib/firebase'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'

export type AdminView =
  | 'home'
  | 'input-data'
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

  const [couriers, setCouriers] = useState<Courier[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loadingData, setLoadingData] = useState(false)

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
      setCouriers([])
      setPackages([])
      return
    }

    try {
      setLoadingData(true)

      const cSnap = await getDocs(
        query(collection(db, 'couriers'), where('companyId', '==', user.companyId)),
      )
      setCouriers(cSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Courier)))

      const pSnap = await getDocs(
        query(collection(db, 'packages'), where('companyId', '==', user.companyId)),
      )
      setPackages(pSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Package)))
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    reloadCompanyData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.companyId])

  useEffect(() => {
    if (currentView === 'input-data' || currentView === 'courier') {
      reloadCompanyData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView])

  const renderView = () => {
    // NOTE: showActivation legacy (kalau masih kepakai di UI lain)
    if (showActivation) {
      return <CourierActivationView user={user} onBack={() => setShowActivation(false)} />
    }

    switch (currentView) {
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
        // CHANGE: menu Kurir sekarang jadi Aktivasi Kurir (aktif/nonaktif)
        return <CourierActivationView user={user} onBack={() => setCurrentView('home')} />

      case 'monitoring':
        return <MonitoringView user={user} />

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
      />
      <main className="flex-1 lg:ml-48">{renderView()}</main>
    </div>
  )
}