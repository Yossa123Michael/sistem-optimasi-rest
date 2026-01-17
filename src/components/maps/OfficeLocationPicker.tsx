import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type LatLng = { lat: number; lng: number }

const DEFAULT_CENTER: LatLng = { lat: -6.2, lng: 106.816666 } // Jakarta

// Fix icon marker agar tidak hilang di Vite
const markerIcon = new L.Icon({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function ClickToPick({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

interface OfficeLocationPickerProps {
  value?: LatLng
  onChange: (value: LatLng) => void
  height?: number
}

export default function OfficeLocationPicker({
  value,
  onChange,
  height = 360,
}: OfficeLocationPickerProps) {
  const [local, setLocal] = useState<LatLng | undefined>(value)

  const center = useMemo(() => local ?? value ?? DEFAULT_CENTER, [local, value])

  return (
    <div className="w-full overflow-hidden rounded-xl border">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={local || value ? 15 : 11}
        style={{ height, width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickToPick
          onPick={(p) => {
            setLocal(p)
            onChange(p)
          }}
        />

        {(local || value) && (
          <Marker
            position={[(local || value)!.lat, (local || value)!.lng]}
            icon={markerIcon}
          />
        )}
      </MapContainer>
    </div>
  )
}