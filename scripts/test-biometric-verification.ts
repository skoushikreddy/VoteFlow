/**
 * Automated Verification Test Suite for VoteFlow Biometric Security
 */
import { votingStore } from '../src/store/votingStore';
import { BiometricService } from '../src/services/biometricService';

interface TestResult {
  scenario: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResult[] = [];

function assertTest(scenario: string, expected: string, actual: string, condition: boolean) {
  results.push({
    scenario,
    expected,
    actual,
    passed: condition,
  });
  console.log(`[${condition ? 'PASS' : 'FAIL'}] ${scenario}`);
  if (!condition) {
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${actual}`);
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('VOTEFLOW BIOMETRIC & ONE-PERSON-ONE-VOTE TEST RUNNER');
  console.log('====================================================\n');

  // Reset to clean seed
  votingStore.resetToDefaultSeed();
  const elector1 = votingStore.getElectorById(1)!;

  // Test 1: Camera stream requirement & offline validation
  const isStreamingInactive = BiometricService.isVideoStreaming(null);
  assertTest(
    'Camera Stream Inactive Check',
    'isVideoStreaming returns false for inactive or null stream',
    `Returned ${isStreamingInactive}`,
    isStreamingInactive === false
  );

  // Test 2: Face presence in canvas (detect blank/covered camera)
  const dummyCanvas = {
    width: 640,
    height: 480,
  } as any;
  const blankData = new Uint8ClampedArray(640 * 480 * 4); // all zeros / black
  const dummyCtx = {
    getImageData: () => ({ data: blankData }),
  } as any;
  const blankScan = BiometricService.extractFeaturesFromCanvas(dummyCanvas, dummyCtx);
  assertTest(
    'Blank/Covered Camera Rejection',
    'faceDetected is false with lighting/contrast warning',
    `faceDetected: ${blankScan.faceDetected}, reason: "${blankScan.reason}"`,
    blankScan.faceDetected === false && blankScan.brightness < 25
  );

  // Test 3: Impostor Face Mismatch
  const impostorVector = BiometricService.generateSimulatedVector('UNAUTHORIZED_IMPOSTOR_SUBJECT_DELTA_99');
  const impostorResult = votingStore.verifyVoterFace(1, impostorVector, true, 0.95);
  assertTest(
    'Impostor Face Verification Rejected',
    'ok: false, matchScore < 0.75, attempts remaining: 2',
    `ok: ${impostorResult.ok}, matchScore: ${(impostorResult.matchScore * 100).toFixed(1)}%, attemptsLeft: ${impostorResult.attemptsLeft}`,
    impostorResult.ok === false && impostorResult.matchScore < 0.75 && impostorResult.attemptsLeft === 2
  );

  // Test 4: Liveness Spoof Failure (Static Photo / Screen)
  const registeredVector = BiometricService.generateSimulatedVector('VOT1001');
  const spoofResult = votingStore.verifyVoterFace(1, registeredVector, false, 0.22);
  assertTest(
    'Liveness Anti-Spoof Failure Rejected',
    'ok: false, liveness check failed, attempts remaining: 1',
    `ok: ${spoofResult.ok}, error: "${spoofResult.error}", attemptsLeft: ${spoofResult.attemptsLeft}`,
    spoofResult.ok === false && spoofResult.attemptsLeft === 1
  );

  // Test 5: 3rd Failed Attempt Triggers Security Lockout
  const lockoutResult = votingStore.verifyVoterFace(1, impostorVector, true, 0.95);
  assertTest(
    '3-Attempt Security Lockout Enforced',
    'ok: false, isLockedOut: true, attemptsLeft: 0',
    `ok: ${lockoutResult.ok}, isLockedOut: ${lockoutResult.isLockedOut}, attemptsLeft: ${lockoutResult.attemptsLeft}`,
    lockoutResult.ok === false && lockoutResult.isLockedOut === true && lockoutResult.attemptsLeft === 0
  );

  // Reset lockout for voter 1 for subsequent positive flow tests
  votingStore.unlockVoterAttempts(1);

  // Test 6: Genuine Registered Voter Matching
  const validResult = votingStore.verifyVoterFace(1, registeredVector, true, 0.95);
  assertTest(
    'Genuine Elector Face Verified & Token Issued',
    'ok: true, matchScore >= 0.75, verificationToken issued',
    `ok: ${validResult.ok}, matchScore: ${(validResult.matchScore * 100).toFixed(1)}%, token: ${validResult.verificationToken}`,
    validResult.ok === true && validResult.matchScore >= 0.75 && Boolean(validResult.verificationToken)
  );

  const issuedToken = validResult.verificationToken!;

  // Test 7: Direct Vote Submission Without Token
  const unverifiedVote = votingStore.castVote(2, 1, undefined);
  assertTest(
    'Vote Submission Without Biometric Token Rejected',
    'ok: false, error requires biometric verification',
    `ok: ${unverifiedVote.ok}, error: "${unverifiedVote.error}"`,
    unverifiedVote.ok === false && unverifiedVote.error?.includes('Biometric face verification is required')
  );

  // Test 8: Vote Submission With Forged Token
  const forgedVote = votingStore.castVote(1, 1, 'FORGED-FAKE-TOKEN-999');
  assertTest(
    'Vote Submission With Forged Token Rejected',
    'ok: false, invalid or forged biometric verification authorization',
    `ok: ${forgedVote.ok}, error: "${forgedVote.error}"`,
    forgedVote.ok === false && forgedVote.error?.includes('Invalid or forged')
  );

  // Test 9: Valid Vote Submission and Token Invalidation
  const validVote = votingStore.castVote(1, 1, issuedToken);
  const updatedElector1 = votingStore.getElectorById(1)!;
  assertTest(
    'Valid Vote Cast & Token Revoked Atomically',
    'ok: true, has_voted = 1, elector.verification_token = null',
    `ok: ${validVote.ok}, has_voted: ${updatedElector1.has_voted}, token: ${updatedElector1.verification_token}`,
    validVote.ok === true && updatedElector1.has_voted === 1 && updatedElector1.verification_token === null
  );

  // Test 10: Replay Attempt With Used Token
  const replayVote = votingStore.castVote(1, 2, issuedToken);
  assertTest(
    'Token Replay / Double Vote Blocked',
    'ok: false, already_voted: true, multiple voting not permitted',
    `ok: ${replayVote.ok}, error: "${replayVote.error}"`,
    replayVote.ok === false && replayVote.already_voted === true
  );

  // Test 11: Replay Face Verification After Voting Blocked
  const postVoteVerify = votingStore.verifyVoterFace(1, registeredVector, true, 0.95);
  assertTest(
    'Post-Vote Face Verification Replay Blocked',
    'Exact message: "You have already cast your vote. Multiple voting is not permitted."',
    `error: "${postVoteVerify.error}"`,
    postVoteVerify.error === 'You have already cast your vote. Multiple voting is not permitted.'
  );

  // Test 12: Biometric Audit Trail Verification
  const logs = votingStore.getBiometricLogs();
  const hasFailure = logs.some((l) => l.action_type === 'VERIFICATION_FAILURE');
  const hasSuccess = logs.some((l) => l.action_type === 'VERIFICATION_SUCCESS');
  const hasLockout = logs.some((l) => l.action_type === 'LOCKOUT_TRIGGERED');
  const hasConsumed = logs.some((l) => l.action_type === 'VOTE_CAST_TOKEN_CONSUMED');
  const hasReplayBlocked = logs.some((l) => l.action_type === 'REPLAY_ATTEMPT_BLOCKED');
  assertTest(
    'Biometric Audit Trail Complete',
    'Logs capture FAILURE, SUCCESS, LOCKOUT, CONSUMED, and REPLAY_BLOCKED',
    `Captured ${logs.length} logs. Failure: ${hasFailure}, Success: ${hasSuccess}, Lockout: ${hasLockout}, Consumed: ${hasConsumed}, Replay: ${hasReplayBlocked}`,
    hasFailure && hasSuccess && hasLockout && hasConsumed && hasReplayBlocked
  );

  console.log('\n====================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('====================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
