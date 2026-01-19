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
  | 'employees' 
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

      const cSnap = await getDocs(query(collection(db, 'couriers'), where('companyId', '==', user.companyId)))
      setCouriers(cSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Courier)))

      const pSnap = await getDocs(query(collection(db, 'packages'), where('companyId', '==', user.companyId)))
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

  // leave company (admin saja, owner tidak boleh)
  const leaveCompany = async () => {
    if (!user.companyId) return
    const companyId = user.companyId

    try {
      // 1) companyMembers -> inactive (ignore kalau belum ada)
      try {
        await updateDoc(doc(db, 'companyMembers', `${companyId}_${user.id}`), {
          active: false,
          leftAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      } catch {}

      // 2) hapus membership dari users.companies[] + reset active company
      const userRef = doc(db, 'users', user.id)
      const snap = await getDoc(userRef)
      const data = snap.exists() ? (snap.data() as any) : {}
      const companiesArr: any[] = Array.isArray(data.companies) ? data.companies : []
      const nextCompanies = companiesArr.filter(m => m?.companyId !== companyId)

      await setDoc(
        userRef,
        { companies: nextCompanies, companyId: '', role: 'customer' },
        { merge: true },
      )

      toast.success('Keluar perusahaan berhasil')
      onBackToHome?.()
    } catch (e) {
      console.error(e)
      toast.error('Gagal keluar perusahaan')
    }
  }

  // delete company cascade (owner)
  const deleteCompanyCascade = async () => {
    if (!user.companyId) return
    const companyId = user.companyId

    try {
      await setDoc(
        doc(db, 'companies', companyId),
        { archived: true, updatedAt: new Date().toISOString() },
        { merge: true },
      )

      const batch = writeBatch(db)

      // reset active users
      const usersSnap = await getDocs(query(collection(db, 'users'), where('companyId', '==', companyId)))
      usersSnap.docs.forEach(u => batch.update(doc(db, 'users', u.id), { companyId: '', role: 'customer' }))

      // delete ops data
      const courSnap = await getDocs(query(collection(db, 'couriers'), where('companyId', '==', companyId)))
      courSnap.docs.forEach(d => batch.delete(doc(db, 'couriers', d.id)))

      const pkgSnap = await getDocs(query(collection(db, 'packages'), where('companyId', '==', companyId)))
      pkgSnap.docs.forEach(d => batch.delete(doc(db, 'packages', d.id)))

      const ordSnap = await getDocs(query(collection(db, 'orders'), where('companyId', '==', companyId)))
      ordSnap.docs.forEach(d => batch.delete(doc(db, 'orders', d.id)))

      const reqSnap = await getDocs(query(collection(db, 'employeeRequests'), where('companyId', '==', companyId)))
      reqSnap.docs.forEach(d => batch.delete(doc(db, 'employeeRequests', d.id)))

      batch.delete(doc(db, 'routeOptimizations', companyId))

      await batch.commit()

      // publicTracking delete (up to 500)
      const trackSnap = await getDocs(
        query(collection(db, 'publicTracking'), where('companyId', '==', companyId), limit(500)),
      )
      for (const t of trackSnap.docs) await deleteDoc(doc(db, 'publicTracking', t.id))

      // companyMembers delete (up to 500)
      const memSnap = await getDocs(
        query(collection(db, 'companyMembers'), where('companyId', '==', companyId), limit(500)),
      )
      for (const m of memSnap.docs) await deleteDoc(doc(db, 'companyMembers', m.id))

      toast.success('Perusahaan berhasil dihapus')
      onBackToHome?.()
    } catch (e) {
      console.error(e)
      toast.error('Gagal menghapus perusahaan')
    }
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