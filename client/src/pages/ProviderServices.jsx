import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { fmtPrice } from '../lib/helpers';

export default function ProviderServices() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', price: '', durationMinutes: 60, category: user.category || '',
  });

  const load = useCallback(() => {
    api.get('/services/mine').then(({ data }) => setServices(data.services)).catch((e) => setError(errMsg(e)));
  }, []);

  useEffect(() => {
    load();
    api.get('/services/categories').then(({ data }) => setCategories(data.categories));
  }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/services', {
        ...form,
        price: Number(form.price),
        durationMinutes: Number(form.durationMinutes),
      });
      setForm({ ...form, title: '', description: '', price: '' });
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const toggle = async (s) => {
    await api.put(`/services/${s._id}`, { isActive: !s.isActive });
    load();
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete "${s.title}"?`)) return;
    await api.delete(`/services/${s._id}`);
    load();
  };

  return (
    <div className="two-col">
      <form className="card form" onSubmit={add}>
        <h2>Add a service</h2>
        {error && <p className="error">{error}</p>}
        <label>Title<input required value={form.title} onChange={set('title')} /></label>
        <label>Description<textarea rows={3} value={form.description} onChange={set('description')} /></label>
        <label>Category
          <select required value={form.category} onChange={set('category')}>
            <option value="">Select…</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <div className="row gap">
          <label className="grow">Price (₹)
            <input type="number" min={0} required value={form.price} onChange={set('price')} />
          </label>
          <label className="grow">Duration (min)
            <input type="number" min={15} value={form.durationMinutes} onChange={set('durationMinutes')} />
          </label>
        </div>
        <button className="btn">Add service</button>
      </form>

      <section>
        <h2>My services</h2>
        {services.length === 0 && <p className="muted">You have not added any services yet.</p>}
        <div className="list">
          {services.map((s) => (
            <div className="card" key={s._id}>
              <div className="row between">
                <strong>{s.title}</strong>
                <span>{fmtPrice(s.price)}</span>
              </div>
              <span className="tag">{s.category}</span>
              <p className="muted small">{s.description}</p>
              <div className="row gap">
                <button className="btn btn-outline" onClick={() => toggle(s)}>
                  {s.isActive ? 'Hide' : 'Show'}
                </button>
                <button className="btn btn-danger" onClick={() => remove(s)}>Delete</button>
                {!s.isActive && <span className="small muted">Hidden from customers</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
