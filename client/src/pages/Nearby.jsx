import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import MapView, { icons } from '../components/MapView';
import { DEFAULT_CENTER, fmtDistance, fmtPrice, getCurrentPosition, toLatLng } from '../lib/helpers';

export default function Nearby() {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [usingDefault, setUsingDefault] = useState(true);
  const [radius, setRadius] = useState(10);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [error, setError] = useState('');

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
    locate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const locate = async () => {
    try {
      setCenter(await getCurrentPosition());
      setUsingDefault(false);
    } catch {
      setError('Could not get your location, showing the default area. Click the map to search elsewhere.');
    }
  };

  useEffect(() => {
    api
      .get('/workers/nearby', { params: { lat: center.lat, lng: center.lng, radius, category } })
      .then(({ data }) => {
        if (!Array.isArray(data.workers)) {
          throw new Error('Worker API is unavailable. Deploy the backend and set VITE_API_URL.');
        }
        setWorkers(data.workers);
      })
      .catch((e) => {
        setWorkers([]);
        setError(errMsg(e));
      });
  }, [center, radius, category]);

  const markers = [
    { id: 'me', ...center, icon: icons.home, popup: usingDefault ? 'Search centre' : 'You are here' },
    ...workers
      .map((w) => ({ w, ll: toLatLng(w.location) }))
      .filter((x) => x.ll)
      .map(({ w, ll }) => ({
        id: w._id,
        ...ll,
        icon: icons.worker,
        popup: (
          <div>
            <strong>{w.name}</strong>
            <br />
            {w.category} · {fmtDistance(w.distance)}
          </div>
        ),
      })),
  ];

  return (
    <>
      <div className="row between wrap">
        <h2>Workers near you</h2>
        <div className="row gap">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All trades</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            {[2, 5, 10, 25, 50].map((r) => <option key={r} value={r}>{r} km</option>)}
          </select>
          <button className="btn btn-outline" onClick={locate}>Use my location</button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="two-col wide-left">
        <MapView center={center} markers={markers} radiusKm={radius} height={520} onMapClick={(p) => { setCenter(p); setUsingDefault(true); }} />
        <div className="list">
          {workers.length === 0 && <p className="muted">No available workers in this area.</p>}
          {workers.map((w) => (
            <div className="card" key={w._id}>
              <div className="row between">
                <strong>{w.name}</strong>
                <span className="small muted">{fmtDistance(w.distance)}</span>
              </div>
              <span className="tag">{w.category}</span>
              <p className="muted small">{w.bio}</p>
              <div className="row between">
                <span className="small">★ {w.rating?.toFixed?.(1) || '–'} · {fmtPrice(w.hourlyRate)}/hr</span>
                <Link className="btn btn-outline" to={`/?provider=${w._id}`}>View services</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
