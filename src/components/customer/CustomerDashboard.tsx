import { User } from '@/lib/types'

interface CustomerDashboardProps {
  user: User
  onLogout: () => void
  onBackToHome?: () => void
}

export default function CustomerDashboard({
  user,
  onLogout,
  onBackToHome,
}: CustomerDashboardProps) {
  const renderView = () => {
    return (
      <div className="p-4">
        <p>Customer dashboard untuk {user.name || user.email}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar khusus customer bisa dibuat nanti */}
      <main className="flex-1 lg:ml-48">{renderView()}</main>
    </div>
  )
}