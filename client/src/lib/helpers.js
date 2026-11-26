export const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

export const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  on_the_way: 'On the way',
  in_progress: 'In progress',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const TRACKABLE = ['accepted', 'on_the_way', 'in_progress'];

export const fmtDate = (d) =>
  new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export const fmtPrice = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const fmtDistance = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

// Promise wrapper for the browser geolocation API
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation is not supported'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(new Error(e.message)),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// GeoJSON [lng, lat] -> { lat, lng }
export const toLatLng = (loc) =>
  loc?.coordinates?.length === 2 ? { lat: loc.coordinates[1], lng: loc.coordinates[0] } : null;
