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

  useEffect(() => {
    if (currentUser && users && currentScreen !== 'login' && currentScreen !== 'splash' && currentScreen !== 'register') {
      const updatedUser = users.find(u => u.id === currentUser.id)
      if (updatedUser && JSON.stringify(updatedUser.companies) !== JSON.stringify(currentUser.companies)) {
        setCurrentUser(updatedUser)
      }
    }
  }, [users, currentUser?.id, currentScreen])

  useEffect(() => {
    if (currentScreen === 'login' || currentScreen === 'splash' || currentScreen === 'register') {
      return
    }

    const existingCompanyIds = (companies || []).map(c => c.id)
    
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
    console.log('App useEffect triggered', { currentScreen, currentUser: currentUser?.email, companyId: currentUser?.companyId, role: currentUser?.role })
    
    if (currentScreen === 'create-company' || currentScreen === 'join-company' || currentScreen === 'admin-dashboard' || currentScreen === 'courier-dashboard' || currentScreen === 'customer-dashboard' || currentScreen === 'track-package' || currentScreen === 'company-list') {
      return
    }

    if (currentUser) {
      if (currentScreen === 'login' || currentScreen === 'register') {
        setCurrentScreen('home-dashboard')
        return
      }
    }
  }, [companies, currentScreen])

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentScreen('splash')
  }

  const handleNavigateFromHome = (screen: 'home' | 'companies' | 'track-package' | 'create-company' | 'join-company' | 'customer-mode' | 'admin-dashboard' | 'courier-dashboard') => {
    console.log('handleNavigateFromHome called:', screen)
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
    } else if (screen === 'admin-dashboard') {
      console.log('Navigating to admin-dashboard')
      setCurrentScreen('admin-dashboard')
    } else if (screen === 'courier-dashboard') {
      console.log('Navigating to courier-dashboard')
      setCurrentScreen('courier-dashboard')
    }
  }

  const handleCompanyCreated = async (companyId: string) => {
    console.log('=== handleCompanyCreated called with companyId:', companyId)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    setCurrentUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, companyId, role: 'admin' as UserRole }
      console.log('Setting current user in handleCompanyCreated:', updated)
      return updated
    })
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    setUsers((prevUsers) => 
      (prevUsers || []).map((u) => {
        if (u.id === currentUser?.id) {
          const updated = { ...u, companyId, role: 'admin' as UserRole }
          console.log('Setting user in users array:', updated)
          return updated
        }
        return u
      })
    )
    
    console.log('Updating homeRefreshKey to trigger reload')
    setHomeRefreshKey(prev => {
      const newKey = prev + 1
      console.log('homeRefreshKey updated to:', newKey)
      return newKey
    })
    
    await new Promise(resolve => setTimeout(resolve, 200))
    
    console.log('Navigating to admin-dashboard')
    setCurrentScreen('admin-dashboard')
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
      {renderScreen()}
      <Toaster position="top-right" />
    </>
  )
}

export default App