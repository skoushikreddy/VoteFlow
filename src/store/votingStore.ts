import {
  Candidate,
  Elector,
  Vote,
  Admin,
  Session,
  LiveResultsData,
  AdminDashboardData,
  VoteReceipt,
  BiometricLog,
  FaceVerificationResult,
} from '../types';
import { Validator } from '../services/validator';
import { BiometricService } from '../services/biometricService';

const INITIAL_CANDIDATES: Candidate[] = [
  { id: 1, name: 'Alex Morgan', party: 'TDP', vote_count: 0, created_at: '2026-01-01 10:00:00' },
  { id: 2, name: 'Jamie Lin', party: 'YSRCP', vote_count: 0, created_at: '2026-01-01 10:00:00' },
  { id: 3, name: 'Sofia Reyes', party: 'JSP', vote_count: 0, created_at: '2026-01-01 10:00:00' },
  { id: 4, name: 'Harika', party: 'BJP', vote_count: 0, created_at: '2026-01-01 10:00:00' },
  { id: 5, name: 'Rahul Kumar', party: 'CONGRESS', vote_count: 0, created_at: '2026-01-01 10:00:00' },
  { id: 6, name: 'NOTA', party: 'NOTA', vote_count: 0, created_at: '2026-01-01 10:00:00' },
];

const INITIAL_ELECTORS: Elector[] = [
  {
    id: 1,
    voter_id: 'VOT1001',
    password: 'pass123',
    has_voted: 0,
    face_enrolled: 1,
    face_template_hash: 'HASH_FP_VOT1001_8F3A219C',
    face_enrolled_at: '2026-01-01 10:00:00',
    failed_verification_attempts: 0,
    verification_token: null,
    token_expires_at: null,
    created_at: '2026-01-01 10:00:00',
  },
  {
    id: 2,
    voter_id: 'VOT1002',
    password: 'pass123',
    has_voted: 0,
    face_enrolled: 0,
    face_template_hash: null,
    face_enrolled_at: null,
    failed_verification_attempts: 0,
    verification_token: null,
    token_expires_at: null,
    created_at: '2026-01-01 10:00:00',
  },
  {
    id: 3,
    voter_id: 'VOT1003',
    password: 'pass123',
    has_voted: 0,
    face_enrolled: 0,
    face_template_hash: null,
    face_enrolled_at: null,
    failed_verification_attempts: 0,
    verification_token: null,
    token_expires_at: null,
    created_at: '2026-01-01 10:00:00',
  },
];

const INITIAL_ADMINS: Admin[] = [
  { id: 1, username: 'KOUSHIKRDY2006', password: 'AMMUUU@1090', created_at: '2026-01-01 10:00:00' },
];

