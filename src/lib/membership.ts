import { User, UserRole } from '@/lib/types'

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