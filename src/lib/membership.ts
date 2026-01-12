import { db } from '@/lib/firebase'
import { UserCompanyMembership } from '@/lib/types'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

export async function addMembershipToUserFirestore(
  userId: string,
  membership: UserCompanyMembership,
) {
  const userRef = doc(db, 'users', userId)
  const snap = await getDoc(userRef)

  if (!snap.exists()) {
    await setDoc(
      userRef,
      {
        id: userId,
        companies: [membership],
      },
      { merge: true },
    )
    return
  }

  const data = snap.data() as any
  const companies = (data.companies || []) as UserCompanyMembership[]

  const already = companies.some(
    m => m.companyId === membership.companyId && m.role === membership.role,
  )
  if (already) return

  await updateDoc(userRef, {
    companies: [...companies, membership],
  })
}