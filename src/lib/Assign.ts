import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'

type CourierDoc = {
  id: string
  companyId: string
  userId: string
  active: boolean
  capacity?: number
}

type PackageDoc = {
  id: string
  companyId: string
  status?: string
  courierId?: string | null
  trackingNumber?: string
  name?: string
}

export async function assignPendingPackagesToActiveCouriers(companyId: string) {
  // 1) ambil kurir aktif
  const courSnap = await getDocs(
    query(
      collection(db, 'couriers'),
      where('companyId', '==', companyId),
      where('active', '==', true),
    ),
  )
  const couriers: CourierDoc[] = courSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))

  if (!couriers.length) {
    throw new Error('Tidak ada kurir aktif untuk perusahaan ini.')
  }

  // 2) ambil paket pending (yang belum punya courierId)
  const pkgSnap = await getDocs(
    query(collection(db, 'packages'), where('companyId', '==', companyId), where('status', '==', 'pending')),
  )
  const pkgs: PackageDoc[] = pkgSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))

  const unassigned = pkgs.filter(p => !p.courierId)

  if (!unassigned.length) {
    return { assigned: 0, totalPending: pkgs.length, activeCouriers: couriers.length }
  }

  // 3) round-robin assignment sederhana
  const now = new Date().toISOString()
  const batch = writeBatch(db)

  unassigned.forEach((p, idx) => {
    const c = couriers[idx % couriers.length]

    // penting: courierId HARUS courierDoc.id (bukan userId)
    batch.update(doc(db, 'packages', p.id), {
      courierId: c.id,
      status: 'in-transit',
      updatedAt: now,
    })

    if (p.trackingNumber) {
      batch.set(doc(db, 'publicTracking', p.trackingNumber), {
        companyId,
        status: 'in-transit',
        updatedAt: now,
        lastEvent: 'Ditugaskan ke kurir',
      }, { merge: true })
    }
  })

  await batch.commit()

  return { assigned: unassigned.length, totalPending: pkgs.length, activeCouriers: couriers.length }
}