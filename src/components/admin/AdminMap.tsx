import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Package } from '@/lib/types'

interface AdminMapProps {
  packages: Package[]
  highlightPackageId?: string
}

const markerIcon = new L.Icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export default function AdminMap({ packages, highlightPackageId }: AdminMapProps) {
  const defaultCenter: [number, number] = [-6.2, 106.816666]

  const firstWithLocation = packages.find(
    p => typeof p.latitude === 'number' && typeof p.longitude === 'number',
  )

  const center: [number, number] =
    firstWithLocation && (firstWithLocation.latitude || firstWithLocation.longitude)
      ? [firstWithLocation.latitude, firstWithLocation.longitude]
      : defaultCenter

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {packages
          .filter(
            p =>
              typeof p.latitude === 'number' &&
              typeof p.longitude === 'number' &&
              (p.latitude !== 0 || p.longitude !== 0),
          )
          .map(pkg => (
            <Marker
              key={pkg.id}
              position={[pkg.latitude, pkg.longitude]}
              icon={markerIcon}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{pkg.name}</div>
                  <div>{pkg.recipientName}</div>
                  <div className="text-xs text-gray-500">
                    {pkg.locationDetail}
                  </div>
                  <div className="text-xs mt-1">
                    Status: {pkg.status || 'pending'}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  )
}