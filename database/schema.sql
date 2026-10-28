-- VoteFlow schema for votesphere_db with Face Biometric Verification
-- MySQL 8.0+

CREATE TABLE IF NOT EXISTS electors (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    voter_id VARCHAR(32) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    has_voted TINYINT(1) NOT NULL DEFAULT 0,
    face_enrolled TINYINT(1) NOT NULL DEFAULT 0,
    face_template_hash TEXT NULL,
    face_enrolled_at TIMESTAMP NULL,
    failed_verification_attempts INT UNSIGNED NOT NULL DEFAULT 0,
    verification_token VARCHAR(64) NULL,
    token_expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_electors_voter_id (voter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS candidates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    party VARCHAR(32) NOT NULL,
    vote_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS votes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    elector_id INT UNSIGNED NOT NULL,
    candidate_id INT UNSIGNED NOT NULL,
    verification_token VARCHAR(64) NOT NULL,
    receipt_code VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_votes_elector_id (elector_id),
    CONSTRAINT fk_votes_elector FOREIGN KEY (elector_id) REFERENCES electors(id) ON DELETE CASCADE,
    CONSTRAINT fk_votes_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_admins_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS biometric_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    elector_id INT UNSIGNED NOT NULL,
    voter_id VARCHAR(32) NOT NULL,
    action_type ENUM('ENROLLMENT', 'VERIFICATION_SUCCESS', 'VERIFICATION_FAILURE', 'REPLAY_ATTEMPT_BLOCKED', 'LOCKOUT_TRIGGERED', 'ADMIN_ENROLLMENT_RESET') NOT NULL,
    match_score DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    liveness_passed TINYINT(1) NOT NULL DEFAULT 1,
    details VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_biometric_logs_elector FOREIGN KEY (elector_id) REFERENCES electors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
