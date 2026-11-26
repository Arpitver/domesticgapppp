import { useEffect, useState } from 'react';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import MapView, { icons } from '../components/MapView';
import { DEFAULT_CENTER, getCurrentPosition, toLatLng } from '../lib/helpers';

export default function Profile() {
  const { user, setUser } = useAuth();
  const isProvider = user.role === 'provider';
  const [categories, setCategories] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const [pos, setPos] = useState(toLatLng(user.location));
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: user.address || '',
    category: user.category || '',
    bio: user.bio || '',
    hourlyRate: user.hourlyRate || 0,
    isAvailable: user.isAvailable ?? true,
    password: '',
  });

  useEffect(() => {
    api.get('/services/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const useMyLocation = async () => {
    try {
      setPos(await getCurrentPosition());
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: '', text: '' });
    try {
      const body = { ...form, hourlyRate: Number(form.hourlyRate) };
      if (!body.password) delete body.password;
      if (pos) Object.assign(body, pos);
      const { data } = await api.put('/users/me', body);
      setUser(data.user);
      setForm((f) => ({ ...f, password: '' }));
      setMsg({ type: 'ok', text: 'Profile saved' });
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="two-col">
      <form className="card form" onSubmit={save}>
        <h2>My profile</h2>
        <p className="muted small">{user.email} · {user.role}</p>
        {msg.text && <p className={msg.type === 'error' ? 'error' : 'success'}>{msg.text}</p>}

        <label>Name<input required value={form.name} onChange={set('name')} /></label>
        <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
        <label>Address<input value={form.address} onChange={set('address')} /></label>

        {isProvider && (
          <>
            <label>Trade
              <select value={form.category} onChange={set('category')}>
                <option value="">Select…</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>About you<textarea rows={3} value={form.bio} onChange={set('bio')} /></label>
            <label>Hourly rate (₹)
              <input type="number" min={0} value={form.hourlyRate} onChange={set('hourlyRate')} />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
              />
              Available for new bookings (shown on the nearby map)
            </label>
          </>
        )}

        <label>New password (leave blank to keep)
          <input type="password" minLength={6} value={form.password} onChange={set('password')} />
        </label>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>

      <section className="card">
        <div className="row between">
          <h3>{isProvider ? 'Your base location' : 'Your home location'}</h3>
          <button type="button" className="btn btn-outline" onClick={useMyLocation}>Use my location</button>
        </div>
        <p className="muted small">
          {isProvider
            ? 'Customers find you on the nearby map using this point. It updates live while you share location on a job.'
            : 'Click the map to set your default location.'}
        </p>
        <MapView
          center={pos || DEFAULT_CENTER}
          height={340}
          onMapClick={setPos}
          markers={pos ? [{ id: 'me', ...pos, icon: isProvider ? icons.worker : icons.home }] : []}
        />
        <p className="small muted">Remember to press “Save changes”.</p>
      </section>
    </div>
  );
}
