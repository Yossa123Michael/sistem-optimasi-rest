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

  // lokasi kantor dipilih oleh owner/admin
  officeLocation?: { lat: number; lng: number }

  archived?: boolean

  // NEW: buka/tutup untuk tampil di pencarian order customer
  isOpen?: boolean

    bankName?: string
  bankAccountName?: string
  bankAccountNumber?: string
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

export type OrderStatus =
  | 'created' // waiting approval
  | 'assigned' // approved
  | 'failed' // rejected
  | 'paid' // legacy (jika masih dipakai)
  | 'in-transit'
  | 'delivered'

// NEW: pembayaran
export type PaymentMethod = 'cod' | 'transfer'
export type PaymentStatus = 'unpaid' | 'cod' | 'pending_verification' | 'paid' | 'rejected'

export interface Order {
  id: string
  customerId: string
  customerName?: string
  customerEmail?: string

  companyId: string
  companyName?: string

  packageName: string
  recipientName: string
  recipientPhone: string
  recipientEmail?: string

  destinationDetail: string
  latitude: number
  longitude: number
  weight: number

  status: OrderStatus
  trackingNumber?: string

  createdAt: string
  updatedAt: string

  // NEW: snapshot harga (dari CustomerOrderView)
  distanceKm?: number
  ratePerKm?: number
  estimatedCost?: number

  // NEW: payment
  paymentMethod?: PaymentMethod | null
  paymentStatus?: PaymentStatus
  paymentProofUrl?: string | null
  paymentNotes?: string | null
  paymentCreatedAt?: string
  paymentVerifiedAt?: string
  paymentVerifiedBy?: string
}

// NEW: companyMembers (dipakai untuk list karyawan)
export interface CompanyMember {
  id: string
  companyId: string
  userId: string
  role: Exclude<UserRole, 'customer'>
  active: boolean
  joinedAt: string
  updatedAt?: string
  leftAt?: string | null
}