export type OsrmPoint = { lat: number; lng: number }

const OSRM_BASE_URL =
  import.meta.env.VITE_OSRM_BASE_URL || 'https://router.project-osrm.org'

export async function osrmRoute(a: OsrmPoint, b: OsrmPoint) {
  const url = `${OSRM_BASE_URL}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM route failed: ${res.status}`)
  const json = await res.json()

  const route = json.routes?.[0]
  if (!route) throw new Error('OSRM: no routes returned')

  return {
    distanceM: route.distance as number,
    durationS: route.duration as number,
  }
}