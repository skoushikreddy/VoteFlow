-- VoteFlow demo seed data with Face Biometric Enrollment
-- Passwords are stored with bcrypt (password_hash compatible). Never plaintext. Never MD5.
-- Demo voter password: pass123
-- Demo admin password: AMMUUU@1090

INSERT INTO candidates (name, party, vote_count) VALUES
('Alex Morgan', 'TDP', 0),
('Jamie Lin', 'YSRCP', 0),
('Sofia Reyes', 'JSP', 0),
('Harika', 'BJP', 0),
('Rahul Kumar', 'CONGRESS', 0),
('NOTA', 'NOTA', 0);

INSERT INTO electors (voter_id, password_hash, has_voted, face_enrolled, face_template_hash, face_enrolled_at) VALUES
('VOT1001', '$2y$10$xPWoeZZf.leeZcYMChaF5Ol42vfffXCj4Ie6Y42gd.Zric1RD17Fy', 0, 1, 'HASH_FP_VOT1001_8F3A219C', '2026-01-01 10:00:00'),
('VOT1002', '$2y$10$xPWoeZZf.leeZcYMChaF5Ol42vfffXCj4Ie6Y42gd.Zric1RD17Fy', 0, 0, NULL, NULL),
('VOT1003', '$2y$10$xPWoeZZf.leeZcYMChaF5Ol42vfffXCj4Ie6Y42gd.Zric1RD17Fy', 0, 0, NULL, NULL);

INSERT INTO admins (username, password_hash) VALUES
('KOUSHIKRDY2006', '$2y$10$oY8sS1c/iP4iejz7EH.uKOzcm70pac7Mg/v1P/P0X70zrLW0gqIDS');
