import React, { useState } from 'react';
import { votingStore } from '../store/votingStore';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Vote,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface VoterLoginProps {
  onSuccess: () => void;
  onNavigateToAdmin: () => void;
}

export const VoterLogin: React.FC<VoterLoginProps> = ({ onSuccess, onNavigateToAdmin }) => {
  const [voterId, setVoterId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccordion, setShowDemoAccordion] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const result = votingStore.loginVoter(voterId, password);
      setIsLoading(false);
      if (result.ok) {
        setError(null);
        onSuccess();
      } else {
        setError(result.error || 'Invalid voter ID or password.');
      }
    }, 150);
  };

  const handleFillDemo = (id: string) => {
    setVoterId(id);
    setPassword('pass123');
    setError(null);
  };

  return (
    <div className="landing-grid">
      {/* LEFT: 3D HERO STORY & VISUALS */}
      <section className="landing-hero">
        <div className="badge-pill-3d">
          <Sparkles size={14} style={{ color: '#059669' }} />
          <span>Next-Generation Digital Democracy</span>
        </div>

        <h1 className="hero-title-3d">
          Your Vote. <br />
          <span className="gradient-text">Your Voice.</span> <br />
          Your Future.
        </h1>

        <p className="hero-desc-3d">
          VoteFlow delivers an encrypted, verifiable, and transparent election environment
          where every qualified citizen casts a single tamper-proof ballot with full cryptographic privacy.
        </p>

        {/* 3D Ballot Box Illustration Visual Element */}
        <div className="hero-art-container">
          <img
            src="/src/assets/images/voting_ballot_box_3d_1792847124393.jpg"
            alt="3D Isometric Voting Ballot Box with Floating Checkmarked Ballots"
            className="hero-art-img"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback to high-grade SVG 3D box if image load fails
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Three Feature Highlights */}
        <div className="features-trio">
          <div className="feature-box-3d">
            <div className="feature-icon-3d">
              <ShieldCheck size={20} />
            </div>
            <h4>Secure Voting</h4>
            <p>End-to-end cryptographic verification token generated on ballot submission.</p>
          </div>

          <div className="feature-box-3d">
            <div className="feature-icon-3d">
              <UserCheck size={20} />
            </div>
            <h4>Verified Voters</h4>
            <p>Strict one-elector-one-vote protocol with instantaneous duplicate prevention.</p>
          </div>

          <div className="feature-box-3d">
            <div className="feature-icon-3d">
              <Lock size={20} />
            </div>
            <h4>Confidential Ballots</h4>
            <p>Ballot privacy preserved with zero plaintext storage of individual selections.</p>
          </div>
        </div>
      </section>

      {/* RIGHT: 3D AUTHENTICATION PANEL */}
      <section className="auth-panel-3d">
        <div className="auth-panel-header">
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #0d9488 0%, #064e3b 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 8px 20px rgba(13, 148, 136, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            }}
          >
            <Vote size={28} />
          </div>
          <h2>Voter Authentication</h2>
          <p>Access your authorized ballot to cast your official vote</p>
        </div>

        {error && (
          <div id="loginError" className="alert alert-error">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form id="voterLoginForm" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="voterId">Voter Identification (ID):</label>
            <div className="input-wrap has-icon">
              <span className="input-icon">
                <UserCheck size={18} />
              </span>
              <input
                id="voterId"
                name="voter_id"
                type="text"
                autoComplete="username"
                placeholder="e.g. VOT1001"
                value={voterId}
                onChange={(e) => setVoterId(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password">Security Password:</label>
            <div className="input-wrap has-icon">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter password"
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

          <button id="loginButton" className="btn btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Verifying Credentials...' : 'Login & Vote'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Expandable Demo Accounts Section */}
        <div className="demo-box">
          <div
            onClick={() => setShowDemoAccordion(!showDemoAccordion)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <strong>Test Demo Electors (Click to Fill)</strong>
            {showDemoAccordion ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {showDemoAccordion && (
            <div style={{ marginTop: '0.65rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleFillDemo('VOT1001')}
                >
                  Fill VOT1001
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleFillDemo('VOT1002')}
                >
                  Fill VOT1002
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleFillDemo('VOT1003')}
                >
                  Fill VOT1003
                </button>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Default demo voter password: <code>pass123</code> (only populates fields without auto-submitting)
              </span>
            </div>
          )}
        </div>

        <p className="fine-print">
          <button
            type="button"
            className="link-btn"
            onClick={onNavigateToAdmin}
          >
            Switch to Administrator Portal &rarr;
          </button>
        </p>
      </section>
    </div>
  );
};
