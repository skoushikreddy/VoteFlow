import React, { useState, useEffect } from 'react';
import { votingStore } from './store/votingStore';
import { Session, Candidate, Elector, LiveResultsData, AdminDashboardData } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { VoterLogin } from './components/VoterLogin';
import { VotingScreen } from './components/VotingScreen';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminCandidates } from './components/AdminCandidates';
import { AdminVoters } from './components/AdminVoters';
import { AdminResults } from './components/AdminResults';
import { FaceEnrollment } from './components/FaceEnrollment';
import { FaceVerification } from './components/FaceVerification';

type ViewMode =
  | 'voter-login'
  | 'vote'
  | 'face-enrollment'
  | 'face-verification'
  | 'admin-login'
  | 'admin-dashboard'
  | 'admin-candidates'
  | 'admin-voters'
  | 'admin-results';

function getVoterTargetView(session: Session): ViewMode {
  const electorId = session.elector_id;
  if (!electorId) return 'voter-login';

  // If elector already voted, allow view to see permanent receipt/certificate
  if (votingStore.hasVoted(electorId)) {
    return 'vote';
  }

  const elector = votingStore.getElectorById(electorId);
  if (!elector || elector.face_enrolled !== 1) {
    return 'face-enrollment';
  }

  // Strict check: verified token must exist, match elector's active token, and not be expired
  if (session.verified_face_token && session.verified_token_expires && elector.verification_token) {
    if (session.verified_face_token === elector.verification_token) {
      const expires = new Date(session.verified_token_expires).getTime();
      if (Date.now() < expires) {
        return 'vote';
      }
    }
  }

  return 'face-verification';
}

function getInitialView(session: Session): ViewMode {
  const path = window.location.pathname;

  if (path.includes('admin/login')) {
    return session.role === 'admin' ? 'admin-dashboard' : 'admin-login';
  }
  if (path.includes('admin/candidates')) {
    return session.role === 'admin' ? 'admin-candidates' : 'admin-login';
  }
  if (path.includes('admin/voters')) {
    return session.role === 'admin' ? 'admin-voters' : 'admin-login';
  }
  if (path.includes('admin/results')) {
    return session.role === 'admin' ? 'admin-results' : 'admin-login';
  }
  if (path.includes('admin')) {
    return session.role === 'admin' ? 'admin-dashboard' : 'admin-login';
  }
  if (path.includes('face-enrollment')) {
    return session.role === 'voter' ? 'face-enrollment' : 'voter-login';
  }
  if (path.includes('face-verification')) {
    return session.role === 'voter' ? 'face-verification' : 'voter-login';
  }
  if (path.includes('vote')) {
    return session.role === 'voter' ? getVoterTargetView(session) : 'voter-login';
  }

  // Default root / index.php
  if (session.role === 'voter') {
    return getVoterTargetView(session);
  }
  if (session.role === 'admin') {
    return 'admin-dashboard';
  }
  return 'voter-login';
}

function getPathForView(view: ViewMode): string {
  switch (view) {
    case 'voter-login':
      return '/index.php';
    case 'vote':
      return '/vote.php';
    case 'face-enrollment':
      return '/face-enrollment.php';
    case 'face-verification':
      return '/face-verification.php';
    case 'admin-login':
      return '/admin/login.php';
    case 'admin-dashboard':
      return '/admin/index.php';
    case 'admin-candidates':
      return '/admin/candidates.php';
    case 'admin-voters':
      return '/admin/voters.php';
    case 'admin-results':
      return '/admin/results.php';
    default:
      return '/index.php';
  }
}

