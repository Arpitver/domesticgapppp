import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        Domestic<span>Gap</span>
      </Link>
      <nav>
        <NavLink to="/" end>Services</NavLink>
        <NavLink to="/nearby">Nearby workers</NavLink>
        {user && <NavLink to="/bookings">Bookings</NavLink>}
        {user?.role === 'provider' && <NavLink to="/provider/services">My services</NavLink>}
        {user && <NavLink to="/profile">Profile</NavLink>}
      </nav>
      <div className="nav-actions">
        {user ? (
          <>
            <span className="muted small">
              {user.name} · {user.role}
            </span>
            <button
              className="btn btn-outline"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link className="btn btn-outline" to="/login">Log in</Link>
            <Link className="btn" to="/register">Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}
