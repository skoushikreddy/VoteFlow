import React, { useState } from 'react';
import { Session } from '../types';
import { Shield, RefreshCw, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  session: Session;
  onNavigate: (view: string) => void;
  onResetData: () => void;
}

export const Footer: React.FC<FooterProps> = ({ session, onNavigate, onResetData }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResetting(true);
    setResetSuccess(false);

    try {
      onResetData();
      setResetSuccess(true);
    } catch (err) {
      console.error('Failed to reset demo data:', err);
    } finally {
      setTimeout(() => {
        setIsResetting(false);
      }, 500);

      setTimeout(() => {
        setResetSuccess(false);
      }, 4000);
    }
  };

  return (
    <footer className="site-footer">
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: '#0f766e',
          fontWeight: 800,
          fontSize: '0.95rem',
          marginBottom: '0.35rem',
        }}
      >
        <Shield size={16} />
        <span>VoteFlow Digital Electoral System</span>
      </div>
      <p style={{ color: '#64748b' }}>
        Cryptographically secured one-vote-per-citizen architecture · Tamper-evident ledger
      </p>

      {/* Navigation shortcuts for Guest & Voter */}
      {session.role === 'guest' && (
        <p style={{ marginTop: '0.75rem' }}>
          <button
            className="link-btn"
            type="button"
            onClick={() => onNavigate('admin-login')}
          >
            Administrator Portal Access &rarr;
          </button>
        </p>
      )}

      {session.role === 'voter' && (
        <p style={{ marginTop: '0.75rem' }}>
          <button
            className="link-btn"
            type="button"
            onClick={() => onNavigate('admin-login')}
          >
            Election Official Login
          </button>
        </p>
      )}

      {/* Reset Demo Data Button (Available for Admin & Demo Testing) */}
      <div style={{ marginTop: '0.85rem' }}>
        <button
          id="resetDemoDataButton"
          data-testid="reset-demo-data-btn"
          type="button"
          onClick={handleResetClick}
          disabled={isResetting}
          style={{
            color: resetSuccess ? '#065f46' : '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: resetSuccess ? '#ecfdf5' : '#fff1f2',
            border: resetSuccess ? '1.5px solid #10b981' : '1px solid #fecaca',
            borderRadius: '8px',
            padding: '0.5rem 1.15rem',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: isResetting ? 'wait' : 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: resetSuccess
              ? '0 4px 14px rgba(16, 185, 129, 0.25)'
              : '0 2px 4px rgba(220, 38, 38, 0.08)',
            transform: isResetting ? 'scale(0.98)' : 'none',
          }}
          title="Reset all votes, electors, and candidates back to default demo data"
        >
          {resetSuccess ? (
            <CheckCircle2 size={15} style={{ color: '#059669' }} />
          ) : (
            <RefreshCw
              size={15}
              style={{
                animation: isResetting ? 'spin 0.6s linear infinite' : 'none',
              }}
            />
          )}
          <span>
            {isResetting
              ? 'Resetting Demo Data...'
              : resetSuccess
              ? 'Demo Data Reset Successfully!'
              : 'Reset Demo Data to Initial Seed State'}
          </span>
        </button>
      </div>

      {/* Immediate Success Notification Toast */}
      {resetSuccess && (
        <div
          id="resetSuccessNotification"
          style={{
            maxWidth: 460,
            margin: '0.85rem auto 0',
            padding: '0.65rem 1.1rem',
            borderRadius: '10px',
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            fontSize: '0.86rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle2 size={16} />
          <span>Demo data successfully reset! Votes cleared, voters restored to Not Voted.</span>
        </div>
      )}
    </footer>
  );
};
