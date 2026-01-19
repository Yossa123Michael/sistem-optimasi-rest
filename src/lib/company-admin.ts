import { db } from '@/lib/firebase'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
  limit,
} from 'firebase/firestore'

export async function leaveCompany(userId: string, companyId: string) {
  // 1) ambil user doc
  const userRef = doc(db, 'users', userId)

  const snap = await (await import('firebase/firestore')).getDoc(userRef)
  if (!snap.exists()) throw new Error('User tidak ditemukan')

  const data = snap.data() as any
  const companies: any[] = Array.isArray(data.companies) ? data.companies : []
  const nextCompanies = companies.filter(m => m?.companyId !== companyId)

  const patch: any = { companies: nextCompanies }

  // jika user sedang berada di company yang ditinggalkan -> reset
  if (data.companyId === companyId) {
    patch.companyId = ''
    patch.role = 'customer'
  }

  await updateDoc(userRef, patch)
}

export async function deleteCompanyCascade(companyId: string) {
  // soft delete company
  await updateDoc(doc(db, 'companies', companyId), {
    archived: true,
    updatedAt: new Date().toISOString(),
  })

  // 2) keluarkan semua user dari perusahaan ini
  const usersSnap = await getDocs(
    query(collection(db, 'users'), where('companyId', '==', companyId)),
  )

  const batch = writeBatch(db)

  usersSnap.docs.forEach(u => {
    batch.update(doc(db, 'users', u.id), { companyId: '', role: 'customer' })
  })

  // 3) hapus data operasional perusahaan
  // couriers
  const courSnap = await getDocs(query(collection(db, 'couriers'), where('companyId', '==', companyId)))
  courSnap.docs.forEach(d => batch.delete(doc(db, 'couriers', d.id)))

  // packages
  const pkgSnap = await getDocs(query(collection(db, 'packages'), where('companyId', '==', companyId)))
  pkgSnap.docs.forEach(d => batch.delete(doc(db, 'packages', d.id)))

  // orders
  const ordSnap = await getDocs(query(collection(db, 'orders'), where('companyId', '==', companyId)))
  ordSnap.docs.forEach(d => batch.delete(doc(db, 'orders', d.id)))

  // employeeRequests
  const reqSnap = await getDocs(query(collection(db, 'employeeRequests'), where('companyId', '==', companyId)))
  reqSnap.docs.forEach(d => batch.delete(doc(db, 'employeeRequests', d.id)))

  // routeOptimizations doc id = companyId
  batch.delete(doc(db, 'routeOptimizations', companyId))

  await batch.commit()

  // publicTracking: docId trackingNumber -> harus query by companyId
  const trackSnap = await getDocs(
    query(collection(db, 'publicTracking'), where('companyId', '==', companyId), limit(500)),
  )
  for (const t of trackSnap.docs) {
    await deleteDoc(doc(db, 'publicTracking', t.id))
  }
}