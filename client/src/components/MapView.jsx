import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite does not resolve Leaflet's default icon paths, so set them explicitly.
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const emoji = (symbol) =>
  L.divIcon({
    className: 'emoji-marker',
    html: `<span>${symbol}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

export const icons = {
  default: defaultIcon,
  worker: emoji('🛠️'),
  home: emoji('🏠'),
};

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], map.getZoom());
  }, [center?.lat, center?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 1) {
      map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [50, 50], maxZoom: 16 });
    }
  }, [points?.length]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/**
 * markers: [{ id, lat, lng, icon?, popup? }]
 * center:  { lat, lng } initial / recenter target
 * onMapClick: enables click-to-pick-location
 * radiusKm: draws a search radius circle around center
 * fit: fit the view to all markers
 */
export default function MapView({
  center,
  markers = [],
  onMapClick,
  radiusKm,
  fit = false,
  height = 420,
  zoom = 13,
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: 12 }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {fit ? <FitBounds points={markers} /> : <Recenter center={center} />}
      {onMapClick && <ClickHandler onClick={onMapClick} />}
      {radiusKm && (
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusKm * 1000}
          pathOptions={{ color: '#0f766e', fillOpacity: 0.06 }}
        />
      )}
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={m.icon || defaultIcon}>
          {m.popup && <Popup>{m.popup}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  );
}
