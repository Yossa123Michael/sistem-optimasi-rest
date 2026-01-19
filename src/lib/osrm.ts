export type LatLng = { lat: number; lng: number }

export async function getOsrmRoutePath(points: LatLng[], profile: 'driving' | 'car' = 'driving') {
  // OSRM butuh minimal 2 titik
  if (points.length < 2) return []

  // OSRM format: lng dan lat
  const coords = points.map(p => `${p.lng},${p.lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`)

  const data = await res.json()
  const route = data?.routes?.[0]
  const geom = route?.geometry?.coordinates

  if (!Array.isArray(geom)) return []

  // geojson coords: [lng,lat]
  return geom.map((c: [number, number]) => ({ lng: c[0], lat: c[1] } as LatLng))
}