import { db } from '@/lib/firebase'
import { User, UserRole } from '@/lib/types'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export type Membership = {
  companyId: string
  role: UserRole
  joinedAt: string
}

export function hasMembership(user: User, companyId: string) {
  return (user.companies || []).some(m => m.companyId === companyId)
}

export function upsertMembership(user: User, membership: Membership): User {
  const companies = user.companies || []
  const idx = companies.findIndex(m => m.companyId === membership.companyId)

  const nextCompanies =
    idx >= 0
      ? companies.map((m, i) => (i === idx ? membership : m))
      : [...companies, membership]

  return { ...user, companies: nextCompanies }
}

/**
 * Add or update a company membership in Firestore under users/{userId}.
 * Also sets active companyId/role if user does not have an active company yet
 * OR if you want approval to immediately switch them into the approved company.
 */
export async function addMembershipToUserFirestore(
  userId: string,
  membership: Membership,
  opts?: { setActiveCompany?: boolean },
) {
  const setActiveCompany = opts?.setActiveCompany ?? true

  const userRef = doc(db, 'users', userId)
  const snap = await getDoc(userRef)
  const data = (snap.exists() ? (snap.data() as any) : {}) as Partial<User>

  const current: User = {
    id: userId,
    email: (data as any).email || '',
    password: '',
    name: (data as any).name,
    role: (data as any).role,
    companyId: (data as any).companyId,
    companies: (data as any).companies || [],
  }

  const next = upsertMembership(current, membership)

  const patch: Partial<User> & { companies: Membership[] } = {
    companies: next.companies || [],
  }

  if (setActiveCompany) {
    patch.companyId = membership.companyId
    patch.role = membership.role
  } else {
    // kalau tidak set aktif, hanya set aktif bila belum ada
    if (!current.companyId) patch.companyId = membership.companyId
    if (!current.role) patch.role = membership.role
  }

  await setDoc(userRef, patch, { merge: true })
}