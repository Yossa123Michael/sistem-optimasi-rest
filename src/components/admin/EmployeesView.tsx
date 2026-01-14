import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { User, UserRole } from '@/lib/types'
import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'

type MemberDoc = {
  id: string
  companyId: string
  userId: string
  role: Exclude<UserRole, 'customer'>
  active: boolean
  joinedAt: string
  updatedAt?: string
  leftAt?: string | null
}

function upsertMembershipArray(companies: any[], companyId: string, role: UserRole) {
  const arr = Array.isArray(companies) ? companies : []
  const idx = arr.findIndex((m: any) => m?.companyId === companyId)
  const next = { companyId, role, joinedAt: new Date().toISOString() }
  if (idx >= 0) return arr.map((m: any, i: number) => (i === idx ? { ...m, role } : m))
  return [...arr, next]
}

function removeMembershipArray(companies: any[], companyId: string) {
  const arr = Array.isArray(companies) ? companies : []
  return arr.filter((m: any) => m?.companyId !== companyId)
}

export default function EmployeesView({ user }: { user: User }) {
  const [members, setMembers] = useState<MemberDoc[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)

  const companyId = user.companyId || ''

  const load = async () => {
    if (!companyId) return
    try {
      setLoading(true)

      const memSnap = await getDocs(
        query(
          collection(db, 'companyMembers'),
          where('companyId', '==', companyId),
          where('active', '==', true),
        ),
      )

      const memList = memSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as MemberDoc))
      setMembers(memList)

      // load user docs untuk ditampilkan namanya
      const uids = Array.from(new Set(memList.map(m => m.userId)))
      const entries = await Promise.all(
        uids.map(async (uid) => {
          const snap = await getDoc(doc(db, 'users', uid))
          return snap.exists() ? ([uid, { id: uid, ...(snap.data() as any) } as User] as const) : null
        }),
      )
      const map: Record<string, User> = {}
      for (const e of entries) {
        if (e) map[e[0]] = e[1]
      }
      setUsersMap(map)
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat karyawan')
      setMembers([])
      setUsersMap({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  const rows = useMemo(() => {
    return members
      .map(m => ({ member: m, profile: usersMap[m.userId] }))
      // jangan tampilkan owner sendiri (opsional)
      .filter(x => x.profile?.id !== user.id)
  }, [members, usersMap, user.id])

  const changeRole = async (member: MemberDoc, newRole: Exclude<UserRole, 'customer'>) => {
    if (!companyId) return
    try {
      // update member doc
      await updateDoc(doc(db, 'companyMembers', member.id), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      })

      // update users/{uid}: companies[] role + kalau aktif di company ini, update role aktif
      const userRef = doc(db, 'users', member.userId)
      const uSnap = await getDoc(userRef)
      if (uSnap.exists()) {
        const uData = uSnap.data() as any
        const nextCompanies = upsertMembershipArray(uData.companies || [], companyId, newRole)

        const patch: any = { companies: nextCompanies, updatedAt: new Date().toISOString() }
        if (uData.companyId === companyId) patch.role = newRole

        await updateDoc(userRef, patch)
      }

      toast.success('Role berhasil diubah')
      load()
    } catch (e) {
      console.error(e)
      toast.error('Gagal mengubah role')
    }
  }

  const fireEmployee = async (member: MemberDoc) => {
    if (!companyId) return
    try {
      // set member inactive
      await updateDoc(doc(db, 'companyMembers', member.id), {
        active: false,
        leftAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // update user: remove membership + reset aktif kalau sedang di company ini
      const userRef = doc(db, 'users', member.userId)
      const uSnap = await getDoc(userRef)
      if (uSnap.exists()) {
        const uData = uSnap.data() as any
        const nextCompanies = removeMembershipArray(uData.companies || [], companyId)

        const patch: any = { companies: nextCompanies, updatedAt: new Date().toISOString() }

        // kalau user sedang aktif di company ini, paksa keluar
        if (uData.companyId === companyId) {
          patch.companyId = ''
          patch.role = 'customer'
        }

        await updateDoc(userRef, patch)
      }

      toast.success('Karyawan berhasil dipecat')
      load()
    } catch (e) {
      console.error(e)
      toast.error('Gagal memecat karyawan')
    }
  }

  if (!companyId) {
    return (
      <div className="p-4 md:p-8 pt-20 lg:pt-8">
        <Card className="p-6">
          <p className="text-sm text-destructive">Anda belum memilih perusahaan.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Karyawan</h1>
          <p className="text-sm text-muted-foreground">
            Menampilkan karyawan yang sudah join dan belum keluar dari perusahaan ini.
          </p>
        </div>

        <Card className="p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada karyawan aktif.</p>
          ) : (
            <div className="space-y-3">
              {rows.map(({ member, profile }) => (
                <div key={member.id} className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{profile?.name || profile?.email || member.userId}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email || ''}</p>
                    <p className="text-xs text-muted-foreground">
                      Role: <span className="font-mono">{member.role}</span>
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant={member.role === 'admin' ? 'default' : 'outline'}
                      onClick={() => changeRole(member, 'admin')}
                    >
                      Admin
                    </Button>
                    <Button
                      type="button"
                      variant={member.role === 'courier' ? 'default' : 'outline'}
                      onClick={() => changeRole(member, 'courier')}
                    >
                      Kurir
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        const ok = confirm(`Pecat ${profile?.name || profile?.email || member.userId}?`)
                        if (!ok) return
                        fireEmployee(member)
                      }}
                    >
                      Pecat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}