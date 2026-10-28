export interface Elector {
  id: number;
  voter_id: string;
  password: string; // Plaintext for demo verification against 'pass123'
  has_voted: number; // 0 or 1
  face_enrolled: number; // 0 or 1
  face_template_hash?: string | null;
  face_enrolled_at?: string | null;
  failed_verification_attempts: number;
  verification_token?: string | null;
  token_expires_at?: string | null;
  created_at: string;
}

export interface Candidate {
  id: number;
  name: string;
  party: string;
  vote_count: number;
  created_at: string;
}

export interface Vote {
  id: number;
  elector_id: number;
  candidate_id: number;
  verification_token?: string;
  receipt_code?: string;
  created_at: string;
}

export interface VoteReceipt {
  receiptCode: string;
  voterId: string;
  candidateName: string;
  party: string;
  timestamp: string;
  biometricVerified: boolean;
}

export interface Admin {
  id: number;
  username: string;
  password: string;
  created_at: string;
}

export interface LiveResultRow {
  id: number;
  name: string;
  party: string;
  votes_received: number;
  percentage: number;
  status: string;
}

export interface LiveResultsData {
  total: number;
  rows: LiveResultRow[];
}

export interface AdminDashboardData {
  total_candidates: number;
  total_voters: number;
  total_votes: number;
  voters_yet_to_vote: number;
  turnout_percentage: number;
  total_enrolled_faces: number;
  enrolled_percentage: number;
}

export interface BiometricLog {
  id: number;
  elector_id: number;
  voter_id: string;
  action_type:
    | 'ENROLLMENT'
    | 'VERIFICATION_SUCCESS'
    | 'VERIFICATION_FAILURE'
    | 'REPLAY_ATTEMPT_BLOCKED'
    | 'LOCKOUT_TRIGGERED'
    | 'ADMIN_ENROLLMENT_RESET'
    | 'VOTE_CAST_TOKEN_CONSUMED';
  match_score: number;
  liveness_passed: boolean;
  details: string;
  created_at: string;
}

export interface FaceVerificationResult {
  ok: boolean;
  matchScore: number;
  livenessScore: number;
  verificationToken?: string;
  tokenExpiresAt?: string;
  error?: string;
  attemptsLeft?: number;
  isLockedOut?: boolean;
}

export interface Session {
  role: 'guest' | 'voter' | 'admin';
  elector_id?: number;
  voter_id?: string;
  admin_id?: number;
  admin_username?: string;
  verified_face_token?: string;
  verified_token_expires?: string;
}
