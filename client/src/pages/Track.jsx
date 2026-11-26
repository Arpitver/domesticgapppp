import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import MapView, { icons } from '../components/MapView';
import { STATUS_LABELS, TRACKABLE, fmtDistance, toLatLng } from '../lib/helpers';

// Great-circle distance in metres
function haversine(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function Track() {
  const { id } = useParams();
  const { user } = useAuth();
  const isProvider = user.role === 'provider';

  const [booking, setBooking] = useState(null);
  const [providerPos, setProviderPos] = useState(null);
  const [lastSeen, setLastSeen] = useState(null);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const [simulate, setSimulate] = useState(false);
  const posRef = useRef(null);
  posRef.current = providerPos;

  // Initial load
  useEffect(() => {
    api
      .get(`/bookings/${id}`)
      .then(({ data }) => {
        setBooking(data.booking);
        setProviderPos(toLatLng(data.booking.provider.location));
      })
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  // Join the booking room and listen for live updates
  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const join = () =>
      s.emit('booking:join', id, (res) => {
        if (!res?.ok) return setError(res?.message || 'Could not join live tracking');
        if (res.providerLocation) setProviderPos((p) => p || res.providerLocation);
      });
    const onLocation = (d) => {
      if (d.bookingId !== id) return;
      setProviderPos({ lat: d.lat, lng: d.lng });
      setLastSeen(new Date(d.at));
    };
    const onStatus = ({ booking: b }) => b._id === id && setBooking(b);

    if (s.connected) join();
    s.on('connect', join); // re-join after reconnects
    s.on('location:updated', onLocation);
    s.on('booking:updated', onStatus);
    return () => {
      s.emit('booking:leave', id);
      s.off('connect', join);
      s.off('location:updated', onLocation);
      s.off('booking:updated', onStatus);
    };
  }, [id]);

  const dest = booking ? toLatLng(booking.location) : null;
  const canShare = isProvider && booking && TRACKABLE.includes(booking.status);

  // Provider: stream GPS (or a simulated drive) to the server
  useEffect(() => {
    if (!canShare || !sharing || !dest) return;
    const s = getSocket();

    if (simulate) {
      let cur = posRef.current || { lat: dest.lat + 0.01, lng: dest.lng + 0.01 };
      const timer = setInterval(() => {
        cur = { lat: cur.lat + (dest.lat - cur.lat) * 0.1, lng: cur.lng + (dest.lng - cur.lng) * 0.1 };
        s.emit('location:update', { bookingId: id, ...cur });
      }, 2000);
      return () => clearInterval(timer);
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (p) => s.emit('location:update', { bookingId: id, lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => setError(e.message),
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [canShare, sharing, simulate, id, dest?.lat, dest?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!booking) return error ? <p className="error">{error}</p> : <p className="muted center">Loading…</p>;

  const markers = [];
  if (dest) markers.push({ id: 'dest', ...dest, icon: icons.home, popup: booking.address });
  if (providerPos)
    markers.push({ id: 'worker', ...providerPos, icon: icons.worker, popup: booking.provider.name });

  const distance = dest && providerPos ? haversine(dest, providerPos) : null;
  const live = TRACKABLE.includes(booking.status);

  return (
    <>
      <p><Link to="/bookings">← Back to bookings</Link></p>
      <div className="row between wrap">
        <h2>{booking.service?.title}</h2>
        <span className={`status ${booking.status}`}>{STATUS_LABELS[booking.status]}</span>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="two-col wide-left">
        <MapView center={providerPos || dest || { lat: 0, lng: 0 }} markers={markers} fit height={520} />
        <div className="card form">
          <h3>{isProvider ? booking.customer.name : booking.provider.name}</h3>
          <p className="small muted">{booking.address}</p>
          {distance !== null && <p><strong>{fmtDistance(distance)}</strong> away</p>}
          {lastSeen && <p className="small muted">Last update {lastSeen.toLocaleTimeString()}</p>}
          {!live && <p className="muted">Live tracking is only available for active bookings.</p>}
          {!isProvider && live && !lastSeen && (
            <p className="muted small">Waiting for the worker to start sharing their location…</p>
          )}

          {canShare && (
            <>
              <button className={`btn ${sharing ? 'btn-danger' : ''}`} onClick={() => setSharing(!sharing)}>
                {sharing ? 'Stop sharing location' : 'Share my live location'}
              </button>
              <label className="check">
                <input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} />
                Simulate driving (for testing without GPS)
              </label>
            </>
          )}
        </div>
      </div>
    </>
  );
}
