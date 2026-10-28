import React, { useState, useMemo } from 'react';
import { Elector } from '../types';
import { votingStore } from '../store/votingStore';
import {
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  Check,
  AlertCircle,
  ShieldCheck,
  Camera,
  RotateCcw,
  FileText,
  X,
  ShieldAlert,
  Unlock,
} from 'lucide-react';

interface AdminVotersProps {
  voters: Elector[];
}

export const AdminVoters: React.FC<AdminVotersProps> = ({ voters }) => {
  const [newVoterId, setNewVoterId] = useState('');
  const [password, setPassword] = useState('pass123');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'voted' | 'pending' | 'enrolled'>('all');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);

  const biometricLogs = votingStore.getBiometricLogs();

  const handleResetFace = (voter: Elector) => {
    const result = votingStore.resetVoterFaceEnrollment(voter.id);
    if (result.ok) {
      setSuccess(`Biometric face template reset for ${voter.voter_id}. Voter may now re-enroll.`);
      setError(null);
    } else {
      setError(result.error || 'Failed to reset face template.');
    }
  };

  const handleUnlock = (voter: Elector) => {
    const result = votingStore.unlockVoterAttempts(voter.id);
    if (result.ok) {
      setSuccess(`Biometric attempts counter reset to 0 for ${voter.voter_id}.`);
      setError(null);
    } else {
      setError(result.error || 'Failed to unlock voter.');
    }
  };

  const enrolledCount = voters.filter((v) => v.face_enrolled === 1).length;

  const filteredVoters = useMemo(() => {
    return voters.filter((voter) => {
      const matchesSearch = voter.voter_id.toLowerCase().includes(searchQuery.trim().toLowerCase());
      if (!matchesSearch) return false;

      if (statusFilter === 'voted') return voter.has_voted === 1;
      if (statusFilter === 'pending') return voter.has_voted === 0;
      if (statusFilter === 'enrolled') return voter.face_enrolled === 1;
      return true;
    });
  }, [voters, searchQuery, statusFilter]);

  const votedCount = voters.filter((v) => v.has_voted === 1).length;
  const pendingCount = voters.filter((v) => v.has_voted === 0).length;

  const handleAddVoter = (e: React.FormEvent) => {
    e.preventDefault();
    const result = votingStore.addVoter(newVoterId, password);
    if (result.ok) {
      setSuccess(`Voter ${newVoterId.toUpperCase()} registered successfully.`);
      setError(null);
      setNewVoterId('');
      setPassword('pass123');
    } else {
      setError(result.error || 'Failed to add voter.');
      setSuccess(null);
    }
  };

  return (
    <>
      <section className="page-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Voters</h1>
            <p>Electoral roll, biometric face enrollment status, and one-person-one-vote security controls.</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowLogsModal(true)}
            style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <FileText size={16} />
            Biometric Audit Logs ({biometricLogs.length})
          </button>
        </div>
      </section>

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* 3D Register Elector Card */}
      <article className="card form-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--teal-50) 0%, var(--teal-100) 100%)',
              color: 'var(--teal-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(15, 118, 110, 0.15)',
            }}
          >
            <UserPlus size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Register New Voter</h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Issue a new voter ID and initial credentials
            </span>
          </div>
        </div>

        <form
          onSubmit={handleAddVoter}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <label htmlFor="newVoterId">Voter ID</label>
            <input
              id="newVoterId"
              type="text"
              placeholder="e.g. VOT1004"
              value={newVoterId}
              onChange={(e) => setNewVoterId(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="newVoterPassword">Initial Password</label>
            <input
              id="newVoterPassword"
              type="text"
              placeholder="pass123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <button className="btn btn-primary" type="submit" style={{ marginTop: '0', width: '100%' }}>
              Add Voter
            </button>
          </div>
        </form>
      </article>

      {/* 3D Registered Electors Table Card */}
      <article className="card table-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Registered Electors ({voters.length})</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Full electoral roll with live participation &amp; biometric states
              </span>
            </div>

            {/* Segmented Filter Controls */}
            <div
              style={{
                display: 'flex',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '9px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: statusFilter === 'all' ? '#ffffff' : 'transparent',
                  color: statusFilter === 'all' ? '#0f172a' : '#64748b',
                  boxShadow: statusFilter === 'all' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                All ({voters.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('voted')}
                style={{
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '9px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: statusFilter === 'voted' ? '#ffffff' : 'transparent',
                  color: statusFilter === 'voted' ? '#065f46' : '#64748b',
                  boxShadow: statusFilter === 'voted' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Voted ({votedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                style={{
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '9px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: statusFilter === 'pending' ? '#ffffff' : 'transparent',
                  color: statusFilter === 'pending' ? '#92400e' : '#64748b',
                  boxShadow: statusFilter === 'pending' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('enrolled')}
                style={{
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '9px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: statusFilter === 'enrolled' ? '#ffffff' : 'transparent',
                  color: statusFilter === 'enrolled' ? '#0f766e' : '#64748b',
                  boxShadow: statusFilter === 'enrolled' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Face Enrolled ({enrolledCount})
              </button>
            </div>
          </div>

          <div className="search-input-wrap" style={{ maxWidth: 280 }}>
            <span className="search-icon">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by Voter ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table id="votersTable">
            <thead>
              <tr>
                <th>Voter ID</th>
                <th>Voting Status</th>
                <th>Biometric Status</th>
                <th>Security State</th>
                <th>Created Date</th>
                <th>Biometric Recovery</th>
              </tr>
            </thead>
            <tbody>
              {filteredVoters.map((voter) => (
                <tr key={voter.id}>
                  <td style={{ fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#0f172a' }}>
                    {voter.voter_id}
                  </td>
                  <td>
                    {voter.has_voted === 1 ? (
                      <span className="badge badge-voted">
                        <Check size={14} />
                        Voted
                      </span>
                    ) : (
                      <span className="badge badge-pending">
                        <Clock size={14} />
                        Not Voted
                      </span>
                    )}
                  </td>
                  <td>
                    {voter.face_enrolled === 1 ? (
                      <span className="badge badge-voted" style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}>
                        <ShieldCheck size={14} />
                        Enrolled
                      </span>
                    ) : (
                      <span className="badge badge-pending" style={{ background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                        <Camera size={14} />
                        Pending
                      </span>
                    )}
                  </td>
                  <td>
                    {voter.failed_verification_attempts >= 3 ? (
                      <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                        <ShieldAlert size={14} />
                        Locked Out (3/3)
                      </span>
                    ) : voter.failed_verification_attempts > 0 ? (
                      <span className="badge" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                        {voter.failed_verification_attempts} Failed
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Normal</span>
                    )}
                  </td>
                  <td className="date-cell" style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {voter.created_at}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {voter.face_enrolled === 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', height: 'auto', border: '1px solid #cbd5e1' }}
                          title="Reset face template to allow re-enrollment (does not affect vote status)"
                          onClick={() => handleResetFace(voter)}
                        >
                          <RotateCcw size={12} />
                          Reset Face
                        </button>
                      )}
                      {voter.failed_verification_attempts >= 3 && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', height: 'auto', color: '#059669', borderColor: '#a7f3d0' }}
                          title="Unlock failed verification attempts"
                          onClick={() => handleUnlock(voter)}
                        >
                          <Unlock size={12} />
                          Unlock
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredVoters.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    No electors found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* BIOMETRIC AUDIT LOGS MODAL */}
      {showLogsModal && (
        <div className="modal-overlay" onClick={() => setShowLogsModal(false)}>
          <div className="modal-content" style={{ maxWidth: 840 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: '#ecfdf5',
                    color: '#0f766e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Biometric Security Audit Log</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Tamper-evident log of all face enrollment, verification, and lockout events
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowLogsModal(false)}
                style={{ padding: '0.4rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Voter ID</th>
                      <th>Action</th>
                      <th>Score</th>
                      <th>Liveness</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {biometricLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {log.created_at}
                        </td>
                        <td style={{ fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#0f172a' }}>
                          {log.voter_id}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.75rem',
                              background:
                                log.action_type === 'VERIFICATION_SUCCESS' || log.action_type === 'ENROLLMENT'
                                  ? '#d1fae5'
                                  : log.action_type === 'LOCKOUT_TRIGGERED' || log.action_type === 'REPLAY_ATTEMPT_BLOCKED'
                                  ? '#fee2e2'
                                  : '#fef3c7',
                              color:
                                log.action_type === 'VERIFICATION_SUCCESS' || log.action_type === 'ENROLLMENT'
                                  ? '#065f46'
                                  : log.action_type === 'LOCKOUT_TRIGGERED' || log.action_type === 'REPLAY_ATTEMPT_BLOCKED'
                                  ? '#991b1b'
                                  : '#92400e',
                            }}
                          >
                            {log.action_type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          {log.match_score > 0 ? `${(log.match_score * 100).toFixed(0)}%` : '-'}
                        </td>
                        <td>
                          {log.liveness_passed ? (
                            <span style={{ color: '#059669', fontSize: '0.82rem', fontWeight: 700 }}>Pass</span>
                          ) : (
                            <span style={{ color: '#dc2626', fontSize: '0.82rem', fontWeight: 700 }}>Fail</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: '#475569' }}>{log.details}</td>
                      </tr>
                    ))}
                    {biometricLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                          No biometric events recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: 'auto' }}
                onClick={() => setShowLogsModal(false)}
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
