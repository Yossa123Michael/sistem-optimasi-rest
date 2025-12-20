import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { User, UserRole, Company } from './lib/types'
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
import { toast } from 'sonner'

import { auth } from './lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'

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
  const [currentUser, setCurrentUser] = useKV<User | null>('current-user', null)
  const [users, setUsers] = useKV<User[]>('users', [])
  const [companies] = useKV<Company[]>('companies', [])
  const [homeRefreshKey, setHomeRefreshKey] = useState(0)

  // 1. Dengarkan Firebase Auth hanya untuk kasus reload otomatis
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, fbUser => {
      if (!fbUser) {
        setCurrentUser(null)
        return
      }

      const userFromAuth: User = {
        id: fbUser.uid,
        email: fbUser.email || '',
        password: '',
        name:
          fbUser.displayName ||
          (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
      }

      setCurrentUser(userFromAuth)

      setCurrentScreen(prev =>
        prev === 'splash' || prev === 'login' ? 'home-dashboard' : prev,
      )
    })

    return () => unsubscribe()
  }, [setCurrentUser])

  // 2. Sinkronisasi membership user (tidak mengubah layar utama)
  useEffect(() => {
    if (!currentUser) return
    if (
      currentScreen === 'admin-dashboard' ||
      currentScreen === 'courier-dashboard'
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
  }, [users, currentUser?.id, currentScreen, setCurrentUser])

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
  }, [companies, users, currentUser, setUsers, setCurrentUser])

  // 4. Sign Out: Firebase + bersihkan KV + ke LOGIN (bukan splash)
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
    if (screen === 'admin-dashboard' || screen === 'courier-dashboard') {
      const freshUser = await window.spark.kv.get<User | null>('current-user')

      if (!freshUser || !freshUser.companyId || !freshUser.role) {
        toast.error('Data perusahaan tidak lengkap')
        return
      }

      setCurrentUser(freshUser)
      setCurrentScreen(screen)
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

  const handleCompanyCreated = async (_companyId: string) => {
    const freshUser = await window.spark.kv.get<User | null>('current-user')
    const freshUsers = await window.spark.kv.get<User[]>('users')

    if (freshUser) setCurrentUser(freshUser)
    if (freshUsers) setUsers(freshUsers)

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

  const renderScreen = () => {
    if (currentUser && currentScreen === 'admin-dashboard') {
      return (
        <AdminDashboard
          user={currentUser}
          onLogout={handleLogout}
          onBackToHome={() => {
            setHomeRefreshKey(k => k + 1)
            setCurrentScreen('home-dashboard')
          }}
        />
      )
    }

    if (currentUser && currentScreen === 'courier-dashboard') {
      return (
        <CourierDashboard
          user={currentUser}
          onLogout={handleLogout}
          onBackToHome={() => {
            setHomeRefreshKey(k => k + 1)
            setCurrentScreen('home-dashboard')
          }}
        />
      )
    }

    if (currentUser) {
      // Handle screen lainnya yang butuh login
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

        default:
          // Default: tampilkan HomeDashboard
          return (
            <HomeDashboard
              user={currentUser}
              onLogout={handleLogout}
              onNavigate={handleNavigateFromHome}
              refreshKey={homeRefreshKey}
            />
          )
      }
    }

    // BELUM login: pilih berdasarkan currentScreen
    switch (currentScreen) {
      case 'splash':
        // Splash permanen; klik Start → login
        return <SplashScreen onStart={() => setCurrentScreen('login')} />

      case 'login':
        return (
          <LoginScreen
            onLoginSuccess={user => {
              setCurrentUser(user)
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

      case 'track-package':
        return (
          <TrackPackageScreen
            onBack={() => setCurrentScreen('login')}
          />
        )

      default:
        return null
    }
  }

  return (
    <>
      {renderScreen()}
      <Toaster position="top-right" />
    </>
  )
}

export default App