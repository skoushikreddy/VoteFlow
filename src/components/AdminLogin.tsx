import React, { useState } from 'react';
import { votingStore } from '../store/votingStore';
import { ShieldAlert, User, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onNavigateToVoter: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onNavigateToVoter }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const result = votingStore.loginAdmin(username, password);
      setIsLoading(false);
      if (result.ok) {
        setError(null);
        onSuccess();
      } else {
        setError(result.error || 'Invalid admin username or password.');
      }
    }, 150);
  };

  const handleFillDemo = () => {
    setUsername('KOUSHIKRDY2006');
    setPassword('AMMUUU@1090');
    setError(null);
  };

  return (
    <div style={{ maxWidth: 480, margin: '2rem auto' }}>
      <article className="card auth-panel-3d">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            }}
          >
            <ShieldAlert size={30} />
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem', letterSpacing: '-0.03em' }}>
            Administrator Portal
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
            Election management, candidate configuration, and live vote tabulation
          </p>
        </div>

        {error && (
          <div id="adminLoginError" className="alert alert-error">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form id="adminLoginForm" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="adminUsername">Administrator Username:</label>
            <div className="input-wrap has-icon">
              <span className="input-icon">
                <User size={18} />
              </span>
              <input
                id="adminUsername"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="adminPassword">Security Password:</label>
            <div className="input-wrap has-icon">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="adminPassword"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '0.3rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button id="adminLoginButton" className="btn btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Verifying Admin Access...' : 'Login to Admin Dashboard'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="demo-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
            <ShieldCheck size={16} style={{ color: '#0369a1' }} />
            <strong>Demo Administrator Account:</strong>
          </div>
          <div style={{ marginTop: '0.4rem' }}>
            <button
              type="button"
              className="demo-chip"
              onClick={handleFillDemo}
            >
              Fill KOUSHIKRDY2006
            </button>
            <span style={{ fontSize: '0.82rem', marginLeft: '0.4rem', color: '#64748b' }}>
              (password: <code>AMMUUU@1090</code>)
            </span>
          </div>
        </div>

        <p className="fine-print">
          <button
            type="button"
            className="link-btn"
            onClick={onNavigateToVoter}
          >
            &larr; Return to Voter Authentication
          </button>
        </p>
      </article>
    </div>
  );
};
