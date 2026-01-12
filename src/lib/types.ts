export type UserRole = 'admin' | 'courier' | 'customer'

export interface UserCompanyMembership {
  companyId: string
  role: UserRole
  joinedAt: string
}

export interface User {
  id: string
  email: string
  password: string
  role?: UserRole
  companyId?: string
  name?: string
  companies?: UserCompanyMembership[]
}

export interface Company {
  id: string
  name: string
  code: string
  ownerId: string
  createdAt: string

  // NEW: lokasi kantor dipilih oleh owner
  officeLocation?: { lat: number; lng: number }
}

export interface Package {
  id: string
  name: string
  recipientName: string
  recipientPhone: string
  latitude: number
  longitude: number
  weight: number
  trackingNumber: string
  companyId: string
  courierId?: string
  status: 'pending' | 'in-transit' | 'delivered' | 'failed'
  createdAt: string
  updatedAt: string
  deliveredAt?: string
  locationDetail: string
}

export interface Courier {
  id: string
  name: string
  capacity: number
  active: boolean
  companyId: string
  userId: string
}

export interface RouteOptimization {
  courierId: string
  courierName: string
  packages: Package[]
  totalDistance: number
  route: [number, number][]
}

export interface EmployeeRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  companyId: string
  status: 'pending' | 'approved' | 'rejected'
  requestedRole?: UserRole
}

export interface PackageHistory {
  id: string
  packageId: string
  packageName: string
  courierName: string
  status: 'delivered' | 'failed'
  timestamp: string
}

export interface TrackingStatus {
  status: string
  timestamp: string
  location?: string
}