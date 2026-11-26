import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import { fmtPrice } from '../lib/helpers';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState(params.get('q') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const category = params.get('category') || '';
  const provider = params.get('provider') || '';

  useEffect(() => {
    api
      .get('/services/categories')
      .then(({ data }) => {
        if (!Array.isArray(data.categories)) {
          throw new Error('Service API is unavailable. Deploy the backend and set VITE_API_URL.');
        }
        setCategories(data.categories);
      })
      .catch((e) => setError(errMsg(e)));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/services', { params: { category, provider, q: params.get('q') || '' } })
      .then(({ data }) => {
        if (!Array.isArray(data.services)) {
          throw new Error('Service API is unavailable. Deploy the backend and set VITE_API_URL.');
        }
        setServices(data.services);
      })
      .catch((e) => {
        setServices([]);
        setError(errMsg(e));
      })
      .finally(() => setLoading(false));
  }, [category, provider, params]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  };

  return (
    <>
      <section className="hero">
        <h1>Trusted help for every home job</h1>
        <p>Browse services, book a verified worker, and track them live when they are on the way.</p>
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            update('q', q.trim());
          }}
        >
          <input
            placeholder="Search for plumber, cleaning, AC repair…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn">Search</button>
        </form>
      </section>

      <div className="chips">
        <button className={`chip ${!category ? 'active' : ''}`} onClick={() => update('category', '')}>
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${category === c ? 'active' : ''}`}
            onClick={() => update('category', c)}
          >
            {c}
          </button>
        ))}
      </div>

      {provider && (
        <p className="muted">
          Showing services from one worker. <button className="link" onClick={() => update('provider', '')}>Clear</button>
        </p>
      )}
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted center">Loading services…</p>
      ) : error ? null : services.length === 0 ? (
        <p className="muted center">No services found.</p>
      ) : (
        <div className="grid">
          {services.map((s) => (
            <Link to={`/services/${s._id}`} key={s._id} className="card service-card">
              <span className="tag">{s.category}</span>
              <h3>{s.title}</h3>
              <p className="muted clamp">{s.description}</p>
              <div className="row between">
                <strong>{fmtPrice(s.price)}</strong>
                <span className="muted small">
                  {s.provider?.name} · ★ {s.provider?.rating?.toFixed?.(1) || '–'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
