import { useState, useEffect } from 'react'
import { User, UserRole, Company, RouteOptimization, Courier, Package, EmployeeRequest, UserCompanyMembership } from './lib/types'
import SplashScreen from './components/auth/SplashScreen'
import LoginScreen from './components/auth/LoginScreen'
import RegisterScreen from './components/auth/RegisterScreen'
import ForgotPasswordScreen from './components/auth/ForgotPasswordScreen'
import RoleSelectionScreen from './components/auth/RoleSelectionScreen'
import CompanySelectionScreen from './components/company/CompanySelectionScreen'
import HomeDashboard from './components/HomeDashboard'
import CreateCompanyScreen from './components/company/CreateCompanyScreen'
import JoinCompanyScreen from './components/company/JoinCompanyScreen'
import CompanyListScreen from './components/company/CompanyListScreen'
import AdminDashboard from './components/admin/AdminDashboard'
import CourierDashboard from './components/courier/CourierDashboard'
import CustomerDashboard from './components/customer/CustomerDashboard'
import TrackPackageScreen from './components/tracking/TrackPackageScreen'
import { Toaster } from './components/ui/sonner'

import { auth } from './lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { toast } from 'sonner'

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

type AppScreen =
  | 'splash'
  | 'login'
  | 'home-dashboard'
  | 'register'
  | 'forgot-password'
  | 'role-selection'
  | 'company-selection'
  | 'create-company'
  | 'join-company'
  | 'company-list'
  | 'admin-dashboard'
  | 'courier-dashboard'
  | 'customer-dashboard'
  | 'track-package'

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash')
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [homeRefreshKey, setHomeRefreshKey] = useState(0)
  const [employeeRequests, setEmployeeRequests] = useState<EmployeeRequest[]>([])
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [routes, setRoutes] = useState<RouteOptimization[]>([])

  // 1. Dengarkan Firebase Auth
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, fbUser => {
    if (!fbUser) {
      setCurrentUser(null)
      return
    }

    const baseInfo: Partial<User> = {
      id: fbUser.uid,
      email: fbUser.email || '',
      password: '',
      name:
        fbUser.displayName ||
        (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
    }

    console.log('Auth callback prev user:', currentUser)
    console.log('Auth callback baseInfo:', baseInfo)

    setCurrentUser(prev => {
      // Kalau sebelumnya sudah ada user dengan memberships, jangan hilangkan
      if (prev && prev.id === fbUser.uid && prev.companies && prev.companies.length > 0) {
        return {
          ...prev,
          ...baseInfo,
          companies: prev.companies,
        } as User
      }

      // Kalau belum ada atau belum punya companies
      return {
        ...(prev || {}),
        ...baseInfo,
        companies: prev?.companies || [],
      } as User
    })

    setCurrentScreen(prev =>
      prev === 'splash' || prev === 'login' ? 'home-dashboard' : prev,
    )
  })

  return () => unsubscribe()
}, [])

  useEffect(() => {
  const loadCompanyData = async () => {
    if (!currentUser?.companyId) return

    try {
      const companyId = currentUser.companyId

      // Couriers
      const couriersSnap = await getDocs(
        query(collection(db, 'couriers'), where('companyId', '==', companyId)),
      )
      const loadedCouriers: Courier[] = couriersSnap.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Courier),
      }))

      // Packages
      const packagesSnap = await getDocs(
        query(collection(db, 'packages'), where('companyId', '==', companyId)),
      )
      const loadedPackages: Package[] = packagesSnap.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Package),
      }))

      setCouriers(loadedCouriers)
      setPackages(loadedPackages)
    } catch (err) {
      console.error('Failed to load company data from Firestore', err)
      toast.error('Gagal memuat data kurir dan paket dari server')
    }
  }

  loadCompanyData()
}, [currentUser?.companyId])

  // 2. Sinkronisasi membership user (kalau users sudah terisi)
  useEffect(() => {
    if (!currentUser) return
    if (
      currentScreen === 'admin-dashboard' ||
      currentScreen === 'courier-dashboard' ||
      currentScreen === 'create-company' ||
      currentScreen === 'join-company'
    )
      return
    if (!users || users.length === 0) return

    const updated = users.find(u => u.id === currentUser.id)
    if (
      updated &&
      JSON.stringify(updated.companies) !==
        JSON.stringify(currentUser.companies)
    ) {
      setCurrentUser(prev =>
        prev ? { ...prev, companies: updated.companies } : null,
      )
    }
  }, [users, currentUser?.id, currentScreen])

  // 3. Cleanup membership ke perusahaan yang sudah dihapus
  useEffect(() => {
    const ids = (companies || []).map(c => c.id)
    if (!ids.length) return

    if (users && users.length) {
      const needsCleanup = users.some(
        u =>
          u.companies &&
          u.companies.some(m => !ids.includes(m.companyId)),
      )

      if (needsCleanup) {
        setUsers(prev =>
          (prev || []).map(u => ({
            ...u,
            companies: (u.companies || []).filter(m =>
              ids.includes(m.companyId),
            ),
          })),
        )
      }
    }

    if (currentUser && currentUser.companies && currentUser.companies.length) {
      const invalid = currentUser.companies.some(
        m => !ids.includes(m.companyId),
      )
      if (invalid) {
        setCurrentUser(prev => {
          if (!prev) return null
          return {
            ...prev,
            companies:
              prev.companies?.filter(m => ids.includes(m.companyId)) || [],
          }
        })
      }
    }
  }, [companies, users, currentUser])

  // 4. Logout
  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (e) {
      console.error('Error while signing out from Firebase:', e)
    } finally {
      try {
        await window.spark.kv.set('current-user', null)
      } catch (e) {
        console.warn('Failed to clear KV current-user:', e)
      }

      setCurrentUser(null)
      setCurrentScreen('login')
    }
  }

  const handleNavigateFromHome = async (
    screen:
      | 'home'
      | 'companies'
      | 'track-package'
      | 'create-company'
      | 'join-company'
      | 'customer-mode'
      | 'admin-dashboard'
      | 'courier-dashboard',
  ) => {
    console.log('handleNavigateFromHome called with:', screen)
    console.log('currentUser before navigate:', currentUser)

    if (screen === 'courier-dashboard') {
  // Sementara: paksa set companyId & role untuk testing akun kurir
  setCurrentUser(prev =>
    prev
      ? {
          ...prev,
          companyId: '1PWxUC2SafljdUJ3QmWb', // id Mooo
          role: 'courier',
        }
      : prev,
  )
  setCurrentScreen('courier-dashboard')
  return
}

if (screen === 'admin-dashboard') {
  setCurrentScreen('admin-dashboard')
  return
}
   
    if (screen === 'home') {
      setHomeRefreshKey(k => k + 1)
      setCurrentScreen('home-dashboard')
    } else if (screen === 'companies') {
      setCurrentScreen('company-list')
    } else if (screen === 'track-package') {
      setCurrentScreen('track-package')
    } else if (screen === 'create-company') {
      setCurrentScreen('create-company')
    } else if (screen === 'join-company') {
      setCurrentScreen('join-company')
    } else if (screen === 'customer-mode') {
      setCurrentScreen('customer-dashboard')
    }
  }

  const handleCompanyCreated = async (companyId: string) => {
    console.log('=== handleCompanyCreated called with companyId:', companyId)

    if (!currentUser) {
      console.warn('handleCompanyCreated: no currentUser, skip membership update')
    } else {
      const newMembership = {
        companyId,
        role: 'admin' as const,
        joinedAt: new Date().toISOString(),
      }

      const updatedUser: User = {
        ...currentUser,
        companies: [...(currentUser.companies || []), newMembership],
      }

      console.log('Updated user memberships:', updatedUser.companies)
      setCurrentUser(updatedUser)
    }

    setHomeRefreshKey(k => k + 1)
    setCurrentScreen('home-dashboard')
  }

  const handleCompanyJoined = (companyId: string, role: UserRole) => {
    setCurrentUser(prev => (prev ? { ...prev, companyId, role } : null))
    setHomeRefreshKey(k => k + 1)
    setTimeout(() => {
      if (role === 'admin') setCurrentScreen('admin-dashboard')
      else if (role === 'courier') setCurrentScreen('courier-dashboard')
      else setCurrentScreen('home-dashboard')
    }, 100)
  }

  const handleCompanySelected = (companyId: string) => {
    setCurrentUser(prev => (prev ? { ...prev, companyId } : null))
    if (currentUser?.role === 'admin') setCurrentScreen('admin-dashboard')
    else if (currentUser?.role === 'courier')
      setCurrentScreen('courier-dashboard')
    else setCurrentScreen('home-dashboard')
  }

  // ===== Employee request handlers =====

  const handleCreateEmployeeRequest = (
    companyId: string,
    requestedRole?: UserRole,
  ) => {
    if (!currentUser) return

    const newReq: EmployeeRequest = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      userName: currentUser.name || '',
      userEmail: currentUser.email,
      companyId,
      status: 'pending',
      requestedRole,
    }

    setEmployeeRequests(prev => [...prev, newReq])
  }

  const handleUpdateRequestStatus = (
    id: string,
    status: EmployeeRequest['status'],
  ) => {
    setEmployeeRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, status } : r)),
    )
  }

  const handleApproveRequest = (
    req: EmployeeRequest,
    role: Exclude<UserRole, 'customer'>,
  ) => {
    handleUpdateRequestStatus(req.id, 'approved')

    if (currentUser && currentUser.id === req.userId) {
      const membership: UserCompanyMembership = {
        companyId: req.companyId,
        role,
        joinedAt: new Date().toISOString(),
      }

      setCurrentUser({
        ...currentUser,
        role,
        companies: [...(currentUser.companies || []), membership],
      })
    }

    if (role === 'courier') {
      const newCourier: Courier = {
        id: crypto.randomUUID(),
        name: req.userName || req.userEmail,
        capacity: 40,
        active: true,
        companyId: req.companyId,
        userId: req.userId,
      }
      setCouriers(prev => [...prev, newCourier])
    }
  }

  const handleOptimizeRoutes = (companyId: string) => {
    const companyCouriers = couriers.filter(c => c.companyId === companyId)
    const companyPackages = packages.filter(p => p.companyId === companyId)

    const routesForCompany: RouteOptimization[] = companyCouriers.map(courier => {
      const pkgs = companyPackages.filter(p => p.courierId === courier.id)

      const ordered = [...pkgs].sort((a, b) => {
        if (a.latitude === b.latitude) return a.longitude - b.longitude
        return a.latitude - b.latitude
      })

      const routeCoords: [number, number][] = ordered.map(p => [
        p.latitude,
        p.longitude,
      ])

      const totalDistance = routeCoords.length

      return {
        courierId: courier.id,
        courierName: courier.name,
        packages: ordered,
        totalDistance,
        route: routeCoords,
      }
    })

    setRoutes(routesForCompany)
  }

  const handleSaveCouriersAndNext = async () => {
  // ... validasi seperti sekarang

  try {
    // 1. Hapus semua couriers existing utk company ini
    const snap = await getDocs(
      query(collection(db, 'couriers'), where('companyId', '==', company.id)),
    )
    const batchDeletes = snap.docs.map(d => deleteDoc(doc(db, 'couriers', d.id)))
    await Promise.all(batchDeletes)

    // 2. Tambah ulang semua dari localCouriers
    const newCouriers: Courier[] = []
    for (const c of localCouriers) {
      const { id: _ignore, ...rest } = c
      const ref = await addDoc(collection(db, 'couriers'), {
        ...rest,
        companyId: company.id,
      })
      newCouriers.push({ ...c, id: ref.id })
    }

    setLocalCouriers(newCouriers)
    onSetCouriers(newCouriers)
    toast.success('Data kurir disimpan di server')
    setStep(2)
  } catch (err) {
    console.error('Gagal menyimpan data kurir ke Firestore', err)
    toast.error('Gagal menyimpan data kurir')
  }
}

  // ===== Render screen =====

  const renderScreen = () => {
    console.log('App currentUser in renderScreen:', currentUser)

    if (currentUser && currentScreen === 'admin-dashboard') {
      console.log('App render AdminDashboard, companies length:', companies.length)
      return (
        <AdminDashboard
          user={currentUser}
          companyId={currentUser.companyId!}
          onLogout={handleLogout}
          onBackToHome={() => {
            setHomeRefreshKey(k => k + 1)
            setCurrentScreen('home-dashboard')
          }}
          couriers={couriers}
          packages={packages}
          onSetCouriers={setCouriers}
          onSetPackages={setPackages}
          employeeRequests={employeeRequests}
          onUpdateRequestStatus={handleUpdateRequestStatus}
          onApproveRequest={handleApproveRequest}
          routes={routes}
          onOptimizeRoutes={handleOptimizeRoutes}
          companiesFromFirestore={companies}
        />
      )
    }

    if (currentUser) {
      switch (currentScreen) {
        case 'create-company':
          return (
            <CreateCompanyScreen
              user={currentUser}
              onBack={() => {
                setHomeRefreshKey(k => k + 1)
                setCurrentScreen('home-dashboard')
              }}
              onCompanyCreated={handleCompanyCreated}
            />
          )

        case 'join-company':
          return (
            <JoinCompanyScreen
              user={currentUser}
              onBack={() => {
                setHomeRefreshKey(k => k + 1)
                setCurrentScreen('home-dashboard')
              }}
              onCompanyJoined={handleCompanyJoined}
            />
          )

        case 'company-list':
          return (
            <CompanyListScreen
              user={currentUser}
              onBack={() => {
                setHomeRefreshKey(k => k + 1)
                setCurrentScreen('home-dashboard')
              }}
              onSelectCompany={handleCompanySelected}
            />
          )

        case 'customer-dashboard':
          return (
            <CustomerDashboard user={currentUser} onLogout={handleLogout} />
          )

        case 'track-package':
          return (
            <TrackPackageScreen
              onBack={() => setCurrentScreen('home-dashboard')}
              packages={packages}
            />
          )

        case 'home-dashboard':
        default:
          return (
            <HomeDashboard
              user={currentUser}
              onLogout={handleLogout}
              onNavigate={handleNavigateFromHome}
              refreshKey={homeRefreshKey}
              onUserUpdate={setCurrentUser}
              onCompaniesLoaded={setCompanies}
            />
          )

        case 'courier-dashboard':
  return (
    <CourierDashboard
      user={currentUser}
      onLogout={handleLogout}
      onBackToHome={() => {
        setHomeRefreshKey(k => k + 1)
        setCurrentScreen('home-dashboard')
      }}
      onUpdatePackageStatus={handleUpdatePackageStatus}
      allPackages={packages}
    />
  )
      }
    }

    // BELUM login
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onStart={() => setCurrentScreen('login')} />

      case 'login':
  return (
    <LoginScreen
      onLoginSuccess={user => {
        // user di sini sudah berisi id, email, name, dll dari login
        setCurrentUser(prev => ({
          ...(prev || {}),
          ...user,
          companies: prev?.companies || [], // jaga membership yang mungkin sudah ada
        }))
        setCurrentScreen('home-dashboard')
      }}
      onForgotPassword={() => setCurrentScreen('forgot-password')}
      onRegister={() => setCurrentScreen('register')}
      onTrackPackage={() => setCurrentScreen('track-package')}
    />
  )

      case 'register':
        return (
          <RegisterScreen
            onRegisterSuccess={user => setCurrentUser(user)}
            onLogin={() => setCurrentScreen('login')}
          />
        )

      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onBack={() => setCurrentScreen('login')}
            onRegister={() => setCurrentScreen('register')}
          />
        )

      case 'role-selection':
        return (
          <RoleSelectionScreen
            user={currentUser!}
            onRoleSelected={role =>
              setCurrentUser(prev => (prev ? { ...prev, role } : null))
            }
            onSignOut={handleLogout}
          />
        )

      case 'company-selection':
        return (
          <CompanySelectionScreen
            user={currentUser!}
            onCompanySet={companyId =>
              setCurrentUser(prev =>
                prev ? { ...prev, companyId } : null,
              )
            }
          />
        )


      default:
        return null
    }
  }

  const handleUpdatePackageStatus = (
  packageId: string,
  newStatus: Package['status'],
) => {
  const now = new Date().toISOString()

  setPackages(prev =>
    prev.map(p =>
      p.id === packageId
        ? {
            ...p,
            status: newStatus,
            updatedAt: now,
            deliveredAt:
              newStatus === 'delivered' ? now : p.deliveredAt,
          }
        : p,
    ),
  )
}

  return (
    <>
      {renderScreen()}
      <Toaster position="top-right" />
    </>
  )
}

export default App