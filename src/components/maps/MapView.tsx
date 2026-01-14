import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapViewProps {
  center?: [number, number]
  zoom?: number
  markers?: Array<{
    position: [number, number]
    label: string
    color?: string
    markerText?: string // NEW: nomor marker (mis. "1", "2", "K")
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

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return

    mapRef.current = L.map(containerRef.current, {
      zoomAnimation: true,
      fadeAnimation: true,
    }).setView(center, zoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapRef.current)

    initializedRef.current = true

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        initializedRef.current = false
      }
    }
  }, [center, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer)
      }
    })

    // add markers
    markers.forEach(({ position, label, color = '#3B82F6', markerText }) => {
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

      L.marker(position, { icon }).bindPopup(label).addTo(map)
    })

    // add routes
    routes.forEach(routeItem => {
      const points = Array.isArray(routeItem) ? routeItem : routeItem.points
      const color = Array.isArray(routeItem) ? '#10B981' : routeItem.color || '#10B981'

      L.polyline(points, {
        color,
        weight: 4,
        opacity: 0.85,
        smoothFactor: 1,
      }).addTo(map)
    })

    // bounds from markers + routes
    const allPoints: [number, number][] = []
    markers.forEach(m => allPoints.push(m.position))
    routes.forEach(r => {
      const pts = Array.isArray(r) ? r : r.points
      pts.forEach(p => allPoints.push(p))
    })

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints)
      const t = window.setTimeout(() => {
        if (!mapRef.current) return
        try {
          map.fitBounds(bounds, { padding: [50, 50], animate: false })
        } catch (e) {
          console.warn('fitBounds failed', e)
        }
      }, 0)

      return () => window.clearTimeout(t)
    }
  }, [markers, routes])

  return <div ref={containerRef} className={className} />
}