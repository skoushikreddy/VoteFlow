import React, { useState } from 'react';
import { Candidate, Session, VoteReceipt } from '../types';
import { votingStore } from '../store/votingStore';
import { getPartyMeta } from '../services/parties';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  FileCheck,
  Check,
  Printer,
  Calendar,
  Lock,
} from 'lucide-react';

interface VotingScreenProps {
  session: Session;
  candidates: Candidate[];
  onNavigateToVerification?: () => void;
}

export const VotingScreen: React.FC<VotingScreenProps> = ({ session, candidates, onNavigateToVerification }) => {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [receipt, setReceipt] = useState<VoteReceipt | null>(() => {
    return session.elector_id ? votingStore.getVoterReceipt(session.elector_id) : null;
  });

  const electorId = session.elector_id || 0;
  const elector = electorId ? votingStore.getElectorById(electorId) : undefined;
  const alreadyVoted = electorId > 0 && votingStore.hasVoted(electorId);

  // Biometric Authorization Verification Gate:
  // Elector MUST possess a matching, active, non-expired verification token
  const isBiometricallyAuthorized = Boolean(
    session.verified_face_token &&
    session.verified_token_expires &&
    elector?.verification_token === session.verified_face_token &&
    new Date(session.verified_token_expires).getTime() > Date.now()
  );

  const handleOpenConfirm = (candidate: Candidate) => {
    if (alreadyVoted || isSubmitting) return;

    if (!isBiometricallyAuthorized) {
      setError('Biometric face verification is required before selecting a candidate and casting a ballot.');
      return;
    }

    setSelectedCandidate(candidate);
    setShowConfirmModal(true);
    setError(null);
  };

  const handleCastConfirmedVote = (candidateId?: number) => {
    const targetCandidateId = candidateId || selectedCandidate?.id;
    if (!targetCandidateId || alreadyVoted || isSubmitting) return;

    if (!isBiometricallyAuthorized) {
      setError('Biometric face verification token has expired or is invalid. Please verify your face again.');
      setShowConfirmModal(false);
      return;
    }

    setIsSubmitting(true);
    setShowConfirmModal(false);
    setError(null);

    setTimeout(() => {
      const result = votingStore.castVote(electorId, targetCandidateId, session.verified_face_token);
      setIsSubmitting(false);

      if (result.ok) {
        setSuccess(result.message || 'Your vote has been recorded successfully.');
        setError(null);
        if (electorId) {
          setReceipt(votingStore.getVoterReceipt(electorId));
        }
      } else {
        setError(result.error || 'Unable to record vote.');
      }
    }, 200);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* 3D PERSONALIZED VOTER DASHBOARD HERO */}
      <section className="voter-portal-hero">
        <div className="voter-hero-content">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              <Calendar size={15} />
              <span>General Assembly Election 2026</span>
            </div>
            <h1>Choose Your Candidate</h1>
            <p>
              Review the certified ballot candidates below and select your preferred representative.
              Each registered voter is entitled to exactly one ballot.
            </p>
          </div>

          <div className="voter-status-badge-3d">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: alreadyVoted ? '#d1fae5' : '#fef3c7',
                color: alreadyVoted ? '#065f46' : '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
              }}
            >
              {alreadyVoted ? <ShieldCheck size={20} /> : <Lock size={20} />}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85 }}>
                Elector Status
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>
                {alreadyVoted ? 'Ballot Cast & Recorded' : 'Eligible — 1 Ballot Active'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEEDBACK NOTIFICATIONS */}
      {success && (
        <div id="voteSuccessMessage" className="alert alert-success">
          <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
          <div>
            <strong>Success: </strong>
            <span>{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div id="voteErrorMessage" className="alert alert-error">
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div>
            <strong>Notice: </strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {alreadyVoted && (
        <>
          <div id="alreadyVotedMessage" className="alert alert-warning">
            <AlertTriangle size={22} style={{ flexShrink: 0 }} />
            <div>
              <strong>Voting Locked: </strong>
              <span>You have already cast your vote. Multiple voting is not permitted.</span>
            </div>
          </div>
          <p className="locked-note">You cannot select another candidate.</p>

          {/* 3D OFFICIAL DIGITAL VOTER CERTIFICATE */}
          {receipt && (
            <article className="official-certificate-3d">
              <div className="certificate-header-3d">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div className="certificate-seal-badge">
                    <img
                      src="/src/assets/images/election_seal_3d_1792847140341.jpg"
                      alt="Official 3D Election Seal Medal"
                      className="certificate-seal-img"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0f766e', fontWeight: 800 }}>
                      Government Digital Electoral Commission
                    </span>
                    <h3 style={{ margin: '0.15rem 0 0.35rem', fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
                      Official Elector Certificate &amp; Ballot Receipt
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                      Cryptographically verified with face biometrics and stored permanently in the secure election ledger.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span className="badge badge-voted">
                    <ShieldCheck size={14} />
                    Biometrically Verified
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handlePrint}
                    title="Print voter receipt"
                    style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
                  >
                    <Printer size={15} />
                    Print Receipt
                  </button>
                </div>
              </div>

              <div className="certificate-grid-3d">
                <div className="certificate-cell">
                  <span>Receipt Hash</span>
                  <strong>{receipt.receiptCode}</strong>
                </div>
                <div className="certificate-cell">
                  <span>Registered Elector</span>
                  <strong>{receipt.voterId}</strong>
                </div>
                <div className="certificate-cell">
                  <span>Timestamp Recorded</span>
                  <strong>{receipt.timestamp}</strong>
                </div>
                <div className="certificate-cell">
                  <span>Candidate Selection</span>
                  <strong style={{ color: '#0f766e' }}>
                    {receipt.candidateName} ({receipt.party})
                  </strong>
                </div>
              </div>
            </article>
          )}
        </>
      )}

      {!alreadyVoted && !isBiometricallyAuthorized && (
        <div id="biometricRequiredMessage" className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <Lock size={22} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <strong>Biometric Verification Required: </strong>
              <span>You must verify your face before selecting a candidate or submitting a ballot.</span>
            </div>
            {onNavigateToVerification && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onNavigateToVerification}
                style={{ width: 'auto', padding: '0.45rem 1rem', fontSize: '0.85rem', margin: 0 }}
              >
                Verify Face Now &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3D CANDIDATE BALLOT GRID */}
      <section id="candidateList" className="candidate-grid">
        {candidates.map((candidate, index) => {
          const buttonId = `vote-button-${index + 1}`;
          const isVoteDisabled = alreadyVoted || isSubmitting || !isBiometricallyAuthorized;
          const meta = getPartyMeta(candidate.party);

          return (
            <article
              key={candidate.id}
              className="candidate-card"
              data-party={candidate.party}
              style={
                {
                  '--party-color': meta.color,
                } as React.CSSProperties
              }
            >
              <div className="candidate-card-header">
                <div
                  className="candidate-avatar"
                  style={{
                    backgroundColor: meta.badgeBg,
                    color: meta.color,
                  }}
                >
                  {candidate.name.charAt(0)}
                </div>

                <h2>{candidate.name}</h2>

                <div
                  className="party-badge"
                  style={{
                    backgroundColor: meta.badgeBg,
                    color: meta.badgeText,
                    border: `1px solid ${meta.color}44`,
                  }}
                >
                  <span>{candidate.party}</span>
                  <span style={{ fontSize: '0.78rem', opacity: 0.85 }}>({meta.symbol})</span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {meta.fullName}
                </div>
              </div>

              {alreadyVoted ? (
                <button
                  id={buttonId}
                  className="btn btn-disabled"
                  type="button"
                  disabled
                  data-party={candidate.party}
                >
                  Vote Cast
                </button>
              ) : (
                <button
                  id={buttonId}
                  className="btn btn-primary vote-now"
                  type="button"
                  disabled={isVoteDisabled}
                  data-party={candidate.party}
                  onClick={() => handleOpenConfirm(candidate)}
                >
                  {isSubmitting ? 'Submitting...' : 'Vote Now'}
                </button>
              )}
            </article>
          );
        })}
      </section>

      {/* 3D CONFIRMATION REVIEW MODAL */}
      {showConfirmModal && selectedCandidate && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)',
                }}
              >
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3>Confirm Your Vote</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Please review your ballot choice before final submission
                </span>
              </div>
            </div>

            <div className="modal-body">
              <div
                style={{
                  padding: '1.25rem',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                  border: '1.5px solid #a7f3d0',
                  borderRadius: '16px',
                  marginBottom: '1.25rem',
                  boxShadow: '0 4px 12px rgba(15, 118, 110, 0.08)',
                }}
              >
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0f766e', fontWeight: 800 }}>
                  Selected Candidate
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                  {selectedCandidate.name}
                </div>
                <div style={{ color: '#0f766e', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.35rem' }}>
                  Party: {selectedCandidate.party} — {getPartyMeta(selectedCandidate.party).fullName}
                </div>
              </div>

              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  color: '#991b1b',
                  fontSize: '0.88rem',
                  lineHeight: 1.45,
                }}
              >
                <strong>Security Rule:</strong> By electoral law, each authenticated voter may only cast a single ballot.
                Once confirmed, this submission is permanent and cannot be modified.
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowConfirmModal(false)}
              >
                Review Ballot
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: 'auto', margin: 0 }}
                onClick={() => handleCastConfirmedVote()}
              >
                <Check size={18} />
                Confirm &amp; Cast Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
