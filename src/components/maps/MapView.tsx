import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapViewProps {
  center?: [number, number]
  zoom?: number
  markers?: Array<{
    position: [number, number]
    label: string
    color?: string
    markerText?: string
  }>
  routes?: Array<
    | [number, number][]
    | {
        points: [number, number][]
        color?: string
      }
  >
  className?: string
}

export default function MapView({
  center = [-6.2088, 106.8456],
  zoom = 12,
  markers = [],
  routes = [],
  className = 'h-[500px] w-full',
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  // layer groups biar clear aman (tidak ganggu tile layer)
  const markerLayerRef = useRef<L.LayerGroup | null>(null)
  const routeLayerRef = useRef<L.LayerGroup | null>(null)

  // cache bounds terakhir supaya tidak fitBounds terus-terusan
  const lastBoundsKeyRef = useRef<string>('')

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return

    const map = L.map(containerRef.current, { zoomAnimation: true, fadeAnimation: true }).setView(center, zoom)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    markerLayerRef.current = L.layerGroup().addTo(map)
    routeLayerRef.current = L.layerGroup().addTo(map)

    initializedRef.current = true

    return () => {
      map.remove()
      mapRef.current = null
      markerLayerRef.current = null
      routeLayerRef.current = null
      initializedRef.current = false
    }
  }, [center, zoom])

  const boundsKey = useMemo(() => {
    // key ringkas untuk deteksi perubahan bounds
    const pts: [number, number][] = []
    markers.forEach(m => pts.push(m.position))
    routes.forEach(r => {
      const points = Array.isArray(r) ? r : r.points
      points.forEach(p => pts.push(p))
    })
    return JSON.stringify(pts)
  }, [markers, routes])

  useEffect(() => {
    const map = mapRef.current
    const markerLayer = markerLayerRef.current
    const routeLayer = routeLayerRef.current
    if (!map || !markerLayer || !routeLayer) return

    // stop animasi dulu biar tidak crash (_leaflet_pos)
    try {
      map.stop()
    } catch {
      // ignore
    }

    // clear aman
    markerLayer.clearLayers()
    routeLayer.clearLayers()

    const boundsPoints: [number, number][] = []

    // markers
    markers.forEach(({ position, label, color = '#3B82F6', markerText }) => {
      boundsPoints.push(position)

      const textHtml = markerText
        ? `<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; transform: rotate(45deg); color:white; font-weight:700; font-size:13px; text-shadow:0 1px 2px rgba(0,0,0,0.45);">${markerText}</div>`
        : ''

      const icon = L.divIcon({
        html: `
          <div style="
            position: relative;
            background-color: ${color};
            width: 30px; height: 30px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            ${textHtml}
          </div>
        `,
        className: 'custom-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      })

      L.marker(position, { icon }).bindPopup(label).addTo(markerLayer)
    })

    // routes
    routes.forEach(routeItem => {
      const points = Array.isArray(routeItem) ? routeItem : routeItem.points
      const color = Array.isArray(routeItem) ? '#10B981' : routeItem.color || '#10B981'

      points.forEach(p => boundsPoints.push(p))

      L.polyline(points, { color, weight: 4, opacity: 0.9 }).addTo(routeLayer)
    })

    // redraw + fit
    requestAnimationFrame(() => {
      try {
        map.invalidateSize()

        // hanya fitBounds kalau konten berubah
        if (boundsKey !== lastBoundsKeyRef.current) {
          lastBoundsKeyRef.current = boundsKey

          if (boundsPoints.length > 0) {
            const b = L.latLngBounds(boundsPoints.map(p => L.latLng(p[0], p[1])))
            map.fitBounds(b, { padding: [24, 24], animate: false })
          } else {
            map.setView(center, zoom, { animate: false })
          }
        }
      } catch {
        // ignore
      }
    })
  }, [markers, routes, center, zoom, boundsKey])

  return <div ref={containerRef} className={className} />
}