export const App: React.FC = () => {
  const [session, setSession] = useState<Session>(() => votingStore.getSession());
  const [currentView, setCurrentView] = useState<ViewMode>(() => getInitialView(session));
  const [candidates, setCandidates] = useState<Candidate[]>(() => votingStore.getCandidates());
  const [voters, setVoters] = useState<Elector[]>(() => votingStore.getVoters());
  const [stats, setStats] = useState<AdminDashboardData>(() => votingStore.getAdminDashboardStats());
  const [results, setResults] = useState<LiveResultsData>(() => votingStore.getLiveResults());
  const [resetKey, setResetKey] = useState<number>(0);

  // Subscribe to store updates
  useEffect(() => {
    const syncData = () => {
      const currentSession = votingStore.getSession();
      setSession(currentSession);
      setCandidates(votingStore.getCandidates());
      setVoters(votingStore.getVoters());
      setStats(votingStore.getAdminDashboardStats());
      setResults(votingStore.getLiveResults());
    };

    const unsubscribe = votingStore.subscribe(syncData);
    return () => unsubscribe();
  }, []);

  // Update browser URL and title based on current view
  const navigateTo = (view: ViewMode) => {
    let effectiveView = view;
    const currentSession = votingStore.getSession();

    // Guard: Prevent bypassing face verification by requesting vote directly
    if (view === 'vote' && currentSession.role === 'voter') {
      effectiveView = getVoterTargetView(currentSession);
    }

    setCurrentView(effectiveView);
    const newPath = getPathForView(effectiveView);
    try {
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
    } catch {
      // ignore
    }

    switch (effectiveView) {
      case 'voter-login':
        document.title = 'VoteFlow — Voter Authentication';
        break;
      case 'vote':
        document.title = 'VoteFlow — Choose Your Candidate';
        break;
      case 'face-enrollment':
        document.title = 'Face Enrollment — VoteFlow';
        break;
      case 'face-verification':
        document.title = 'Face Verification — VoteFlow';
        break;
      case 'admin-login':
        document.title = 'VoteFlow — Administrator Login';
        break;
      case 'admin-dashboard':
        document.title = 'Admin Dashboard — VoteFlow';
        break;
      case 'admin-candidates':
        document.title = 'Candidates — VoteFlow';
        break;
      case 'admin-voters':
        document.title = 'Voters — VoteFlow';
        break;
      case 'admin-results':
        document.title = 'Live Results — VoteFlow';
        break;
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getInitialView(session));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [session]);

  const handleLogout = () => {
    votingStore.logout();
    navigateTo('voter-login');
  };

  const handleRefreshResults = () => {
    setResults(votingStore.getLiveResults());
    setStats(votingStore.getAdminDashboardStats());
  };

  const handleResetData = () => {
    votingStore.resetToDefaultSeed();
    const freshSession = votingStore.getSession();
    setSession(freshSession);
    setCandidates(votingStore.getCandidates());
    setVoters(votingStore.getVoters());
    setStats(votingStore.getAdminDashboardStats());
    setResults(votingStore.getLiveResults());
    setResetKey((prev) => prev + 1);
    navigateTo('voter-login');
  };

  const activeNav = currentView.startsWith('admin-') ? currentView.replace('admin-', '') : '';
  const isAuthPage = currentView === 'voter-login' || currentView === 'admin-login';

  return (
    <div className={isAuthPage ? 'auth-page' : ''}>
      <Header
        key={`header-${resetKey}`}
        session={session}
        activeNav={activeNav}
        onNavigate={(view) => navigateTo(view as ViewMode)}
        onLogout={handleLogout}
      />

      <main className="page">
        {currentView === 'voter-login' && (
          <VoterLogin
            key={`voter-login-${resetKey}`}
            onSuccess={() => navigateTo(getVoterTargetView(votingStore.getSession()))}
            onNavigateToAdmin={() => navigateTo('admin-login')}
          />
        )}

        {currentView === 'face-enrollment' && (
          <FaceEnrollment
            key={`face-enroll-${resetKey}`}
            session={session}
            onEnrollmentComplete={() => navigateTo('face-verification')}
            onCancel={handleLogout}
          />
        )}

        {currentView === 'face-verification' && (
          <FaceVerification
            key={`face-verify-${resetKey}`}
            session={session}
            onVerificationSuccess={(_token) => {
              setSession(votingStore.getSession());
              navigateTo('vote');
            }}
            onNavigateToEnrollment={() => navigateTo('face-enrollment')}
          />
        )}

        {currentView === 'vote' && (
          <VotingScreen
            key={`vote-${resetKey}`}
            session={session}
            candidates={candidates}
            onNavigateToVerification={() => navigateTo('face-verification')}
          />
        )}

        {currentView === 'admin-login' && (
          <AdminLogin
            key={`admin-login-${resetKey}`}
            onSuccess={() => navigateTo('admin-dashboard')}
            onNavigateToVoter={() => navigateTo('voter-login')}
          />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboard
            key={`admin-dash-${resetKey}`}
            stats={stats}
            candidates={candidates}
            onNavigate={(view) => navigateTo(view as ViewMode)}
          />
        )}

        {currentView === 'admin-candidates' && (
          <AdminCandidates key={`admin-cand-${resetKey}`} candidates={candidates} />
        )}

        {currentView === 'admin-voters' && <AdminVoters key={`admin-vot-${resetKey}`} voters={voters} />}

        {currentView === 'admin-results' && (
          <AdminResults key={`admin-res-${resetKey}`} results={results} onRefresh={handleRefreshResults} />
        )}
      </main>

      <Footer
        session={session}
        onNavigate={(view) => navigateTo(view as ViewMode)}
        onResetData={handleResetData}
      />
    </div>
  );
};
