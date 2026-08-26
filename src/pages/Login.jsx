import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Lock, User, AlertCircle } from 'lucide-react';
import api from '../api/axiosClient';

const extractErrorMessage = (err, defaultMsg) => {
  const data = err.response?.data;
  if (typeof data === 'string') return data;
  if (typeof data?.error === 'string') return data.error;
  if (typeof data?.message === 'string') return data.message;
  if (data?.error?.message && typeof data.error.message === 'string') return data.error.message;
  return defaultMsg;
};

const Login = () => {
  const [username, setUsername] = useState('wcaeo_admin');
  const [password, setPassword] = useState('Wc@eo#2026$Secure91');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('wcaeo_token', res.data.token);
      localStorage.setItem('wcaeo_user', JSON.stringify(res.data.user));
      navigate('/superpanel/dashboard');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Invalid credentials or server unavailable.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <Award size={32} />
          </div>
          <h2 className="login-title">WCAEO Portal</h2>
          <p className="login-subtitle">Sign in to manage student certificate records</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {String(error)}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Superpanel'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          Default Credentials: <code>wcaeo_admin</code> / <code>Wc@eo#2026$Secure91</code>
        </div>
      </div>
    </div>
  );
};

export default Login;
