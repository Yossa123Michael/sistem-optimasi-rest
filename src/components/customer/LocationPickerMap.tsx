import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type LatLng = { lat: number; lng: number }

interface Props {
  value: LatLng
  onChange: (v: LatLng) => void
  className?: string
  zoom?: number
}

export default function LocationPickerMap({
  value,
  onChange,
  className = 'h-[320px] w-full rounded-xl overflow-hidden border',
  zoom = 13,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return

    const map = L.map(containerRef.current).setView([value.lat, value.lng], zoom)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    markerRef.current = L.marker([value.lat, value.lng]).addTo(map)

    map.on('click', (e: L.LeafletMouseEvent) => {
      const next = { lat: e.latlng.lat, lng: e.latlng.lng }
      markerRef.current?.setLatLng([next.lat, next.lng])
      onChange(next)
    })

    initializedRef.current = true

    return () => {
      map.off()
      map.remove()
      mapRef.current = null
      markerRef.current = null
      initializedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // sync when value changed from outside
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    markerRef.current.setLatLng([value.lat, value.lng])
  }, [value.lat, value.lng])

  return <div ref={containerRef} className={className} />
}