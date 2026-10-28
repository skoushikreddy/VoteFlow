import React from 'react';
import { Session } from '../types';
import { LayoutDashboard, Users, UserCheck, BarChart3, LogOut, ShieldCheck, Vote } from 'lucide-react';

interface HeaderProps {
  session: Session;
  activeNav: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ session, activeNav, onNavigate, onLogout }) => {
  return (
    <header className="topbar">
      <div
        className="brand"
        onClick={() => {
          if (session.role === 'admin') {
            onNavigate('admin-dashboard');
          } else if (session.role === 'voter') {
            onNavigate('vote');
          } else {
            onNavigate('voter-login');
          }
        }}
        role="button"
        tabIndex={0}
      >
        <span className="brand-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="38" height="38">
            <rect x="6" y="6" width="36" height="36" rx="8" fill="#0f766e" />
            <rect x="12" y="12" width="24" height="24" rx="4" fill="#ecfdf5" />
            <path
              d="M17 24l5 5 10-11"
              fill="none"
              stroke="#0d9488"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <strong>VoteFlow</strong>
          <span>Online Voting System</span>
        </div>
      </div>

      {session.role === 'voter' && (
        <nav className="top-nav">
          <span className="nav-user">
            <UserCheck size={14} style={{ color: '#0d9488' }} />
            Voter: {session.voter_id}
          </span>
          <button id="logoutButton" className="btn btn-ghost" type="button" onClick={onLogout}>
            <LogOut size={15} />
            Logout
          </button>
        </nav>
      )}

      {session.role === 'admin' && (
        <nav className="top-nav">
          <button
            id="nav-dashboard"
            className={`nav-link ${activeNav === 'dashboard' ? 'active' : ''}`}
            type="button"
            onClick={() => onNavigate('admin-dashboard')}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </button>
          <button
            id="nav-candidates"
            className={`nav-link ${activeNav === 'candidates' ? 'active' : ''}`}
            type="button"
            onClick={() => onNavigate('admin-candidates')}
          >
            <Users size={15} />
            Candidates
          </button>
          <button
            id="nav-voters"
            className={`nav-link ${activeNav === 'voters' ? 'active' : ''}`}
            type="button"
            onClick={() => onNavigate('admin-voters')}
          >
            <UserCheck size={15} />
            Voters
          </button>
          <button
            id="nav-results"
            className={`nav-link ${activeNav === 'results' ? 'active' : ''}`}
            type="button"
            onClick={() => onNavigate('admin-results')}
          >
            <BarChart3 size={15} />
            Live Results
          </button>
          <button id="logoutButton" className="btn btn-ghost" type="button" onClick={onLogout}>
            <LogOut size={15} />
            Logout
          </button>
        </nav>
      )}

      {session.role === 'guest' && (
        <nav className="top-nav">
          {activeNav === 'admin-login' ? (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => onNavigate('voter-login')}
            >
              <Vote size={15} />
              Voter Login
            </button>
          ) : (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => onNavigate('admin-login')}
            >
              <ShieldCheck size={15} />
              Admin Portal
            </button>
          )}
        </nav>
      )}
    </header>
  );
};
