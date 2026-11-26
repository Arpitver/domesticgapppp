import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import MapView, { icons } from '../components/MapView';
import { DEFAULT_CENTER, fmtPrice, getCurrentPosition, toLatLng } from '../lib/helpers';

export default function ServiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pos, setPos] = useState(toLatLng(user?.location));
  const [form, setForm] = useState({ scheduledAt: '', address: user?.address || '', notes: '' });

  useEffect(() => {
    api
      .get(`/services/${id}`)
      .then(({ data }) => setService(data.service))
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  const useMyLocation = async () => {
    try {
      setPos(await getCurrentPosition());
    } catch (e) {
      setError(e.message);
    }
  };

  const book = async (e) => {
    e.preventDefault();
    if (!pos) return setError('Click the map (or use your location) to set where the service is needed.');
    setBusy(true);
    setError('');
    try {
      await api.post('/bookings', {
        serviceId: id,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        address: form.address,
        notes: form.notes,
        lat: pos.lat,
        lng: pos.lng,
      });
      navigate('/bookings');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (!service) return error ? <p className="error">{error}</p> : <p className="muted center">Loading…</p>;
  const p = service.provider;

  return (
    <div className="two-col">
      <section className="card">
        <span className="tag">{service.category}</span>
        <h2>{service.title}</h2>
        <p>{service.description}</p>
        <p><strong>{fmtPrice(service.price)}</strong> · about {service.durationMinutes} min</p>
        <hr />
        <h3>{p?.name}</h3>
        <p className="muted">{p?.bio}</p>
        <p className="small">
          ★ {p?.rating?.toFixed?.(1) || '–'} ({p?.ratingCount || 0} reviews) ·{' '}
          {p?.isAvailable ? 'Available' : 'Currently unavailable'}
        </p>
      </section>

      <section className="card">
        <h3>Book this service</h3>
        {!user ? (
          <p>
            <Link to="/login" state={{ from: `/services/${id}` }}>Log in</Link> as a customer to book.
          </p>
        ) : user.role !== 'customer' ? (
          <p className="muted">Only customer accounts can book services.</p>
        ) : (
          <form className="form" onSubmit={book}>
            {error && <p className="error">{error}</p>}
            <label>Date & time
              <input
                type="datetime-local"
                required
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              />
            </label>
            <label>Address
              <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </label>
            <label>Notes (optional)
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
            <div className="row between">
              <span className="small muted">Click the map to drop a pin</span>
              <button type="button" className="btn btn-outline" onClick={useMyLocation}>Use my location</button>
            </div>
            <MapView
              center={pos || DEFAULT_CENTER}
              height={260}
              onMapClick={setPos}
              markers={pos ? [{ id: 'pin', ...pos, icon: icons.home }] : []}
            />
            <button className="btn" disabled={busy}>{busy ? 'Booking…' : `Book for ${fmtPrice(service.price)}`}</button>
          </form>
        )}
      </section>
    </div>
  );
}
