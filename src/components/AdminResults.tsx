import React, { useState } from 'react';
import { LiveResultsData } from '../types';
import { getPartyMeta } from '../services/parties';
import { votingStore } from '../store/votingStore';
import {
  RefreshCw,
  Download,
  Trophy,
  BarChart3,
  Check,
  Award,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';

interface AdminResultsProps {
  results: LiveResultsData;
  onRefresh: () => void;
}

export const AdminResults: React.FC<AdminResultsProps> = ({ results, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleExportCSV = () => {
    const csvContent = votingStore.exportResultsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    link.setAttribute('download', `VoteFlow_Official_Tally_Report_${timestampStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  // Find leader
  const sortedByVotes = [...results.rows].sort((a, b) => b.votes_received - a.votes_received);
  const leader = sortedByVotes.length > 0 && sortedByVotes[0].votes_received > 0 ? sortedByVotes[0] : null;

  return (
    <>
      <section className="page-heading heading-with-action">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
            <BarChart3 size={14} />
            <span>Official Election Tabulation</span>
          </div>
          <h1 id="resultsHeading">Live Results</h1>
          <p>Totals and percentages are calculated directly from stored cast ballots.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            id="downloadReportButton"
            data-testid="download-report-button"
            type="button"
            className="btn btn-ghost"
            onClick={handleExportCSV}
            title="Download official election tally report as CSV for record keeping"
            style={{
              backgroundColor: downloadSuccess ? '#ecfdf5' : '#ffffff',
              color: downloadSuccess ? '#065f46' : '#0f766e',
              border: downloadSuccess ? '1.5px solid #10b981' : '1px solid #cbd5e1',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
            }}
          >
            {downloadSuccess ? (
              <>
                <Check size={16} style={{ color: '#059669' }} />
                <span>Report Downloaded ✓</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Report</span>
              </>
            )}
          </button>
          <button
            id="refreshResults"
            className="btn btn-primary"
            type="button"
            onClick={handleRefreshClick}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Updating...' : 'Refresh Results'}
          </button>
        </div>
      </section>

      {/* 3D Leading Candidate Podium Card */}
      {leader && results.total > 0 && (
        <article
          className="card"
          style={{
            marginBottom: '1.75rem',
            background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 50%, #ffffff 100%)',
            border: '2px solid #a7f3d0',
            boxShadow: '0 16px 36px -8px rgba(16, 185, 129, 0.2), inset 0 1px 0 #ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)',
                  color: '#78350f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                }}
              >
                <Trophy size={32} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0f766e', fontWeight: 800 }}>
                  Projected Election Leader
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  {leader.name}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Party: <strong>{leader.party}</strong> · <strong>{leader.votes_received}</strong> votes tallied
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', background: '#ffffff', padding: '0.75rem 1.4rem', borderRadius: '16px', border: '1px solid #a7f3d0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                Share of Vote
              </span>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f766e', fontFamily: 'JetBrains Mono', lineHeight: 1.1 }}>
                {leader.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </article>
      )}

      {/* 3D Multi-Party Distribution Bar */}
      {results.total > 0 && (
        <article className="card" style={{ marginBottom: '1.75rem', padding: '1.5rem 1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Award size={19} style={{ color: '#0f766e' }} />
            <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>Multi-Party Distribution Breakdown</strong>
          </div>

          <div
            style={{
              display: 'flex',
              height: '18px',
              borderRadius: '999px',
              overflow: 'hidden',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.08)',
            }}
          >
            {results.rows.map((row) => {
              if (row.percentage <= 0) return null;
              const meta = getPartyMeta(row.party);
              return (
                <div
                  key={row.id}
                  style={{
                    width: `${row.percentage}%`,
                    backgroundColor: meta.color,
                    transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  title={`${row.name} (${row.party}): ${row.votes_received} votes (${row.percentage}%)`}
                />
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.25rem',
              marginTop: '1rem',
              fontSize: '0.85rem',
            }}
          >
            {results.rows.map((row) => {
              const meta = getPartyMeta(row.party);
              return (
                <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: meta.color,
                      display: 'inline-block',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                    }}
                  />
                  <span style={{ fontWeight: 700, color: '#334155' }}>{row.party}:</span>
                  <span className="tabular-nums" style={{ color: '#64748b', fontWeight: 600 }}>
                    {row.votes_received} ({row.percentage.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </article>
      )}

      <p className="total-line">
        Total Votes Cast: <strong id="totalVotesCast">{results.total}</strong>
      </p>

      {/* 3D Tabular Results */}
      <article className="card table-card">
        <div className="table-wrap">
          <table id="resultsTable">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Party</th>
                <th>Votes Received</th>
                <th style={{ minWidth: 220 }}>Percentage Share</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.rows.map((row) => {
                const meta = getPartyMeta(row.party);
                return (
                  <tr key={row.id} data-party={row.party}>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>
                      {row.name}
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
                        {row.party}
                      </span>
                    </td>
                    <td className="tabular-nums" style={{ fontWeight: 800, color: '#0f766e', fontSize: '1.15rem' }}>
                      {row.votes_received}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span className="tabular-nums" style={{ fontWeight: 800, color: '#0f172a' }}>
                          {row.percentage.toFixed(2)}%
                        </span>
                      </div>
                      <div className="progress-bar-bg" title={`${row.percentage}%`}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min(100, row.percentage)}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      {row.status === '✓' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#059669', fontWeight: 800, background: '#d1fae5', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.8rem' }}>
                          <Check size={14} /> ✓ Active
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {results.rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No candidates or votes tallied.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* Official Record Keeping & Archival Section */}
      <article
        className="card"
        style={{
          marginTop: '2rem',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdfa 100%)',
          border: '1.5px solid #cbd5e1',
          padding: '1.75rem 2rem',
          boxShadow: '0 10px 25px -5px rgba(15, 118, 110, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
              <ShieldCheck size={16} />
              <span>Official Electoral Record Keeping</span>
            </div>
            <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Election Tally Audit & Archival Export
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
              Export certified tabulation records to a standardized CSV file for statutory record keeping, observer audits, and electoral commission archives. Includes candidate vote totals, voter participation metrics, and cryptographic ledger verification.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
            <button
              id="downloadReportSecondaryButton"
              type="button"
              className="btn btn-primary"
              onClick={handleExportCSV}
              style={{
                background: downloadSuccess ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                color: '#ffffff',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1.4rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
              }}
            >
              <FileSpreadsheet size={18} />
              <span>{downloadSuccess ? 'Report Exported ✓' : 'Download Official Report (.CSV)'}</span>
            </button>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              Format: RFC 4180 / UTF-8 CSV · Excel & Sheets Ready
            </span>
          </div>
        </div>
      </article>
    </>
  );
};
