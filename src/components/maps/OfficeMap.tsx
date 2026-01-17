import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type LatLng = { lat: number; lng: number }

const DEFAULT_CENTER: LatLng = { lat: -6.200000, lng: 106.816666 } // Jakarta fallback

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

interface OfficeMapProps {
  officeLocation?: LatLng
  height?: number
}

export default function OfficeMap({ officeLocation, height = 420 }: OfficeMapProps) {
  const center = officeLocation ?? DEFAULT_CENTER
  const zoom = officeLocation ? 15 : 11

  return (
    <div className="w-full overflow-hidden rounded-xl border">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height, width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {officeLocation && (
          <Marker position={[officeLocation.lat, officeLocation.lng]} icon={markerIcon}>
            <Popup>
              Lokasi kantor<br />
              {officeLocation.lat}, {officeLocation.lng}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}