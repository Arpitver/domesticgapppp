import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const startSession = useCallback((token, u) => {
    localStorage.setItem('dg_token', token);
    connectSocket(token);
    setUser(u);
  }, []);

  // Restore session on page load
  useEffect(() => {
    const token = localStorage.getItem('dg_token');
    if (!token) return setLoading(false);
    api
      .get('/auth/me')
      .then(({ data }) => startSession(token, data.user))
      .catch(() => localStorage.removeItem('dg_token'))
      .finally(() => setLoading(false));
  }, [startSession]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    startSession(data.token, data.user);
    return data.user;
  };

  const register = async (form) => {
    const { data } = await api.post('/auth/register', form);
    startSession(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('dg_token');
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
