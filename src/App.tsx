import { useState, useEffect, useRef } from 'react'
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

type AppScreen = 
  | 'splash'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'role-selection'
  | 'company-selection'
  | 'home-dashboard'
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
  const [companies, setCompanies] = useKV<Company[]>('companies', [])
  const [homeRefreshKey, setHomeRefreshKey] = useState(0)
  const navigationLockRef = useRef(false)

  useEffect(() => {
    if (!currentUser || !users) return
    
    if (currentScreen === 'login' || currentScreen === 'splash' || currentScreen === 'register' || 
        currentScreen === 'admin-dashboard' || currentScreen === 'courier-dashboard' ||
        currentScreen === 'customer-dashboard') {
      return
    }
    
    const updatedUser = users.find(u => u.id === currentUser.id)
    if (updatedUser && JSON.stringify(updatedUser.companies) !== JSON.stringify(currentUser.companies)) {
      setCurrentUser(updatedUser)
    }
  }, [users, currentUser?.id, currentScreen])

  useEffect(() => {
    if (currentScreen === 'login' || currentScreen === 'splash' || currentScreen === 'register' || currentScreen === 'create-company') {
      return
    }

    const existingCompanyIds = (companies || []).map(c => c.id)
    
    if (existingCompanyIds.length === 0) {
      return
    }
    
    if (users && users.length > 0 && currentUser) {
      const needsCleanup = users.some(u => 
        u.companies && u.companies.some(m => !existingCompanyIds.includes(m.companyId))
      )

      if (needsCleanup) {
        setUsers((prevUsers) => 
          (prevUsers || []).map(u => ({
            ...u,
            companies: (u.companies || []).filter(m => existingCompanyIds.includes(m.companyId)),
            companyId: u.companyId && !existingCompanyIds.includes(u.companyId) ? undefined : u.companyId,
            role: u.companyId && !existingCompanyIds.includes(u.companyId) ? undefined : u.role
          }))
        )
      }
    }

    if (currentUser && currentUser.companies && currentUser.companies.length > 0) {
      const hasInvalidCompanies = currentUser.companies.some(
        m => !existingCompanyIds.includes(m.companyId)
      )

      if (hasInvalidCompanies) {
        setCurrentUser((prev) => {
          if (!prev) return null
          return {
            ...prev,
            companies: prev.companies?.filter(m => existingCompanyIds.includes(m.companyId)) || []
          }
        })
      }
    }
  }, [companies, currentScreen, currentUser])

  useEffect(() => {
    console.log('App useEffect triggered', { 
      currentScreen, 
      currentUser: currentUser?.email, 
      companyId: currentUser?.companyId, 
      role: currentUser?.role,
      navigationLocked: navigationLockRef.current
    })
    
    if (navigationLockRef.current) {
      console.log('Navigation is locked, skipping auto-redirect')
      return
    }
    
    if (currentScreen === 'create-company' || 
        currentScreen === 'join-company' || 
        currentScreen === 'admin-dashboard' || 
        currentScreen === 'courier-dashboard' || 
        currentScreen === 'customer-dashboard' || 
        currentScreen === 'track-package' || 
        currentScreen === 'company-list' ||
        currentScreen === 'forgot-password') {
      console.log('Skipping useEffect - already on target screen:', currentScreen)
      return
    }

    if (currentUser) {
      if (currentScreen === 'login' || currentScreen === 'register' || currentScreen === 'splash') {
        console.log('User logged in, redirecting to home-dashboard')
        setCurrentScreen('home-dashboard')
        return
      }
    }
  }, [currentScreen, currentUser?.email])

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentScreen('splash')
  }

  const handleNavigateFromHome = async (screen: 'home' | 'companies' | 'track-package' | 'create-company' | 'join-company' | 'customer-mode' | 'admin-dashboard' | 'courier-dashboard') => {
    console.log('=== handleNavigateFromHome called ===')
    console.log('Target screen:', screen)
    console.log('Current screen:', currentScreen)
    
    if (screen === 'admin-dashboard' || screen === 'courier-dashboard') {
      console.log(`Direct navigation to ${screen}`)
      navigationLockRef.current = true
      
      const freshUser = await window.spark.kv.get<User | null>('current-user')
      if (freshUser) {
        console.log('Loaded fresh user from KV before navigation:', freshUser.email, 'companyId:', freshUser.companyId, 'role:', freshUser.role)
        
        if (!freshUser.companyId || !freshUser.role) {
          console.error('User does not have companyId or role, cannot navigate to dashboard')
          navigationLockRef.current = false
          return
        }
        
        setCurrentUser(freshUser)
        
        await new Promise(resolve => setTimeout(resolve, 200))
        
        setCurrentScreen(screen)
        
        setTimeout(() => {
          navigationLockRef.current = false
        }, 3000)
      } else {
        console.error('No user found in KV')
        navigationLockRef.current = false
      }
      return
    }
    
    if (screen === 'home') {
      setHomeRefreshKey(prev => prev + 1)
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
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const freshUser = await window.spark.kv.get<User | null>('current-user')
    const freshUsers = await window.spark.kv.get<User[]>('users')
    const freshCompanies = await window.spark.kv.get<Company[]>('companies')
    
    console.log('Fresh data loaded:')
    console.log('- User companies:', freshUser?.companies)
    console.log('- Total companies:', freshCompanies?.length)
    
    if (!freshUser) {
      toast.error('Sesi pengguna tidak ditemukan')
      return
    }
    
    setCurrentUser(freshUser)
    
    if (freshUsers) {
      setUsers(freshUsers)
    }
    
    if (freshCompanies) {
      setCompanies(freshCompanies)
    }
    
    console.log('Updating homeRefreshKey to trigger reload and show new company in sidebar')
    setHomeRefreshKey(prev => prev + 1)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log('Navigating back to home-dashboard to show new company')
    setCurrentScreen('home-dashboard')
  }

  const handleCompanyJoined = (companyId: string, role: UserRole) => {
    setCurrentUser((prev) => {
      if (!prev) return null
      const updatedUser = { ...prev, companyId, role }
      return updatedUser
    })
    setHomeRefreshKey(prev => prev + 1)
    setTimeout(() => {
      if (role === 'admin') {
        setCurrentScreen('admin-dashboard')
      } else if (role === 'courier') {
        setCurrentScreen('courier-dashboard')
      } else {
        setCurrentScreen('home-dashboard')
      }
    }, 100)
  }

  const handleCompanySelected = (companyId: string) => {
    setCurrentUser((prev) => prev ? { ...prev, companyId } : null)
    if (currentUser?.role === 'admin') {
      setCurrentScreen('admin-dashboard')
    } else if (currentUser?.role === 'courier') {
      setCurrentScreen('courier-dashboard')
    } else {
      setCurrentScreen('home-dashboard')
    }
  }

  const renderScreen = () => {
    console.log('=== renderScreen called ===')
    console.log('Current screen:', currentScreen)
    console.log('Current user:', currentUser?.email)
    console.log('User companyId:', currentUser?.companyId)
    console.log('User role:', currentUser?.role)
    
    switch (currentScreen) {
      case 'splash':
        return (
          <SplashScreen
            onStart={() => setCurrentScreen('login')}
          />
        )
      case 'login':
        return (
          <LoginScreen
            onLoginSuccess={(user) => {
              setCurrentUser(user)
            }}
            onForgotPassword={() => setCurrentScreen('forgot-password')}
            onRegister={() => setCurrentScreen('register')}
            onTrackPackage={() => setCurrentScreen('track-package')}
          />
        )
      case 'register':
        return (
          <RegisterScreen
            onRegisterSuccess={(user) => {
              setCurrentUser(user)
            }}
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
            onRoleSelected={(role) => {
              setCurrentUser((prev) => prev ? { ...prev, role } : null)
            }}
            onSignOut={handleLogout}
          />
        )
      case 'company-selection':
        return (
          <CompanySelectionScreen
            user={currentUser!}
            onCompanySet={(companyId) => {
              setCurrentUser((prev) => prev ? { ...prev, companyId } : null)
            }}
          />
        )
      case 'home-dashboard':
        return (
          <HomeDashboard
            user={currentUser!}
            onLogout={handleLogout}
            onNavigate={handleNavigateFromHome}
            refreshKey={homeRefreshKey}
          />
        )
      case 'create-company':
        return (
          <CreateCompanyScreen
            user={currentUser!}
            onBack={() => {
              console.log('=== Going back from create-company to home ===')
              setHomeRefreshKey(prev => {
                const newKey = prev + 1
                console.log('Setting homeRefreshKey to:', newKey)
                return newKey
              })
              setTimeout(() => {
                setCurrentScreen('home-dashboard')
              }, 100)
            }}
            onCompanyCreated={handleCompanyCreated}
          />
        )
      case 'join-company':
        return (
          <JoinCompanyScreen
            user={currentUser!}
            onBack={() => {
              setHomeRefreshKey(prev => prev + 1)
              setCurrentScreen('home-dashboard')
            }}
            onCompanyJoined={handleCompanyJoined}
          />
        )
      case 'company-list':
        return (
          <CompanyListScreen
            user={currentUser!}
            onBack={() => {
              setHomeRefreshKey(prev => prev + 1)
              setCurrentScreen('home-dashboard')
            }}
            onSelectCompany={handleCompanySelected}
          />
        )
      case 'admin-dashboard':
        return (
          <AdminDashboard
            user={currentUser!}
            onLogout={handleLogout}
            onBackToHome={() => {
              setHomeRefreshKey(prev => prev + 1)
              setCurrentScreen('home-dashboard')
            }}
          />
        )
      case 'courier-dashboard':
        return (
          <CourierDashboard
            user={currentUser!}
            onLogout={handleLogout}
            onBackToHome={() => {
              setHomeRefreshKey(prev => prev + 1)
              setCurrentScreen('home-dashboard')
            }}
          />
        )
      case 'customer-dashboard':
        return (
          <CustomerDashboard
            user={currentUser!}
            onLogout={handleLogout}
          />
        )
      case 'track-package':
        return (
          <TrackPackageScreen
            onBack={() => setCurrentScreen(currentUser ? 'home-dashboard' : 'login')}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      {currentScreen && renderScreen()}
      <Toaster position="top-right" />
    </>
  )
}

export default App