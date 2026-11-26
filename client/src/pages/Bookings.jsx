import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { STATUS_LABELS, TRACKABLE, fmtDate, fmtPrice } from '../lib/helpers';

// Next action(s) each role can take for a given status
const PROVIDER_ACTIONS = {
  pending: [['accepted', 'Accept'], ['rejected', 'Reject']],
  accepted: [['on_the_way', 'Start trip']],
  on_the_way: [['in_progress', 'Start work']],
  in_progress: [['completed', 'Mark complete']],
};
const CUSTOMER_ACTIONS = {
  pending: [['cancelled', 'Cancel']],
  accepted: [['cancelled', 'Cancel']],
};

export default function Bookings() {
  const { user } = useAuth();
  const isProvider = user.role === 'provider';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(() => {
    api
      .get('/bookings/mine')
      .then(({ data }) => setBookings(data.bookings))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // Live refresh when the other party changes something
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    s.on('booking:new', load);
    s.on('booking:updated', load);
    return () => {
      s.off('booking:new', load);
      s.off('booking:updated', load);
    };
  }, [load]);

  const changeStatus = async (id, status) => {
    setError('');
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const actions = isProvider ? PROVIDER_ACTIONS : CUSTOMER_ACTIONS;
  const shown = filter ? bookings.filter((b) => b.status === filter) : bookings;

  return (
    <>
      <div className="row between wrap">
        <h2>{isProvider ? 'Job requests' : 'My bookings'}</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted center">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="muted center">
          Nothing here yet. {!isProvider && <Link to="/">Browse services</Link>}
        </p>
      ) : (
        <div className="list">
          {shown.map((b) => {
            const other = isProvider ? b.customer : b.provider;
            return (
              <div className="card" key={b._id}>
                <div className="row between wrap">
                  <h3>{b.service?.title}</h3>
                  <span className={`status ${b.status}`}>{STATUS_LABELS[b.status]}</span>
                </div>
                <p className="small muted">
                  {isProvider ? 'Customer' : 'Worker'}: <strong>{other?.name}</strong>
                  {other?.phone ? ` · ${other.phone}` : ''}
                </p>
                <p className="small">
                  {fmtDate(b.scheduledAt)} · {b.address} · {fmtPrice(b.price)}
                </p>
                {b.notes && <p className="small muted">“{b.notes}”</p>}
                <div className="row gap wrap">
                  {(actions[b.status] || []).map(([status, label]) => (
                    <button
                      key={status}
                      className={`btn ${['rejected', 'cancelled'].includes(status) ? 'btn-danger' : ''}`}
                      onClick={() => changeStatus(b._id, status)}
                    >
                      {label}
                    </button>
                  ))}
                  {TRACKABLE.includes(b.status) && (
                    <Link className="btn btn-outline" to={`/bookings/${b._id}/track`}>
                      {isProvider ? 'Open map' : 'Track live'}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
