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
  const [companies] = useKV<Company[]>('companies', [])

  useEffect(() => {
    if (currentUser && users) {
      const updatedUser = users.find(u => u.id === currentUser.id)
      if (updatedUser && JSON.stringify(updatedUser.companies) !== JSON.stringify(currentUser.companies)) {
        setCurrentUser(updatedUser)
      }
    }
  }, [users, currentUser?.id])

  useEffect(() => {
    const existingCompanyIds = (companies || []).map(c => c.id)
    
    if (users && users.length > 0) {
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
  }, [companies])

  useEffect(() => {
    if (currentScreen === 'create-company' || currentScreen === 'join-company' || currentScreen === 'admin-dashboard' || currentScreen === 'courier-dashboard' || currentScreen === 'customer-dashboard') {
      return
    }

    if (currentUser) {
      if (currentScreen === 'login' || currentScreen === 'register') {
        setCurrentScreen('home-dashboard')
        return
      }

      if (currentUser.companyId) {
        const companyStillExists = (companies || []).some(c => c.id === currentUser.companyId)
        
        if (!companyStillExists) {
          setCurrentUser((prev) => {
            if (!prev) return null
            return { ...prev, companyId: undefined, role: undefined }
          })
          setCurrentScreen('home-dashboard')
          return
        }
      }

      if (currentScreen === 'home-dashboard') {
        if (currentUser.companyId && currentUser.role) {
          if (currentUser.role === 'admin') {
            setCurrentScreen('admin-dashboard')
          } else if (currentUser.role === 'courier') {
            setCurrentScreen('courier-dashboard')
          }
        }
      }
    }
  }, [currentUser, companies, currentScreen])

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentScreen('splash')
  }

  const handleNavigateFromHome = (screen: 'home' | 'companies' | 'track-package' | 'create-company' | 'join-company' | 'customer-mode' | 'admin-dashboard' | 'courier-dashboard') => {
    if (screen === 'home') {
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
      setCurrentScreen('admin-dashboard')
    } else if (screen === 'courier-dashboard') {
      setCurrentScreen('courier-dashboard')
    }
  }

  const handleCompanyCreated = (companyId: string) => {
    setCurrentUser((prev) => {
      if (!prev) return null
      return { ...prev, companyId, role: 'admin' as UserRole }
    })
    setTimeout(() => {
      setCurrentScreen('admin-dashboard')
    }, 300)
  }

  const handleCompanyJoined = (companyId: string, role: UserRole) => {
    setCurrentUser((prev) => {
      if (!prev) return null
      const updatedUser = { ...prev, companyId, role }
      return updatedUser
    })
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
          />
        )
      case 'create-company':
        return (
          <CreateCompanyScreen
            user={currentUser!}
            onBack={() => setCurrentScreen('home-dashboard')}
            onCompanyCreated={handleCompanyCreated}
          />
        )
      case 'join-company':
        return (
          <JoinCompanyScreen
            user={currentUser!}
            onBack={() => setCurrentScreen('home-dashboard')}
            onCompanyJoined={handleCompanyJoined}
          />
        )
      case 'company-list':
        return (
          <CompanyListScreen
            user={currentUser!}
            onBack={() => setCurrentScreen('home-dashboard')}
            onSelectCompany={handleCompanySelected}
          />
        )
      case 'admin-dashboard':
        return (
          <AdminDashboard
            user={currentUser!}
            onLogout={handleLogout}
            onBackToHome={() => setCurrentScreen('home-dashboard')}
          />
        )
      case 'courier-dashboard':
        return (
          <CourierDashboard
            user={currentUser!}
            onLogout={handleLogout}
            onBackToHome={() => setCurrentScreen('home-dashboard')}
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