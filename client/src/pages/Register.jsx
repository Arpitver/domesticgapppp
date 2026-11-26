import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { errMsg } from '../lib/api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'customer', category: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/services/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await register(form);
      // Providers should set their location so customers can find them
      navigate(user.role === 'provider' ? '/profile' : '/', { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card form narrow" onSubmit={submit}>
      <h2>Create account</h2>
      {error && <p className="error">{error}</p>}

      <div className="segmented">
        {['customer', 'provider'].map((r) => (
          <button
            type="button"
            key={r}
            className={form.role === r ? 'active' : ''}
            onClick={() => setForm({ ...form, role: r })}
          >
            {r === 'customer' ? 'I need a service' : 'I offer services'}
          </button>
        ))}
      </div>

      <label>Full name<input required value={form.name} onChange={set('name')} /></label>
      <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
      <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
      <label>Password (min 6 characters)
        <input type="password" minLength={6} required value={form.password} onChange={set('password')} />
      </label>

      {form.role === 'provider' && (
        <label>Your trade
          <select required value={form.category} onChange={set('category')}>
            <option value="">Select…</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      )}

      <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
      <p className="muted small">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
