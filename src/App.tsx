import { useEffect, useState } from 'react'
import { User } from './lib/types'

import SplashScreen from './components/auth/SplashScreen'
import LoginScreen from './components/auth/LoginScreen'
import RegisterScreen from './components/auth/RegisterScreen'
import ForgotPasswordScreen from './components/auth/ForgotPasswordScreen'

import HomeDashboard from './components/HomeDashboard'
import AdminDashboard from './components/admin/AdminDashboard'
import CourierDashboard from './components/courier/CourierDashboard'
import CustomerDashboard from './components/customer/CustomerDashboard'
import TrackPackageScreen from './components/tracking/TrackPackageScreen'

import CreateCompanyScreen from './components/company/CreateCompanyScreen'
import JoinCompanyScreen from './components/company/JoinCompanyScreen'
import CompanyListScreen from './components/company/CompanyListScreen'

import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner'

import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

type AppScreen =
  | 'splash'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'home-dashboard'
  | 'create-company'
  | 'join-company'
  | 'company-list'
  | 'admin-dashboard'
  | 'courier-dashboard'
  | 'customer-dashboard'
  | 'track-package'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [homeRefreshKey, setHomeRefreshKey] = useState(0)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fbUser => {
      console.log('auth state:', fbUser?.uid, fbUser?.email)
      try {
        if (!fbUser) {
          setCurrentUser(null)
          setCurrentScreen('login')
          return
        }

        const userRef = doc(db, 'users', fbUser.uid)
        const snap = await getDoc(userRef)

        if (snap.exists()) {
          const data = snap.data() as any
          const loadedUser: User = {
            id: fbUser.uid,
            email: fbUser.email || '',
            password: '',
            name:
              data.name ||
              fbUser.displayName ||
              fbUser.email?.split('@')[0] ||
              'User',
            role: data.role,
            companyId: data.companyId,
            companies: data.companies || [],
          }
          setCurrentUser(loadedUser)
        } else {
          const newUser: User = {
            id: fbUser.uid,
            email: fbUser.email || '',
            password: '',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            companies: [],
          }
          await setDoc(userRef, newUser, { merge: true })
          setCurrentUser(newUser)
        }

        setCurrentScreen('home-dashboard')
      } catch (e) {
        console.error('Failed to load user from Firestore', e)
        toast.error('Gagal memuat data user')
        setCurrentScreen('login')
      } finally {
        setLoadingAuth(false)
      }
    })

    return () => unsub()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    setCurrentUser(null)
    setCurrentScreen('login')
  }

  const handleNavigateFromHome = (
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
    } else if (screen === 'admin-dashboard') {
      setCurrentScreen('admin-dashboard')
    } else if (screen === 'courier-dashboard') {
      setCurrentScreen('courier-dashboard')
    }
  }

  if (loadingAuth) {
    return (
      <>
        <SplashScreen onStart={() => {}} />
        <Toaster position="top-right" />
      </>
    )
  }

  const renderScreen = () => {
    if (!currentUser) {
      switch (currentScreen) {
        case 'splash':
          return <SplashScreen onStart={() => setCurrentScreen('login')} />
        case 'login':
          return (
            <LoginScreen
              onLoginSuccess={() => setCurrentScreen('home-dashboard')}
              onForgotPassword={() => setCurrentScreen('forgot-password')}
              onRegister={() => setCurrentScreen('register')}
              onTrackPackage={() => setCurrentScreen('track-package')}
            />
          )
        case 'register':
          return (
            <RegisterScreen
              onRegisterSuccess={() => setCurrentScreen('home-dashboard')}
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
        default:
          return null
      }
    }

    switch (currentScreen) {
      case 'create-company':
        return (
          <CreateCompanyScreen
            user={currentUser}
            onBack={() => {
              setHomeRefreshKey(k => k + 1)
              setCurrentScreen('home-dashboard')
            }}
            onCompanyCreated={() => {
              setHomeRefreshKey(k => k + 1)
              setCurrentScreen('home-dashboard')
            }}
          />
        )

      case 'join-company':
        return (
          <JoinCompanyScreen
            user={currentUser}
            onBack={() => setCurrentScreen('home-dashboard')}
            onRequestSent={() => {
              setHomeRefreshKey(k => k + 1)
              setCurrentScreen('home-dashboard')
            }}
          />
        )

      case 'company-list':
        return (
          <CompanyListScreen
            user={currentUser}
            onBack={() => setCurrentScreen('home-dashboard')}
            onSelectCompany={() => {
              setHomeRefreshKey(k => k + 1)
              setCurrentScreen('home-dashboard')
            }}
          />
        )

      case 'admin-dashboard':
        return (
          <AdminDashboard
            user={currentUser}
            onLogout={handleLogout}
            onBackToHome={() => setCurrentScreen('home-dashboard')}
          />
        )

      case 'courier-dashboard':
        return (
          <CourierDashboard
            user={currentUser}
            onLogout={handleLogout}
            onBackToHome={() => setCurrentScreen('home-dashboard')}
            onUpdatePackageStatus={() => {}}
            allPackages={[]}
          />
        )

      case 'customer-dashboard':
        return <CustomerDashboard user={currentUser} onLogout={handleLogout} />

      case 'track-package':
        return <TrackPackageScreen onBack={() => setCurrentScreen('home-dashboard')} />

      case 'home-dashboard':
      default:
        return (
          <HomeDashboard
            user={currentUser}
            onLogout={handleLogout}
            onUserUpdate={setCurrentUser}
            onNavigate={handleNavigateFromHome}
            refreshKey={homeRefreshKey}
          />
        )
    }
  }

  return (
    <>
      {renderScreen()}
      <Toaster position="top-right" />
    </>
  )
}