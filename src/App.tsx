import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { User, UserRole } from './lib/types'
import SplashScreen from './components/auth/SplashScreen'
import LoginScreen from './components/auth/LoginScreen'
import RegisterScreen from './components/auth/RegisterScreen'
import ForgotPasswordScreen from './components/auth/ForgotPasswordScreen'
import RoleSelectionScreen from './components/auth/RoleSelectionScreen'
import CompanySelectionScreen from './components/company/CompanySelectionScreen'
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
  | 'admin-dashboard'
  | 'courier-dashboard'
  | 'customer-dashboard'
  | 'track-package'

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash')
  const [currentUser, setCurrentUser] = useKV<User | null>('current-user', null)
  const [users] = useKV<User[]>('users', [])

  useEffect(() => {
    if (currentUser) {
      if (!currentUser.role) {
        setCurrentScreen('role-selection')
      } else if (currentUser.role === 'customer') {
        setCurrentScreen('customer-dashboard')
      } else if (!currentUser.companyId) {
        setCurrentScreen('company-selection')
      } else {
        if (currentUser.role === 'admin') {
          setCurrentScreen('admin-dashboard')
        } else if (currentUser.role === 'courier') {
          setCurrentScreen('courier-dashboard')
        }
      }
    }
  }, [currentUser])

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentScreen('splash')
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
      case 'admin-dashboard':
        return (
          <AdminDashboard
            user={currentUser!}
            onLogout={handleLogout}
          />
        )
      case 'courier-dashboard':
        return (
          <CourierDashboard
            user={currentUser!}
            onLogout={handleLogout}
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