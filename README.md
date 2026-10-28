# VoteFlow — Web-Based Online Voting System with Face Verification & One-Person-One-Vote Security

VoteFlow is an enterprise-grade digital election application built with React, TypeScript, and Vite, featuring a **3D Creative Visual System**, **Browser Biometric Face Verification**, and a cryptographically enforced **One-Person-One-Vote Architecture**.

---

## 1. System Architecture & Biometric Security Workflow

```
[ Voter Login ]
       │
       ▼
[ Has Voted Check ] ──(Already Voted)──► [ Locked View: "You have already cast your vote. Multiple voting is not permitted." ]
       │ (Not Voted)
       ▼
[ Face Enrolled? ] ──(No)──► [ Step 1: Informed Biometric Consent & Camera Enrollment ]
       │ (Yes)
       ▼
[ Step 2: Live Biometric Face Verification ]
  ├── Camera capture via navigator.mediaDevices.getUserMedia (or testing simulator)
  ├── 32-dimensional spatial vector extraction & normalized cosine similarity match (threshold >= 0.75)
  ├── Multi-frame optical flow & contrast gradient anti-spoofing / liveness detection
  └── Lockout control: Max 3 failed attempts triggers automatic account security freeze
       │ (Passed)
       ▼
[ Server-Validated Authorization Token Issued (5-min TTL) ]
       │
       ▼
[ Ballot Selection Screen ]
       │
       ▼
[ Atomic Vote Submission ]
  ├── Enforces token validity & uniqueness
  ├── Atomically sets has_voted = 1 and commits vote
  ├── Consumes and invalidates verification token (zero replay allowed)
  └── Issues tamper-evident official ballot certificate
```

---

## 2. Key Biometric & Security Features

1. **Informed Biometric Consent**: Clear privacy disclosure explaining that raw facial photos are never retained; only irreversible mathematical feature vectors are evaluated.
2. **One-Person-One-Vote Guarantee**: Once a ballot is cast, multiple voting is permanently blocked across all sessions, re-logins, page refreshes, and face verification attempts with the exact notification:
   > `"You have already cast your vote. Multiple voting is not permitted."`
3. **Short-Lived Authorization Token**: A cryptographically random token (`FV-AUTH-...`) is issued only on successful biometric match, expires after 5 minutes, and is atomically consumed upon vote submission.
4. **Anti-Spoofing & Liveness Evaluation**: Multi-frame optical gradient analysis blocks static photograph presentation, printed paper masks, and video playback attacks.
5. **Rate Limiting & Lockout**: Maximum 3 failed verification attempts before an automatic account lockout is enforced.
6. **Administrator Biometric Audit Logs**: Tamper-evident ledger of every biometric action (`ENROLLMENT`, `VERIFICATION_SUCCESS`, `VERIFICATION_FAILURE`, `REPLAY_ATTEMPT_BLOCKED`, `LOCKOUT_TRIGGERED`, `ADMIN_ENROLLMENT_RESET`).
7. **Administrative Recovery Tools**: Official tools to reset biometric templates and unlock locked voters without altering their historical voting status.

---

## 3. Database Schema Updates (`database/schema.sql`)

```sql
-- Electors Table (Enhanced with Biometric Fields)
ALTER TABLE electors
    ADD COLUMN face_enrolled TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN face_template_hash TEXT NULL,
    ADD COLUMN face_enrolled_at TIMESTAMP NULL,
    ADD COLUMN failed_verification_attempts INT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN verification_token VARCHAR(64) NULL,
    ADD COLUMN token_expires_at TIMESTAMP NULL;

-- Votes Table (Token Validation)
ALTER TABLE votes
    ADD COLUMN verification_token VARCHAR(64) NOT NULL,
    ADD COLUMN receipt_code VARCHAR(32) NOT NULL,
    ADD UNIQUE KEY uq_votes_elector_id (elector_id);

-- Biometric Audit Logs Table
CREATE TABLE biometric_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    elector_id INT UNSIGNED NOT NULL,
    voter_id VARCHAR(32) NOT NULL,
    action_type ENUM('ENROLLMENT', 'VERIFICATION_SUCCESS', 'VERIFICATION_FAILURE', 'REPLAY_ATTEMPT_BLOCKED', 'LOCKOUT_TRIGGERED', 'ADMIN_ENROLLMENT_RESET') NOT NULL,
    match_score DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    liveness_passed TINYINT(1) NOT NULL DEFAULT 1,
    details VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_biometric_logs_elector FOREIGN KEY (elector_id) REFERENCES electors(id) ON DELETE CASCADE
);
```

---

## 4. Test Matrix & Verification Scenarios

| # | Test Scenario | Description & Expected Outcome |
|---|---|---|
| **1** | First-Time Voter Enrollment | Log in with `VOT1002` (unenrolled). System routes to informed consent, opens camera reticle, and completes facial template extraction. |
| **2** | Camera Permission Granted | Camera stream starts via `navigator.mediaDevices.getUserMedia` with live video stream in oval reticle. |
| **3** | Camera Permission Denied | When permission is rejected or device has no camera, clear notice is shown with automatic testing simulator fallback. |
| **4** | Poor Lighting Detection | If ambient brightness is below threshold, an alert instructs voter to increase room lighting. |
| **5** | Enrolled Template Association | Enrolled face template hash is permanently associated with the authenticated elector in the database. |
| **6** | Successful Face Verification | Log in with `VOT1001` (pre-enrolled). Matching face verification passes with similarity >= 0.75, issuing authorization token. |
| **7** | Impostor / Face Mismatch | Switch profile to "Impostor Face". Similarity score is low, attempt counter decrements, and verification is rejected. |
| **8** | Liveness Failure Spoof Test | Switch profile to "Liveness Spoof Failure". Anti-spoofing rejects static photo spoof, logs failure, and decrements attempts. |
| **9** | Poor Lighting in Verification | Low contrast scene prevents token issuance until proper lighting is restored. |
| **10** | Max 3 Attempts Lockout | After 3 failed verification attempts, elector is locked out: *"Maximum face verification attempts exceeded (3/3)..."*. |
| **11** | Successful Vote Submission | After biometric verification unlocks ballot, selecting candidate and confirming submits vote and displays official receipt. |
| **12** | Duplicate Vote Across Refresh | Refreshing browser or re-logging in immediately displays `#alreadyVotedMessage`: *"You have already cast your vote. Multiple voting is not permitted."* |
| **13** | Duplicate Vote in Another Session | Second browser session or incognito tab logging in with the same voter ID is immediately blocked with `#alreadyVotedMessage`. |
| **14** | Blocking Replay Verification | Attempting to access face verification again after casting vote displays `#alreadyVotedMessage` and forbids token generation. |
| **15** | Admin Audit Logs & Recovery | Admin portal displays live Biometric Enrollment Rate, table with biometric statuses, recovery actions ("Reset Face", "Unlock"), and full audit logs. |

---

## 5. Demo Accounts

### Voters
| Voter ID | Password | Biometric Status | Initial State |
|---|---|---|---|
| `VOT1001` | `pass123` | **Pre-Enrolled** | Ready for Face Verification (Scenario 6) |
| `VOT1002` | `pass123` | **Pending Enrollment** | Ready for First-Time Enrollment (Scenario 1) |
| `VOT1003` | `pass123` | **Pending Enrollment** | Ready for First-Time Enrollment |

### Administrator
- **Username**: `KOUSHIKRDY2006`
- **Password**: `AMMUUU@1090`
- Access: Full metrics dashboard, candidate management, electoral roll with biometric statuses, and tamper-evident audit logs.
