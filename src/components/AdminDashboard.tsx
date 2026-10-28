import React from 'react';
import { AdminDashboardData, Candidate } from '../types';
import {
  Users,
  UserCheck,
  Vote,
  Clock,
  TrendingUp,
  BarChart2,
  PlusCircle,
  ArrowUpRight,
  Shield,
  Activity,
} from 'lucide-react';
import { getPartyMeta } from '../services/parties';

interface AdminDashboardProps {
  stats: AdminDashboardData;
  candidates?: Candidate[];
  onNavigate?: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  candidates = [],
  onNavigate,
}) => {
  return (
    <>
      <section className="page-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
              <Shield size={14} />
              <span>Election Authority Control Center</span>
            </div>
            <h1>Dashboard</h1>
            <p>Live voter participation, ballot metrics, and real-time tabulation activity.</p>
          </div>

          {onNavigate && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => onNavigate('admin-candidates')}
              >
                <PlusCircle size={16} />
                Add Candidate
              </button>
              <button
                className="btn btn-primary"
                type="button"
                style={{ width: 'auto', margin: 0 }}
                onClick={() => onNavigate('admin-results')}
              >
                <BarChart2 size={16} />
                Live Results
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3D 4 Key Stat Cards */}
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card-top">
            <h2>Total Candidates</h2>
            <div className="stat-icon">
              <Users size={22} />
            </div>
          </div>
          <p id="totalCandidates" className="stat-value">
            {stats.total_candidates}
          </p>
          <span className="stat-subtext">Certified ballot contenders</span>
        </article>

        <article className="stat-card">
          <div className="stat-card-top">
            <h2>Total Voters</h2>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', color: '#0284c7' }}>
              <UserCheck size={22} />
            </div>
          </div>
          <p id="totalVoters" className="stat-value">
            {stats.total_voters}
          </p>
          <span className="stat-subtext">Registered elector roster</span>
        </article>

        <article className="stat-card">
          <div className="stat-card-top">
            <h2>Total Votes</h2>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', color: '#059669' }}>
              <Vote size={22} />
            </div>
          </div>
          <p id="totalVotes" className="stat-value" style={{ color: '#059669' }}>
            {stats.total_votes}
          </p>
          <span className="stat-subtext">Verified ballots submitted</span>
        </article>

        <article className="stat-card">
          <div className="stat-card-top">
            <h2>Voters Yet to Vote</h2>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#d97706' }}>
              <Clock size={22} />
            </div>
          </div>
          <p id="votersYetToVote" className="stat-value" style={{ color: '#d97706' }}>
            {stats.voters_yet_to_vote}
          </p>
          <span className="stat-subtext">Pending citizen turnout</span>
        </article>
      </section>

      {/* 3D Turnout & Biometrics Dual Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.25rem' }}>
        <article className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} style={{ color: '#0f766e' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Voter Turnout Rate
                </h3>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Proportion of electors who have cast ballots
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 800,
                fontSize: '1.35rem',
                color: '#0f766e',
                background: '#ecfdf5',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                border: '1px solid #a7f3d0',
              }}
            >
              <TrendingUp size={18} />
              <span className="tabular-nums">{stats.turnout_percentage.toFixed(1)}%</span>
            </div>
          </div>

          <div className="progress-bar-bg" style={{ height: '14px' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, stats.turnout_percentage)}%`,
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginTop: '0.65rem', fontWeight: 600 }}>
            <span>{stats.total_votes} of {stats.total_voters} electors voted</span>
            <span>{stats.voters_yet_to_vote} remaining</span>
          </div>
        </article>

        <article className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={18} style={{ color: '#0284c7' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Face Enrollment Rate
                </h3>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Electors with certified biometric templates
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 800,
                fontSize: '1.35rem',
                color: '#0369a1',
                background: '#f0f9ff',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                border: '1px solid #bae6fd',
              }}
            >
              <Shield size={18} />
              <span className="tabular-nums">{(stats.enrolled_percentage || 0).toFixed(1)}%</span>
            </div>
          </div>

          <div className="progress-bar-bg" style={{ height: '14px', background: '#e0f2fe' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, stats.enrolled_percentage || 0)}%`,
                background: 'linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%)',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginTop: '0.65rem', fontWeight: 600 }}>
            <span>{stats.total_enrolled_faces || 0} of {stats.total_voters} enrolled</span>
            <span>{stats.total_voters - (stats.total_enrolled_faces || 0)} pending enrollment</span>
          </div>
        </article>
      </div>

      {/* Ballot Preview Card */}
      {candidates.length > 0 && (
        <article className="card table-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Certified Candidates Lineup</h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Summary of ballot options currently accessible to authorized voters
              </p>
            </div>
            {onNavigate && (
              <button
                type="button"
                className="link-btn"
                style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}
                onClick={() => onNavigate('admin-candidates')}
              >
                Full Candidate Manager <ArrowUpRight size={16} />
              </button>
            )}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Candidate</th>
                  <th>Party Affiliation</th>
                  <th>Symbol</th>
                  <th>Votes Tallied</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => {
                  const meta = getPartyMeta(c.party);
                  return (
                    <tr key={c.id}>
                      <td className="tabular-nums" style={{ color: '#64748b', fontWeight: 700 }}>
                        #{c.id}
                      </td>
                      <td style={{ fontWeight: 800, color: '#0f172a' }}>
                        {c.name}
                      </td>
                      <td>
                        <span
                          className="party-badge"
                          style={{
                            margin: 0,
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.8rem',
                            backgroundColor: meta.badgeBg,
                            color: meta.badgeText,
                            border: `1px solid ${meta.color}33`,
                          }}
                        >
                          {c.party}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: 600 }}>
                        {meta.symbol}
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: 800, color: '#0f766e', fontSize: '1.05rem' }}>
                        {c.vote_count}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </>
  );
};
