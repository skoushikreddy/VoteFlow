import React, { useState, useMemo } from 'react';
import { Candidate } from '../types';
import { PARTIES, getPartyMeta } from '../services/parties';
import { votingStore } from '../store/votingStore';
import { Plus, Trash2, Search, CheckCircle2, AlertCircle, AlertTriangle, UserPlus } from 'lucide-react';

interface AdminCandidatesProps {
  candidates: Candidate[];
}

export const AdminCandidates: React.FC<AdminCandidatesProps> = ({ candidates }) => {
  const [name, setName] = useState('');
  const [party, setParty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.party.toLowerCase().includes(q) ||
        c.id.toString() === q
    );
  }, [candidates, searchQuery]);

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = votingStore.addCandidate(name, party);
    setIsSubmitting(false);

    if (result.ok) {
      setSuccess('Candidate added successfully.');
      setError(null);
      setName('');
      setParty('');
    } else {
      setError(result.error || 'Unable to add candidate.');
      setSuccess(null);
    }
  };

  const executeDelete = (id: number) => {
    const result = votingStore.deleteCandidate(id);
    setCandidateToDelete(null);
    if (result.ok) {
      setSuccess('Candidate deleted successfully.');
      setError(null);
    } else {
      setError(result.error || 'Unable to delete candidate.');
      setSuccess(null);
    }
  };

  return (
    <>
      <section className="page-heading">
        <h1>Candidates</h1>
        <p>Add, view, or remove candidates. Party names match the ballot exactly.</p>
      </section>

      {success && (
        <div id="candidateSuccess" className="alert alert-success">
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div id="candidateError" className="alert alert-error">
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* 3D Add Candidate Form Card */}
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
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Add candidate</h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Register a new contender on the official ballot roster
            </span>
          </div>
        </div>

        <form id="addCandidateForm" onSubmit={handleAddCandidate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label htmlFor="candidateName">Candidate Name</label>
              <input
                id="candidateName"
                name="name"
                type="text"
                required
                maxLength={120}
                placeholder="Full official name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="candidateParty">Party</label>
              <select
                id="candidateParty"
                name="party"
                required
                value={party}
                onChange={(e) => setParty(e.target.value)}
              >
                <option value="">Select party affiliation</option>
                {PARTIES.map((p) => {
                  const meta = getPartyMeta(p);
                  return (
                    <option key={p} value={p}>
                      {p} — {meta.fullName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <button
            id="addCandidateButton"
            className="btn btn-primary"
            type="submit"
            disabled={isSubmitting}
            style={{ width: 'auto', marginTop: '1.4rem' }}
          >
            <Plus size={18} />
            {isSubmitting ? 'Registering Candidate...' : 'Add Candidate'}
          </button>
        </form>
      </article>

      {/* 3D Current Candidates Table Card */}
      <article className="card table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Current candidates ({candidates.length})</h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Verified roster of all active contenders
            </span>
          </div>

          <div className="search-input-wrap" style={{ maxWidth: 300 }}>
            <span className="search-icon">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search candidate or party..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table id="candidatesTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Candidate</th>
                <th>Party</th>
                <th>Votes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate) => {
                const meta = getPartyMeta(candidate.party);
                return (
                  <tr key={candidate.id}>
                    <td className="tabular-nums" style={{ color: '#64748b', fontWeight: 700 }}>
                      #{candidate.id}
                    </td>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>
                      {candidate.name}
                    </td>
                    <td>
                      <span
                        className="party-badge"
                        style={{
                          margin: 0,
                          backgroundColor: meta.badgeBg,
                          color: meta.badgeText,
                          border: `1px solid ${meta.color}33`,
                        }}
                      >
                        {candidate.party}
                      </span>
                    </td>
                    <td className="tabular-nums" style={{ fontWeight: 800, color: '#0f766e', fontSize: '1.1rem' }}>
                      {candidate.vote_count}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        id={`delete-candidate-${candidate.id}`}
                        className="btn btn-danger"
                        type="button"
                        onClick={() => executeDelete(candidate.id)}
                        title={candidate.vote_count > 0 ? 'Cannot delete candidate with votes' : 'Delete candidate'}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    {searchQuery ? 'No candidates match your search.' : 'No candidates registered yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* Delete Confirmation Modal */}
      {candidateToDelete && (
        <div className="modal-overlay" onClick={() => setCandidateToDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={26} />
              </div>
              <div>
                <h3>Delete Candidate</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Irreversible ballot modification
                </span>
              </div>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to remove <strong>{candidateToDelete.name}</strong> ({candidateToDelete.party})?
              </p>
              {candidateToDelete.vote_count > 0 && (
                <div className="alert alert-error" style={{ margin: '0.75rem 0' }}>
                  Cannot delete a candidate who already has votes!
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setCandidateToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ width: 'auto', margin: 0, padding: '0.75rem 1.4rem' }}
                onClick={() => executeDelete(candidateToDelete.id)}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
