import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ServiceDetail from './pages/ServiceDetail';
import Nearby from './pages/Nearby';
import Bookings from './pages/Bookings';
import Track from './pages/Track';
import Profile from './pages/Profile';
import ProviderServices from './pages/ProviderServices';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/nearby" element={<Nearby />} />
          <Route
            path="/bookings"
            element={<ProtectedRoute><Bookings /></ProtectedRoute>}
          />
          <Route
            path="/bookings/:id/track"
            element={<ProtectedRoute><Track /></ProtectedRoute>}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute><Profile /></ProtectedRoute>}
          />
          <Route
            path="/provider/services"
            element={<ProtectedRoute roles={['provider']}><ProviderServices /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
