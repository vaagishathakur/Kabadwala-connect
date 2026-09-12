// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export function useAuth() {
  const [recycler, setRecycler] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('kc_token');
    const stored = localStorage.getItem('kc_recycler');
    if (token && stored) {
      try { setRecycler(JSON.parse(stored)); }
      catch { localStorage.clear(); }
    }
    setLoading(false);
  }, []);

  const login = async (phone, otp) => {
    // Step 1: send-otp already called by UI; step 2: verify
    const res = await api.post('/auth/verify-otp', { phone, otp, role: 'recycler' });
    const { token, user } = res.data;
    localStorage.setItem('kc_token', token);
    localStorage.setItem('kc_recycler', JSON.stringify(user));
    setRecycler(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('kc_token');
    localStorage.removeItem('kc_recycler');
    setRecycler(null);
    navigate('/login');
  };

  return { recycler, login, logout, isAuthenticated: !!recycler, loading };
}

export default useAuth;
