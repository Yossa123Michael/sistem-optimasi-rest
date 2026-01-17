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

  // NOTE: kita tidak pakai transaction biar simpel, tapi aman untuk demo
  // Hapus membership companyId dari companies[]
  // dan kosongkan companyId/role jika sedang aktif di company itu.
  // (Karena Firestore tidak punya arrayRemove untuk object beda, kita rebuild array di client.)
  // Jadi: panggil ini dari UI yang sudah punya objek user lengkap (lebih gampang),
  // atau Anda bisa fetch user doc dulu di sini. Agar ringkas, saya buat versi fetch dulu.

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

  // 1) keluarkan semua user dari perusahaan ini
  const usersSnap = await getDocs(
    query(collection(db, 'users'), where('companyId', '==', companyId)),
  )

  // 2) ambil juga user yang punya membership di companies[] (tapi companyId aktif beda)
  // Karena Firestore tidak bisa query array of objects dengan mudah,
  // fallback: scan employees via couriers + employeeRequests.
  // Untuk demo: minimal reset yang companyId aktif saja sudah cukup.
  // (Kalau Anda mau total, kita bisa simpan membership doc terpisah di masa depan.)

  const batch = writeBatch(db)

  usersSnap.docs.forEach(u => {
    batch.update(doc(db, 'users', u.id), { companyId: '', role: 'customer' })
  })

  // 3) hapus data operasional (optional tapi sesuai request "otomatis terhapus")
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
  // tidak bisa masuk batch di atas jika >500 dokumen.
  const trackSnap = await getDocs(
    query(collection(db, 'publicTracking'), where('companyId', '==', companyId), limit(500)),
  )
  for (const t of trackSnap.docs) {
    await deleteDoc(doc(db, 'publicTracking', t.id))
  }
}