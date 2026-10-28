import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Session } from '../types';
import { votingStore } from '../store/votingStore';
import { BiometricService } from '../services/biometricService';
import {
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Sliders,
  UserX,
  Lock,
  ArrowRight,
  VideoOff,
  Sparkles,
} from 'lucide-react';

interface FaceVerificationProps {
  session: Session;
  onVerificationSuccess: (token: string) => void;
  onNavigateToEnrollment: () => void;
}

export const FaceVerification: React.FC<FaceVerificationProps> = ({
  session,
  onVerificationSuccess,
  onNavigateToEnrollment,
}) => {
  const electorId = session.elector_id || 0;
  const voter = electorId ? votingStore.getElectorById(electorId) : undefined;
  const alreadyVoted = electorId ? votingStore.hasVoted(electorId) : false;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);
  const [simulatedProfile, setSimulatedProfile] = useState<'MATCH' | 'IMPOSTOR' | 'LIVENESS_FAIL'>('MATCH');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [livenessStatus, setLivenessStatus] = useState<string>('Ready for face biometric verification');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [scanProgress, setScanProgress] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize and attach camera stream
  const startCamera = useCallback(async () => {
    if (alreadyVoted) return;
    setCameraError(null);
    try {
      const s = await BiometricService.requestCameraStream();
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        try {
          await videoRef.current.play();
          setCameraActive(true);
        } catch {
          setCameraActive(true);
        }
      }
    } catch (err: any) {
      setCameraActive(false);
      setCameraError(err.message || 'Camera unavailable. Please check camera permissions.');
    }
  }, [alreadyVoted]);

  useEffect(() => {
    if (alreadyVoted) return;

    if (!useSimulation) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setCameraActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [alreadyVoted, useSimulation]);

  // Real Multi-Frame Biometric Verification Execution
  const handleVerify = async () => {
    if (alreadyVoted || isVerifying) return;

    // Reset previous states
    setErrorMsg(null);
    setSuccessMsg(null);
    setMatchScore(null);
    setIsVerifying(true);
    setScanProgress(10);
    setLivenessStatus('Initiating facial sensor scan...');

    try {
      let liveVector: number[];
      let livenessPassed = true;
      let livenessScore = 0.95;

      if (!useSimulation) {
        // ENFORCE REAL CAMERA STREAM
        const video = videoRef.current;
        if (!video || !BiometricService.isVideoStreaming(video)) {
          throw new Error('Camera video stream is inactive. Please click "Enable Camera" and allow webcam access.');
        }

        setScanProgress(25);
        setLivenessStatus('Capturing primary facial geometry frame (Frame 1)...');

        // Capture Frame 1
        const canvas1 = canvasRef.current || document.createElement('canvas');
        const frame1 = BiometricService.captureVideoFrame(video, canvas1);
        const features1 = BiometricService.extractFeaturesFromCanvas(frame1.canvas, frame1.ctx);

        if (!features1.faceDetected) {
          throw new Error(features1.reason || 'No human face detected inside alignment reticle. Position face steadily.');
        }

        setScanProgress(55);
        setLivenessStatus('Analyzing dynamic facial micro-motions & anti-spoofing (Frame 2)...');

        // Temporal delay for live motion analysis (250ms)
        await new Promise((resolve) => setTimeout(resolve, 250));

        // Capture Frame 2 for optical flow & liveness evaluation
        const canvas2 = document.createElement('canvas');
        const frame2 = BiometricService.captureVideoFrame(video, canvas2);
        const features2 = BiometricService.extractFeaturesFromCanvas(frame2.canvas, frame2.ctx);

        setScanProgress(75);
        setLivenessStatus('Computing mathematical vector distance against enrolled voter template...');

        // Anti-spoofing / liveness test
        const liveness = BiometricService.evaluateLiveness(
          features1.vector,
          features2.vector,
          features1.brightness,
          features1.contrast
        );

        livenessPassed = liveness.passed;
        livenessScore = liveness.score;
        liveVector = features1.vector;

        if (!livenessPassed) {
          throw new Error(liveness.message);
        }
      } else {
        // SIMULATED TEST HARNESS: Must strictly perform template comparison based on selected test profile
        setScanProgress(40);
        setLivenessStatus('Simulating biometric sensor capture...');
        await new Promise((resolve) => setTimeout(resolve, 600));

        if (simulatedProfile === 'IMPOSTOR') {
          // Generate orthogonal vector for an unauthorized entity
          liveVector = BiometricService.generateSimulatedVector('UNAUTHORIZED_IMPOSTOR_SUBJECT_DELTA_99');
          livenessPassed = true;
          livenessScore = 0.92;
        } else if (simulatedProfile === 'LIVENESS_FAIL') {
          // Emulate static print spoof failure
          liveVector = BiometricService.generateSimulatedVector(session.voter_id || 'VOT1001');
          livenessPassed = false;
          livenessScore = 0.22;
        } else {
          // Emulates genuine registered elector
          liveVector = BiometricService.generateSimulatedVector(session.voter_id || 'VOT1001');
          livenessPassed = true;
          livenessScore = 0.96;
        }
      }

      setScanProgress(90);

      // Call store verification engine (enforces 1-person-1-vote, template match threshold, and lockouts)
      const result = votingStore.verifyVoterFace(electorId, liveVector, livenessPassed, livenessScore);

      setMatchScore(result.matchScore);
      setScanProgress(100);
      setIsVerifying(false);

      if (result.ok && result.verificationToken) {
        setSuccessMsg(
          `Face verified successfully (${(result.matchScore * 100).toFixed(1)}% match)! Generating ballot access token...`
        );
        setLivenessStatus('Authentication Complete — Unlocking Ballot');

        // Short confirmation delay before triggering ballot navigation with the issued token
        setTimeout(() => {
          onVerificationSuccess(result.verificationToken!);
        }, 900);
      } else {
        setErrorMsg(result.error || 'Face verification rejected.');
        setLivenessStatus('Biometric verification failed. Review notice below.');
      }
    } catch (err: any) {
      setIsVerifying(false);
      setScanProgress(0);
      setErrorMsg(err.message || 'Biometric analysis error occurred.');
      setLivenessStatus('Verification halted: sensor or validation error.');
    }
  };

  // 1. If already voted, deny access immediately
  if (alreadyVoted) {
    return (
      <div style={{ maxWidth: 600, margin: '2rem auto' }}>
        <article className="card auth-panel-3d" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#fef3c7',
              color: '#b45309',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
              boxShadow: '0 8px 24px rgba(217, 119, 6, 0.25)',
            }}
          >
            <Lock size={36} />
          </div>

          <div id="alreadyVotedMessage" className="alert alert-warning" style={{ fontSize: '1.05rem', justifyContent: 'center' }}>
            <AlertTriangle size={22} style={{ flexShrink: 0 }} />
            <span>You have already cast your vote. Multiple voting is not permitted.</span>
          </div>

          <p className="locked-note" style={{ fontSize: '1rem', marginTop: '0.75rem', marginBottom: '1.5rem' }}>
            Your ballot is already cryptographically sealed and recorded in the election database. Repeating face verification is strictly prohibited.
          </p>
        </article>
      </div>
    );
  }

  // 2. If face is not enrolled yet, prompt enrollment
  if (voter && voter.face_enrolled !== 1) {
    return (
      <div style={{ maxWidth: 580, margin: '2rem auto' }}>
        <article className="card auth-panel-3d" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: '#e0f2fe',
              color: '#0369a1',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <Camera size={34} />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
            Face Biometric Enrollment Required
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
            To enforce one-person-one-vote election security, you must enroll your facial template once before access to the ballot is unlocked.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onNavigateToEnrollment}
            style={{ width: 'auto', padding: '0.85rem 2rem', margin: '0 auto' }}
          >
            Start Face Enrollment &rarr;
          </button>
        </article>
      </div>
    );
  }

  const isLockedOut = voter ? voter.failed_verification_attempts >= 3 : false;

  return (
    <div style={{ maxWidth: 640, margin: '1.5rem auto' }}>
      <article className="card auth-panel-3d">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
              <ShieldCheck size={14} />
              <span>Identity Verification Step</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Verify Face Before Voting
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!useSimulation && cameraError && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', color: '#0f766e' }}
                onClick={startCamera}
              >
                <Camera size={14} />
                Enable Camera
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={() => {
                setUseSimulation(!useSimulation);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              <Sliders size={14} />
              {useSimulation ? 'Use Real Camera' : 'Biometric Test Profiles'}
            </button>
          </div>
        </div>

        {/* Camera error notification */}
        {cameraError && !useSimulation && (
          <div className="alert alert-warning" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
            <VideoOff size={18} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <strong>Camera Offline: </strong>
              <span>{cameraError}</span>
              <div style={{ marginTop: '0.35rem' }}>
                <button
                  type="button"
                  onClick={startCamera}
                  style={{
                    background: 'none',
                    border: 'underline',
                    color: '#92400e',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Click here to request camera access again
                </button>
                {' or use '}
                <button
                  type="button"
                  onClick={() => setUseSimulation(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0f766e',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Biometric Test Profiles
                </button>
                {' for offline evaluation.'}
              </div>
            </div>
          </div>
        )}

        {/* Biometric test profile selectors */}
        {useSimulation && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: '#f8fafc',
              border: '1.5px dashed #0f766e',
              borderRadius: '12px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f766e', fontWeight: 800, marginBottom: '0.4rem' }}>
              <Sparkles size={15} />
              <span>Diagnostic Biometric Test Suite (Verification Engine Active):</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              <button
                type="button"
                className="demo-chip"
                style={{
                  background: simulatedProfile === 'MATCH' ? '#0f766e' : '#e0f2fe',
                  color: simulatedProfile === 'MATCH' ? '#ffffff' : '#0369a1',
                  borderColor: '#0f766e',
                }}
                onClick={() => setSimulatedProfile('MATCH')}
              >
                Registered Elector Face (Match ~95%)
              </button>
              <button
                type="button"
                className="demo-chip"
                style={{
                  background: simulatedProfile === 'IMPOSTOR' ? '#dc2626' : '#fee2e2',
                  color: simulatedProfile === 'IMPOSTOR' ? '#ffffff' : '#991b1b',
                  borderColor: '#fca5a5',
                }}
                onClick={() => setSimulatedProfile('IMPOSTOR')}
              >
                <UserX size={13} />
                Impostor Face (Reject Mismatch)
              </button>
              <button
                type="button"
                className="demo-chip"
                style={{
                  background: simulatedProfile === 'LIVENESS_FAIL' ? '#d97706' : '#fef3c7',
                  color: simulatedProfile === 'LIVENESS_FAIL' ? '#ffffff' : '#92400e',
                  borderColor: '#fde68a',
                }}
                onClick={() => setSimulatedProfile('LIVENESS_FAIL')}
              >
                Liveness Spoof Failure
              </button>
            </div>
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div id="faceVerifyErrorMessage" className="alert alert-error">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Verification Rejected: </strong>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div id="faceVerifySuccessMessage" className="alert alert-success">
            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Identity Confirmed: </strong>
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {/* Video Preview with Oval Reticle */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4 / 3',
            background: '#070b19',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {useSimulation ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0b132b 0%, #1c2541 100%)',
                color: '#ffffff',
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 180,
                  borderRadius: '50%',
                  border: `3px dashed ${simulatedProfile === 'IMPOSTOR' ? '#ef4444' : simulatedProfile === 'LIVENESS_FAIL' ? '#f59e0b' : '#10b981'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 25px ${simulatedProfile === 'IMPOSTOR' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                }}
              >
                {simulatedProfile === 'IMPOSTOR' ? (
                  <UserX size={44} style={{ color: '#ef4444' }} />
                ) : (
                  <ShieldCheck size={44} style={{ color: simulatedProfile === 'LIVENESS_FAIL' ? '#f59e0b' : '#10b981' }} />
                )}
              </div>
              <div style={{ marginTop: '0.85rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                Profile: <strong>{simulatedProfile}</strong> &bull; Elector: <strong>{session.voter_id}</strong>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {!cameraActive && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#090d1a',
                    color: '#94a3b8',
                    gap: '0.75rem',
                  }}
                >
                  <VideoOff size={40} style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: '0.9rem' }}>Webcam not streaming</span>
                </div>
              )}
            </>
          )}

          {/* Oval Reticle */}
          <div
            style={{
              position: 'absolute',
              width: '55%',
              height: '75%',
              border: `2.5px solid ${isVerifying ? '#38bdf8' : '#10b981'}`,
              borderRadius: '50%',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
              pointerEvents: 'none',
              transition: 'border-color 0.3s ease',
            }}
          />

          {/* Scanning line animation */}
          {isVerifying && (
            <div
              style={{
                position: 'absolute',
                top: `${scanProgress}%`,
                left: '20%',
                right: '20%',
                height: 3,
                background: 'linear-gradient(90deg, transparent, #38bdf8, #10b981, transparent)',
                boxShadow: '0 0 12px #38bdf8',
                transition: 'top 0.25s linear',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Live Status & Match Meter */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ color: '#334155', fontWeight: 600 }}>{livenessStatus}</div>
          {matchScore !== null && (
            <div style={{ fontWeight: 800, color: matchScore >= 0.75 ? '#059669' : '#dc2626' }}>
              Match: {(matchScore * 100).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Verification Trigger Button */}
        <button
          id="verifyFaceButton"
          type="button"
          className="btn btn-primary"
          disabled={isVerifying || isLockedOut || (!useSimulation && !cameraActive)}
          onClick={handleVerify}
          style={{ width: '100%', margin: 0 }}
        >
          <RefreshCw size={18} className={isVerifying ? 'animate-spin' : ''} />
          {isVerifying ? 'Authenticating Face...' : 'Verify Face & Unlock Ballot'}
          {!isVerifying && <ArrowRight size={18} />}
        </button>

        {!useSimulation && !cameraActive && !isLockedOut && (
          <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748b', margin: '0.5rem 0 0' }}>
            Note: An active webcam stream or test profile is required before unlocking the ballot.
          </p>
        )}

        {voter && voter.failed_verification_attempts > 0 && voter.failed_verification_attempts < 3 && (
          <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#d97706', margin: '0.75rem 0 0', fontWeight: 600 }}>
            Security Notice: {3 - voter.failed_verification_attempts} verification attempt(s) remaining before security lockout.
          </p>
        )}

        {isLockedOut && (
          <p style={{ textAlign: 'center', fontSize: '0.84rem', color: '#dc2626', margin: '0.75rem 0 0', fontWeight: 700 }}>
            Account biometric access is locked due to 3 failed attempts. Please contact an election administrator to unlock.
          </p>
        )}
      </article>
    </div>
  );
};
