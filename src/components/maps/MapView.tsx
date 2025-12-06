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
  }>
  routes?: Array<[number, number][]>
  className?: string
}

export default function MapView({ 
  center = [-6.2088, 106.8456], 
  zoom = 12,
  markers = [],
  routes = [],
  className = 'h-[500px] w-full'
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView(center, zoom)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapRef.current!.removeLayer(layer)
      }
    })

    markers.forEach(({ position, label, color = '#3B82F6' }) => {
      const icon = L.divIcon({
        html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        className: 'custom-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })

      L.marker(position, { icon })
        .bindPopup(label)
        .addTo(mapRef.current!)
    })

    routes.forEach((route) => {
      L.polyline(route, {
        color: '#10B981',
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1
      }).addTo(mapRef.current!)
    })

    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => m.position))
      mapRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [markers, routes])

  return <div ref={containerRef} className={className} />
}