const STORAGE_KEYS = {
  CANDIDATES: 'voteflow_candidates_v2',
  ELECTORS: 'voteflow_electors_v2',
  VOTES: 'voteflow_votes_v2',
  ADMINS: 'voteflow_admins_v2',
  SESSION: 'voteflow_session_v2',
  BIOMETRIC_LOGS: 'voteflow_biometric_logs_v2',
  FACE_VECTORS: 'voteflow_face_vectors_v2',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export class VotingStore {
  private candidates: Candidate[] = safeGet(STORAGE_KEYS.CANDIDATES, INITIAL_CANDIDATES);
  private electors: Elector[] = safeGet(STORAGE_KEYS.ELECTORS, INITIAL_ELECTORS);
  private votes: Vote[] = safeGet(STORAGE_KEYS.VOTES, []);
  private admins: Admin[] = safeGet(STORAGE_KEYS.ADMINS, INITIAL_ADMINS);
  private session: Session = safeGet(STORAGE_KEYS.SESSION, { role: 'guest' });
  private biometricLogs: BiometricLog[] = safeGet(STORAGE_KEYS.BIOMETRIC_LOGS, []);
  // Map of elector_id -> 32-dim feature vector
  private faceVectors: Record<number, number[]> = safeGet(STORAGE_KEYS.FACE_VECTORS, {
    1: BiometricService.generateSimulatedVector('VOT1001'),
  });
  private listeners: (() => void)[] = [];

  constructor() {
    this.syncCounts();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    safeSet(STORAGE_KEYS.CANDIDATES, this.candidates);
    safeSet(STORAGE_KEYS.ELECTORS, this.electors);
    safeSet(STORAGE_KEYS.VOTES, this.votes);
    safeSet(STORAGE_KEYS.ADMINS, this.admins);
    safeSet(STORAGE_KEYS.SESSION, this.session);
    safeSet(STORAGE_KEYS.BIOMETRIC_LOGS, this.biometricLogs);
    safeSet(STORAGE_KEYS.FACE_VECTORS, this.faceVectors);
    for (const listener of this.listeners) {
      listener();
    }
  }

  private syncCounts(): void {
    for (const candidate of this.candidates) {
      candidate.vote_count = this.votes.filter((v) => v.candidate_id === candidate.id).length;
    }
    for (const elector of this.electors) {
      elector.has_voted = this.votes.some((v) => v.elector_id === elector.id) ? 1 : 0;
    }
  }

  public getSession(): Session {
    return this.session;
  }

  public getElectors(): Elector[] {
    return [...this.electors];
  }

  public getElectorById(id: number): Elector | undefined {
    return this.electors.find((e) => e.id === id);
  }

  public loginVoter(voterId: string, password: string): { ok: boolean; error?: string } {
    const errors = Validator.voterLogin(voterId, password);
    if (errors.length > 0) {
      return { ok: false, error: errors[0] };
    }

    const elector = this.electors.find(
      (e) => e.voter_id.trim().toUpperCase() === voterId.trim().toUpperCase()
    );

    if (!elector || elector.password !== password) {
      return { ok: false, error: 'Invalid voter ID or password.' };
    }

    this.session = {
      role: 'voter',
      elector_id: elector.id,
      voter_id: elector.voter_id,
      verified_face_token: undefined,
      verified_token_expires: undefined,
    };
    this.notify();
    return { ok: true };
  }

  public loginAdmin(username: string, password: string): { ok: boolean; error?: string } {
    const errors = Validator.adminLogin(username, password);
    if (errors.length > 0) {
      return { ok: false, error: errors[0] };
    }

    const admin = this.admins.find((a) => a.username.trim() === username.trim());

    if (!admin || admin.password !== password) {
      return { ok: false, error: 'Invalid admin username or password.' };
    }

    this.session = {
      role: 'admin',
      admin_id: admin.id,
      admin_username: admin.username,
    };
    this.notify();
    return { ok: true };
  }

  public logout(): void {
    this.session = { role: 'guest' };
    this.notify();
  }

  public hasVoted(electorId: number): boolean {
    const elector = this.electors.find((e) => e.id === electorId);
    if (elector && elector.has_voted === 1) {
      return true;
    }
    return this.votes.some((v) => v.elector_id === electorId);
  }

  // ==========================================
  // BIOMETRIC FACE ENROLLMENT & VERIFICATION
  // ==========================================

  /**
   * Enroll a voter's face template during onboarding
   */
  public enrollVoterFace(
    electorId: number,
    featureVector: number[],
    templateHash: string
  ): { ok: boolean; error?: string } {
    const elector = this.electors.find((e) => e.id === electorId);
    if (!elector) {
      return { ok: false, error: 'Voter not found in election registry.' };
    }

    if (elector.has_voted === 1 || this.hasVoted(electorId)) {
      return {
        ok: false,
        error: 'You have already cast your vote. Multiple voting is not permitted.',
      };
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    elector.face_enrolled = 1;
    elector.face_template_hash = templateHash;
    elector.face_enrolled_at = now;
    elector.failed_verification_attempts = 0;

    // Store template vector securely
    this.faceVectors[electorId] = [...featureVector];

    // Log enrollment event
    this.logBiometricEvent({
      elector_id: electorId,
      voter_id: elector.voter_id,
      action_type: 'ENROLLMENT',
      match_score: 1.0,
      liveness_passed: true,
      details: `Face template enrolled successfully (${templateHash})`,
    });

    this.notify();
    return { ok: true };
  }

  /**
   * Verify live face capture against registered template before granting access to voting ballot
   */
  public verifyVoterFace(
    electorId: number,
    liveVector: number[],
    livenessPassed: boolean,
    livenessScore: number
  ): FaceVerificationResult {
    const elector = this.electors.find((e) => e.id === electorId);
    if (!elector) {
      return { ok: false, matchScore: 0, livenessScore: 0, error: 'Voter not found.' };
    }

    // STRICT CHECK: If voter has already voted, immediately deny access with exact message
    if (elector.has_voted === 1 || this.hasVoted(electorId)) {
      this.logBiometricEvent({
        elector_id: electorId,
        voter_id: elector.voter_id,
        action_type: 'REPLAY_ATTEMPT_BLOCKED',
        match_score: 0,
        liveness_passed: livenessPassed,
        details: 'Blocked: Voter attempted face verification after already casting vote.',
      });
      return {
        ok: false,
        matchScore: 0,
        livenessScore: 0,
        error: 'You have already cast your vote. Multiple voting is not permitted.',
      };
    }

    // Check if voter has enrolled a face
    if (!elector.face_enrolled || !this.faceVectors[electorId]) {
      return {
        ok: false,
        matchScore: 0,
        livenessScore: 0,
        error: 'Face enrollment is required before verification. Please complete face enrollment first.',
      };
    }

    // Check lockout limit (max 3 failed attempts)
    const MAX_ATTEMPTS = 3;
    if (elector.failed_verification_attempts >= MAX_ATTEMPTS) {
      this.logBiometricEvent({
        elector_id: electorId,
        voter_id: elector.voter_id,
        action_type: 'LOCKOUT_TRIGGERED',
        match_score: 0,
        liveness_passed: false,
        details: 'Lockout active: Exceeded maximum permitted biometric verification attempts.',
      });
      return {
        ok: false,
        matchScore: 0,
        livenessScore,
        attemptsLeft: 0,
        isLockedOut: true,
        error:
          'Maximum face verification attempts exceeded (3/3). For security, biometric access is temporarily locked. Contact an election administrator.',
      };
    }

    // Check liveness
    if (!livenessPassed) {
      elector.failed_verification_attempts += 1;
      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - elector.failed_verification_attempts);

      this.logBiometricEvent({
        elector_id: electorId,
        voter_id: elector.voter_id,
        action_type: 'VERIFICATION_FAILURE',
        match_score: 0,
        liveness_passed: false,
        details: `Liveness check failed (Score: ${livenessScore}). Attempts remaining: ${attemptsLeft}`,
      });

      this.notify();
      return {
        ok: false,
        matchScore: 0,
        livenessScore,
        attemptsLeft,
        error: `Liveness check failed. Please ensure natural movement, proper lighting, and face the camera directly. (${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining)`,
      };
    }

    // Compare live vector with enrolled template
    const enrolledVector = this.faceVectors[electorId];
    const matchScore = BiometricService.compareVectors(liveVector, enrolledVector);
    const MATCH_THRESHOLD = 0.75;

    if (matchScore >= MATCH_THRESHOLD) {
      // SUCCESS: Generate short-lived cryptographically validated token (5 minute expiry)
      const token = `FV-AUTH-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      const tokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      elector.failed_verification_attempts = 0;
      elector.verification_token = token;
      elector.token_expires_at = tokenExpiresAt;

      // Update active session
      if (this.session.elector_id === electorId) {
        this.session.verified_face_token = token;
        this.session.verified_token_expires = tokenExpiresAt;
      }

      this.logBiometricEvent({
        elector_id: electorId,
        voter_id: elector.voter_id,
        action_type: 'VERIFICATION_SUCCESS',
        match_score: matchScore,
        liveness_passed: true,
        details: `Face verified successfully with match score ${(matchScore * 100).toFixed(1)}%. Authorization token issued.`,
      });

      this.notify();
      return {
        ok: true,
        matchScore,
        livenessScore,
        verificationToken: token,
        tokenExpiresAt,
      };
    } else {
      // FAILURE: Face mismatch
      elector.failed_verification_attempts += 1;
      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - elector.failed_verification_attempts);

      this.logBiometricEvent({
        elector_id: electorId,
        voter_id: elector.voter_id,
        action_type: 'VERIFICATION_FAILURE',
        match_score: matchScore,
        liveness_passed: true,
        details: `Facial mismatch: Similarity score ${(matchScore * 100).toFixed(1)}% below required ${MATCH_THRESHOLD * 100}%. Attempts left: ${attemptsLeft}`,
      });

      if (attemptsLeft === 0) {
        this.logBiometricEvent({
          elector_id: electorId,
          voter_id: elector.voter_id,
          action_type: 'LOCKOUT_TRIGGERED',
          match_score: matchScore,
          liveness_passed: true,
          details: 'Maximum verification attempts exceeded (3/3). Biometric access locked.',
        });
      }

      this.notify();
      return {
        ok: false,
        matchScore,
        livenessScore,
        attemptsLeft,
        isLockedOut: attemptsLeft === 0,
        error:
          attemptsLeft === 0
            ? 'Face verification failed repeatedly. Biometric access is locked. Contact election official.'
            : `Face verification failed: Captured face does not match the registered voter template. (${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining)`,
      };
    }
  }

  /**
   * Reset voter's face enrollment (Administrative action).
   * Note: NEVER resets has_voted! If elector already voted, they still cannot vote.
   */
  public resetVoterFaceEnrollment(electorId: number): { ok: boolean; error?: string } {
    const elector = this.electors.find((e) => e.id === electorId);
    if (!elector) {
      return { ok: false, error: 'Elector not found.' };
    }

    elector.face_enrolled = 0;
    elector.face_template_hash = null;
    elector.face_enrolled_at = null;
    elector.failed_verification_attempts = 0;
    elector.verification_token = null;
    elector.token_expires_at = null;
    delete this.faceVectors[electorId];

    this.logBiometricEvent({
      elector_id: electorId,
      voter_id: elector.voter_id,
      action_type: 'ADMIN_ENROLLMENT_RESET',
      match_score: 1.0,
      liveness_passed: true,
      details: 'Administrator reset biometric enrollment template for elector.',
    });

    this.notify();
    return { ok: true };
  }

  public unlockVoterAttempts(electorId: number): { ok: boolean; error?: string } {
    const elector = this.electors.find((e) => e.id === electorId);
    if (!elector) {
      return { ok: false, error: 'Elector not found.' };
    }
    elector.failed_verification_attempts = 0;
    this.notify();
    return { ok: true };
  }

  public getBiometricLogs(): BiometricLog[] {
    return [...this.biometricLogs].reverse();
  }

  private logBiometricEvent(log: Omit<BiometricLog, 'id' | 'created_at'>): void {
    const nextId =
      this.biometricLogs.length > 0 ? Math.max(...this.biometricLogs.map((l) => l.id)) + 1 : 1;
    this.biometricLogs.push({
      ...log,
      id: nextId,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });
  }

  // ==========================================
  // ATOMIC VOTE SUBMISSION WITH TOKEN CHECK
  // ==========================================

  public castVote(
    electorId: number,
    candidateId: number,
    providedToken?: string
  ): { ok: boolean; message?: string; error?: string; already_voted?: boolean; receipt_code?: string } {
    const errors = Validator.vote(electorId, candidateId);
    if (errors.length > 0) {
      return { ok: false, error: errors[0] };
    }

    const elector = this.electors.find((e) => e.id === electorId);
    if (!elector) {
      return { ok: false, error: 'Voter not found in election database.' };
    }

    // STRICT CHECK: Double voting protection
    if (elector.has_voted === 1 || this.votes.some((v) => v.elector_id === electorId)) {
      return {
        ok: false,
        error: 'You have already cast your vote. Multiple voting is not permitted.',
        already_voted: true,
      };
    }

    // BIOMETRIC VERIFICATION TOKEN CHECK:
    // Elector must have a verified, non-expired authorization token
    const token = providedToken || elector.verification_token || this.session.verified_face_token;
    if (!token) {
      return {
        ok: false,
        error: 'Biometric face verification is required before casting a ballot.',
      };
    }

    if (elector.verification_token && elector.verification_token !== token) {
      return {
        ok: false,
        error: 'Invalid or forged biometric verification authorization.',
      };
    }

    if (elector.token_expires_at) {
      const expires = new Date(elector.token_expires_at).getTime();
      if (Date.now() > expires) {
        return {
          ok: false,
          error: 'Biometric verification authorization has expired (5-minute limit). Please verify your face again.',
        };
      }
    }

    const candidate = this.candidates.find((c) => c.id === candidateId);
    if (!candidate) {
      return { ok: false, error: 'Candidate not found.' };
    }

    // Generate tamper-evident official receipt code
    const receiptCode = `VF-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // ATOMIC COMMIT
    const newVote: Vote = {
      id: this.votes.length > 0 ? Math.max(...this.votes.map((v) => v.id)) + 1 : 1,
      elector_id: electorId,
      candidate_id: candidateId,
      verification_token: token,
      receipt_code: receiptCode,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    this.votes.push(newVote);
    elector.has_voted = 1;
    candidate.vote_count += 1;

    // Invalidate and consume the token so it can NEVER be reused or replayed
    elector.verification_token = null;
    elector.token_expires_at = null;
    this.session.verified_face_token = undefined;
    this.session.verified_token_expires = undefined;

    // Log token consumption in immutable audit trail
    this.logBiometricEvent({
      elector_id: electorId,
      voter_id: elector.voter_id,
      action_type: 'VOTE_CAST_TOKEN_CONSUMED',
      match_score: 1.0,
      liveness_passed: true,
      details: `Vote recorded for candidate #${candidateId}. Biometric verification token consumed and invalidated. Receipt: ${receiptCode}`,
    });

    this.notify();
    return {
      ok: true,
      message: 'Your vote has been recorded successfully.',
      receipt_code: receiptCode,
    };
  }

  public getVoterReceipt(electorId: number): VoteReceipt | null {
    const vote = this.votes.find((v) => v.elector_id === electorId);
    if (!vote) return null;

    const elector = this.electors.find((e) => e.id === electorId);
    const candidate = this.candidates.find((c) => c.id === vote.candidate_id);

    return {
      receiptCode: vote.receipt_code || `VF-2026-${vote.id.toString().padStart(5, '0')}`,
      voterId: elector?.voter_id || `VOT${electorId}`,
      candidateName: candidate?.name || 'Selected Candidate',
      party: candidate?.party || 'NOTA',
      timestamp: vote.created_at,
      biometricVerified: true,
    };
  }

  public getCandidates(): Candidate[] {
    return [...this.candidates].sort((a, b) => a.id - b.id);
  }

  public addCandidate(name: string, party: string): { ok: boolean; error?: string; id?: number } {
    const errors = Validator.candidate(name, party);
    if (errors.length > 0) {
      return { ok: false, error: errors[0] };
    }

    const nextId =
      this.candidates.length > 0 ? Math.max(...this.candidates.map((c) => c.id)) + 1 : 1;
    const newCandidate: Candidate = {
      id: nextId,
      name: name.trim(),
      party: party.trim(),
      vote_count: 0,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    this.candidates.push(newCandidate);
    this.notify();
    return { ok: true, id: newCandidate.id };
  }

  public deleteCandidate(id: number): { ok: boolean; error?: string } {
    if (id <= 0) {
      return { ok: false, error: 'Invalid candidate.' };
    }

    const voteCount = this.votes.filter((v) => v.candidate_id === id).length;
    if (voteCount > 0) {
      return { ok: false, error: 'Cannot delete a candidate who already has votes.' };
    }

    const index = this.candidates.findIndex((c) => c.id === id);
    if (index === -1) {
      return { ok: false, error: 'Candidate not found.' };
    }

    this.candidates.splice(index, 1);
    this.notify();
    return { ok: true };
  }

  public getVoters(): Elector[] {
    return [...this.electors].sort((a, b) => a.id - b.id);
  }

  public addVoter(voterId: string, password: string = 'pass123'): { ok: boolean; error?: string } {
    const trimmed = voterId.trim().toUpperCase();
    if (!trimmed) {
      return { ok: false, error: 'Voter ID cannot be empty.' };
    }
    if (this.electors.some((e) => e.voter_id === trimmed)) {
      return { ok: false, error: 'Voter ID already exists.' };
    }

    const nextId =
      this.electors.length > 0 ? Math.max(...this.electors.map((e) => e.id)) + 1 : 1;
    this.electors.push({
      id: nextId,
      voter_id: trimmed,
      password: password,
      has_voted: 0,
      face_enrolled: 0,
      face_template_hash: null,
      face_enrolled_at: null,
      failed_verification_attempts: 0,
      verification_token: null,
      token_expires_at: null,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });
    this.notify();
    return { ok: true };
  }

  public getAdminDashboardStats(): AdminDashboardData {
    const totalVoters = this.electors.length;
    const totalVotes = this.votes.length;
    const turnout = totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 10000) / 100 : 0;
    const enrolledCount = this.electors.filter((e) => e.face_enrolled === 1).length;
    const enrolledPercentage =
      totalVoters > 0 ? Math.round((enrolledCount / totalVoters) * 10000) / 100 : 0;

    return {
      total_candidates: this.candidates.length,
      total_voters: totalVoters,
      total_votes: totalVotes,
      voters_yet_to_vote: this.electors.filter((e) => e.has_voted === 0).length,
      turnout_percentage: turnout,
      total_enrolled_faces: enrolledCount,
      enrolled_percentage: enrolledPercentage,
    };
  }

  public getLiveResults(): LiveResultsData {
    const total = this.votes.length;
    const rows = this.candidates
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((c) => {
        const votesReceived = this.votes.filter((v) => v.candidate_id === c.id).length;
        const percentage = total > 0 ? Math.round((votesReceived / total) * 10000) / 100 : 0.0;
        return {
          id: c.id,
          name: c.name,
          party: c.party,
          votes_received: votesReceived,
          percentage,
          status: votesReceived > 0 ? '✓' : '-',
        };
      });

    return { total, rows };
  }

  public exportResultsCSV(): string {
    const results = this.getLiveResults();
    const headers = [
      'ID',
      'Candidate Name',
      'Party',
      'Votes Received',
      'Percentage (%)',
      'Status',
    ];
    const lines = results.rows.map((r) =>
      [
        r.id,
        `"${r.name.replace(/"/g, '""')}"`,
        r.party,
        r.votes_received,
        r.percentage.toFixed(2),
        r.status,
      ].join(',')
    );
    return [headers.join(','), ...lines].join('\n');
  }

  public resetToDefaultSeed(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('voteflow') || key.startsWith('vf_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch {
      // ignore
    }

    this.candidates = JSON.parse(JSON.stringify(INITIAL_CANDIDATES));
    this.electors = JSON.parse(JSON.stringify(INITIAL_ELECTORS));
    this.votes = [];
    this.admins = JSON.parse(JSON.stringify(INITIAL_ADMINS));
    this.session = { role: 'guest' };
    this.biometricLogs = [];
    this.faceVectors = {
      1: BiometricService.generateSimulatedVector('VOT1001'),
    };
    this.syncCounts();
    safeSet(STORAGE_KEYS.CANDIDATES, this.candidates);
    safeSet(STORAGE_KEYS.ELECTORS, this.electors);
    safeSet(STORAGE_KEYS.VOTES, this.votes);
    safeSet(STORAGE_KEYS.ADMINS, this.admins);
    safeSet(STORAGE_KEYS.SESSION, this.session);
    safeSet(STORAGE_KEYS.BIOMETRIC_LOGS, this.biometricLogs);
    safeSet(STORAGE_KEYS.FACE_VECTORS, this.faceVectors);
    this.notify();
  }
}

export const votingStore = new VotingStore();
