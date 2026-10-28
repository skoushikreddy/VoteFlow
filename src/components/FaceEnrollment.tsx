import React, { useState, useRef, useEffect } from 'react';
import { Session } from '../types';
import { votingStore } from '../store/votingStore';
import { BiometricService } from '../services/biometricService';
import {
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Info,
  Sparkles,
} from 'lucide-react';

interface FaceEnrollmentProps {
  session: Session;
  onEnrollmentComplete: () => void;
  onCancel: () => void;
}

export const FaceEnrollment: React.FC<FaceEnrollmentProps> = ({
  session,
  onEnrollmentComplete,
  onCancel,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);
  const [feedback, setFeedback] = useState<string>('Align your face inside the target frame');
  const [step, setStep] = useState<'consent' | 'capture' | 'success'>('consent');
  const [consentAccepted, setConsentAccepted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const electorId = session.elector_id || 0;
  const voter = electorId ? votingStore.getElectorById(electorId) : undefined;

  // Initialize camera when capture step starts
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (step === 'capture' && !useSimulation) {
      BiometricService.requestCameraStream()
        .then((s) => {
          activeStream = s;
          setStream(s);
          setCameraError(null);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          setCameraError(err.message || 'Unable to access camera.');
        });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [step, useSimulation]);

  const handleCaptureAndEnroll = () => {
    setIsScanning(true);
    setFeedback('Analyzing facial contours and lighting...');

    setTimeout(() => {
      try {
        let featureVector: number[];
        let faceHash: string;

        if (useSimulation) {
          // Synthetic high-entropy template generation for testing
          featureVector = BiometricService.generateSimulatedVector(session.voter_id || 'VOT1002');
          faceHash = `FACE-FP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        } else {
          // Real frame capture
          const video = videoRef.current;
          if (!video || !BiometricService.isVideoStreaming(video)) {
            throw new Error('Camera is not streaming video. Please grant camera access or switch to testing profile.');
          }

          const canvas = canvasRef.current || document.createElement('canvas');
          const frame = BiometricService.captureVideoFrame(video, canvas);
          const features = BiometricService.extractFeaturesFromCanvas(frame.canvas, frame.ctx);

          if (!features.faceDetected) {
            throw new Error(features.reason || 'No human face detected. Please position face steadily inside the reticle.');
          }

          featureVector = features.vector;
          faceHash = features.hash;
        }

        const result = votingStore.enrollVoterFace(electorId, featureVector, faceHash);
        setIsScanning(false);

        if (result.ok) {
          setStep('success');
        } else {
          setFeedback(result.error || 'Failed to complete face enrollment.');
        }
      } catch (err: any) {
        setIsScanning(false);
        setFeedback(err.message || 'Face detection error. Please try again.');
      }
    }, 1000);
  };

  return (
    <div style={{ maxWidth: 640, margin: '1.5rem auto' }}>
      {/* STEP 1: INFORMED CONSENT & PRIVACY NOTICE */}
      {step === 'consent' && (
        <article className="card auth-panel-3d">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                background: 'linear-gradient(135deg, var(--teal-600) 0%, var(--emerald-700) 100%)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                boxShadow: '0 8px 24px rgba(15, 118, 110, 0.3)',
              }}
            >
              <ShieldCheck size={32} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem' }}>
              Biometric Face Enrollment
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
              Required one-person-one-vote voter security verification for Elector{' '}
              <strong>{session.voter_id}</strong>
            </p>
          </div>

          <div
            style={{
              padding: '1.25rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              color: '#334155',
              lineHeight: 1.55,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#0f766e', marginBottom: '0.5rem' }}>
              <Info size={18} />
              <span>Biometric Privacy &amp; Data Protection Disclosure</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#64748b' }}>
              <li>
                <strong>Purpose:</strong> Face verification confirms physical voter identity prior to ballot issuance and guarantees zero duplicate voting.
              </li>
              <li>
                <strong>Privacy by Design:</strong> Raw facial photographs are never stored permanently. Only an irreversible mathematical feature hash is stored.
              </li>
              <li>
                <strong>Security:</strong> The facial template is strictly associated with your registered voter ID and cannot be accessed by other voters.
              </li>
            </ul>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              cursor: 'pointer',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              color: '#0f172a',
            }}
          >
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              style={{ width: 'auto', marginTop: '0.2rem' }}
            />
            <span>
              I give informed consent to capture and enroll my facial template for the purpose of secure election voting.
            </span>
          </label>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onCancel} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!consentAccepted}
              onClick={() => setStep('capture')}
              style={{ flex: 2, margin: 0 }}
            >
              <Camera size={18} />
              Proceed to Camera Setup
            </button>
          </div>
        </article>
      )}

      {/* STEP 2: CAMERA CAPTURE & RETICLE */}
      {step === 'capture' && (
        <article className="card auth-panel-3d">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Face Enrollment Scanner
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Center your face in the oval reticle
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setUseSimulation(!useSimulation)}
            >
              <Sliders size={14} />
              {useSimulation ? 'Use Real Camera' : 'Testing Camera'}
            </button>
          </div>

          {cameraError && !useSimulation && (
            <div className="alert alert-warning" style={{ fontSize: '0.85rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Camera Notice: </strong>
                <span>{cameraError} Switched to Testing Biometric Scanner.</span>
              </div>
            </div>
          )}

          {/* Video Preview with 3D Reticle Overlay */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 3',
              background: '#070b19',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {useSimulation ? (
              /* Simulated High-Resolution Testing Stream */
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
                    border: '3px dashed #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Sparkles size={36} style={{ color: '#34d399' }} />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: 'rgba(0,0,0,0.6)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    SYNTHETIC FEED
                  </div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                  Simulated Biometric Stream: <strong>{session.voter_id}</strong>
                </div>
              </div>
            ) : (
              /* Real Live HTML5 Video Stream */
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}

            {/* Oval Face Alignment Reticle */}
            <div
              style={{
                position: 'absolute',
                width: '55%',
                height: '75%',
                border: '2.5px solid rgba(16, 185, 129, 0.85)',
                borderRadius: '50%',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '90%',
                  height: '90%',
                  border: '1px dashed rgba(255, 255, 255, 0.4)',
                  borderRadius: '50%',
                }}
              />
            </div>
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Feedback ticker */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              fontSize: '0.88rem',
              color: '#166534',
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: '1.25rem',
            }}
          >
            {feedback}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={isScanning}
              onClick={() => setStep('consent')}
              style={{ flex: 1 }}
            >
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isScanning}
              onClick={handleCaptureAndEnroll}
              style={{ flex: 2, margin: 0 }}
            >
              <RefreshCw size={18} className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? 'Processing Template...' : 'Enroll Face Template'}
            </button>
          </div>
        </article>
      )}

      {/* STEP 3: ENROLLMENT SUCCESS */}
      {step === 'success' && (
        <article className="card auth-panel-3d" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              color: '#065f46',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
              boxShadow: '0 8px 24px rgba(5, 150, 105, 0.25)',
            }}
          >
            <CheckCircle2 size={40} />
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
            Face Enrolled Successfully
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
            Your biometric facial template has been securely encrypted and bound to Voter ID{' '}
            <strong>{session.voter_id}</strong>. You can now proceed to biometric verification before casting your vote.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onEnrollmentComplete}
            style={{ width: 'auto', padding: '0.85rem 2rem', margin: '0 auto' }}
          >
            Proceed to Vote Verification &rarr;
          </button>
        </article>
      )}
    </div>
  );
};
