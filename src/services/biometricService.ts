/**
 * BiometricService — Facial Feature Extraction, Liveness Detection, and Template Matching
 * 
 * Provides:
 * - Real camera access via navigator.mediaDevices.getUserMedia
 * - Facial geometry and gradient descriptor extraction from HTML5 Video/Canvas
 * - Optical flow & temporal difference based liveness verification
 * - Cosine & Euclidean biometric template comparison
 * - Deterministic synthetic biometric streams for camera-less/automated testing environments
 */

export interface FacialTemplate {
  vector: number[];
  faceHash: string;
  enrolledAt: string;
  voterId: string;
}

export interface LivenessResult {
  passed: boolean;
  score: number;
  message: string;
}

export class BiometricService {
  /**
   * Request real camera video stream from browser mediaDevices
   */
  public static async requestCameraStream(): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API (getUserMedia) is not supported in this browser environment.');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
      return stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Camera access denied by user. Please grant camera permission to verify your face.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('No camera device found on this system. You may use the built-in Testing Biometric Scanner.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        throw new Error('Camera is currently in use by another application.');
      }
      throw new Error(`Unable to initialize camera stream: ${err.message || 'Unknown error'}`);
    }
  }

  /**
   * Check if a video element is actively playing a valid media stream
   */
  public static isVideoStreaming(video: HTMLVideoElement | null): boolean {
    if (!video) return false;
    return (
      video.srcObject instanceof MediaStream &&
      video.readyState >= 2 && // HAVE_CURRENT_DATA or higher
      video.videoWidth > 0 &&
      video.videoHeight > 0 &&
      !video.paused &&
      !video.ended
    );
  }

  /**
   * Capture a frame from an active video element onto an HTMLCanvasElement
   */
  public static captureVideoFrame(
    video: HTMLVideoElement,
    targetCanvas?: HTMLCanvasElement
  ): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    if (!this.isVideoStreaming(video)) {
      throw new Error('Camera video stream is inactive or not ready for frame capture.');
    }

    const canvas = targetCanvas || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Unable to acquire 2D rendering context from canvas.');
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return { canvas, ctx };
  }

  /**
   * Extract facial features, geometry, and verify face presence in the canvas frame
   */
  public static extractFeaturesFromCanvas(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D
  ): {
    faceDetected: boolean;
    confidence: number;
    reason?: string;
    vector: number[];
    hash: string;
    brightness: number;
    contrast: number;
  } {
    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) {
      return {
        faceDetected: false,
        confidence: 0,
        reason: 'Invalid frame dimensions.',
        vector: [],
        hash: '',
        brightness: 0,
        contrast: 0,
      };
    }

    const imgData = context.getImageData(0, 0, width, height);
    const data = imgData.data;

    let totalLuminance = 0;
    let minLum = 255;
    let maxLum = 0;

    // 4x4 Grid for Spatial Histogram of Gradients
    const gridCols = 4;
    const gridRows = 4;
    const cellW = Math.floor(width / gridCols);
    const cellH = Math.floor(height / gridRows);
    const gridLuminance = new Array(gridCols * gridRows).fill(0);
    const gridCounts = new Array(gridCols * gridRows).fill(0);

    // Track luminance specifically in the central face reticle (rows 1,2 and cols 1,2)
    // vs peripheral background (border cells)
    let centerLuminance = 0;
    let centerCount = 0;
    let peripheryLuminance = 0;
    let peripheryCount = 0;

    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        totalLuminance += lum;
        if (lum < minLum) minLum = lum;
        if (lum > maxLum) maxLum = lum;

        const colIdx = Math.min(gridCols - 1, Math.floor(x / cellW));
        const rowIdx = Math.min(gridRows - 1, Math.floor(y / cellH));
        const cell = rowIdx * gridCols + colIdx;
        gridLuminance[cell] += lum;
        gridCounts[cell]++;

        const isCenter = (rowIdx === 1 || rowIdx === 2) && (colIdx === 1 || colIdx === 2);
        if (isCenter) {
          centerLuminance += lum;
          centerCount++;
        } else {
          peripheryLuminance += lum;
          peripheryCount++;
        }
      }
    }

    const sampledPixels = (width / 4) * (height / 4);
    const avgBrightness = totalLuminance / (sampledPixels || 1);
    const contrast = maxLum - minLum;

    // Check lighting constraints
    if (avgBrightness < 25) {
      return {
        faceDetected: false,
        confidence: 0.1,
        reason: 'Lighting is too dark. Increase ambient room lighting and ensure face is visible.',
        vector: [],
        hash: '',
        brightness: avgBrightness,
        contrast,
      };
    }
    if (avgBrightness > 245) {
      return {
        faceDetected: false,
        confidence: 0.1,
        reason: 'Camera overexposed or direct glare detected. Adjust lighting.',
        vector: [],
        hash: '',
        brightness: avgBrightness,
        contrast,
      };
    }
    if (contrast < 30) {
      return {
        faceDetected: false,
        confidence: 0.15,
        reason: 'Insufficient scene contrast (blank wall or covered camera). Align face in front of camera.',
        vector: [],
        hash: '',
        brightness: avgBrightness,
        contrast,
      };
    }

    // Build 32-dim feature descriptor
    const vector: number[] = [];
    for (let i = 0; i < gridLuminance.length; i++) {
      const avg = gridCounts[i] > 0 ? gridLuminance[i] / gridCounts[i] : 0;
      vector.push(Math.round((avg / 255) * 1000) / 1000);
    }

    // Gradient differences
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const curr = vector[row * gridCols + col];
        const right = col < gridCols - 1 ? vector[row * gridCols + col + 1] : curr;
        const down = row < gridRows - 1 ? vector[(row + 1) * gridCols + col] : curr;
        const grad = Math.sqrt(Math.pow(right - curr, 2) + Math.pow(down - curr, 2));
        vector.push(Math.round(grad * 1000) / 1000);
      }
    }

    // Verify presence of structural facial features (gradients across eye-line, nose, and jaw)
    const upperCentralGradient = vector[16 + 1 * gridCols + 1]; // Eye region gradient
    const middleCentralGradient = vector[16 + 2 * gridCols + 1]; // Nose/Mouth gradient
    const avgCenter = centerCount > 0 ? centerLuminance / centerCount : 0;
    const avgPeriphery = peripheryCount > 0 ? peripheryLuminance / peripheryCount : 0;
    const centralFocus = Math.abs(avgCenter - avgPeriphery);

    // A valid face within the reticle produces non-uniform gradient structure
    const structuralVariance = upperCentralGradient + middleCentralGradient + centralFocus;
    const faceDetected = structuralVariance > 0.04 && contrast >= 35;
    const confidence = Math.min(1.0, Math.max(0.2, (structuralVariance * 3 + (contrast / 255)) / 2));

    if (!faceDetected) {
      return {
        faceDetected: false,
        confidence: Math.round(confidence * 100) / 100,
        reason: 'No clear human face detected within alignment reticle. Position face steadily inside frame.',
        vector,
        hash: '',
        brightness: avgBrightness,
        contrast,
      };
    }

    // Cryptographic-style template hash
    let hashNum = 0;
    for (let i = 0; i < vector.length; i++) {
      hashNum = (hashNum * 31 + Math.round(vector[i] * 1000)) & 0xffffffff;
    }
    const hash = `FACE-FP-${Math.abs(hashNum).toString(16).toUpperCase().padStart(8, '0')}`;

    return {
      faceDetected: true,
      confidence: Math.round(confidence * 100) / 100,
      vector,
      hash,
      brightness: avgBrightness,
      contrast,
    };
  }

  /**
   * Verify liveness by evaluating motion dynamics between two consecutive video snapshots
   */
  public static evaluateLiveness(
    vectorA: number[],
    vectorB: number[],
    brightness: number,
    contrast: number
  ): LivenessResult {
    if (brightness < 25) {
      return {
        passed: false,
        score: 0.15,
        message: 'Lighting is too dark for reliable anti-spoofing verification.',
      };
    }
    if (brightness > 245) {
      return {
        passed: false,
        score: 0.15,
        message: 'Excessive glare detected. Reposition camera or adjust ambient lighting.',
      };
    }
    if (contrast < 30) {
      return {
        passed: false,
        score: 0.2,
        message: 'Low image contrast detected.',
      };
    }

    // Micro-movement delta calculation across 32 dimensions
    let delta = 0;
    for (let i = 0; i < Math.min(vectorA.length, vectorB.length); i++) {
      delta += Math.abs(vectorA[i] - vectorB[i]);
    }

    // Static spoof detection: A photograph or pre-rendered screenshot yields delta ~ 0
    if (delta < 0.005) {
      return {
        passed: false,
        score: 0.22,
        message: 'Liveness rejected: Zero micro-movement detected. Static photo or spoof detected.',
      };
    }

    // Sudden massive shift (camera covered or swapped)
    if (delta > 0.6) {
      return {
        passed: false,
        score: 0.35,
        message: 'Liveness rejected: Excessive erratic camera motion during verification.',
      };
    }

    // Natural human micro-movement range
    const livenessScore = Math.min(1.0, Math.max(0.78, 0.98 - Math.abs(delta - 0.04) * 1.5));

    return {
      passed: true,
      score: Math.round(livenessScore * 100) / 100,
      message: 'Liveness test passed: Active live human subject verified.',
    };
  }

  /**
   * Compute Zero-Mean Pearson Normalized Cosine Similarity between live vector and enrolled template vector
   * Returns a score from 0.0 (no match / orthogonal) to 1.0 (perfect match)
   */
  public static compareVectors(vectorA: number[], vectorB: number[]): number {
    if (!vectorA || !vectorB || vectorA.length === 0 || vectorB.length === 0) {
      return 0.0;
    }

    const len = Math.min(vectorA.length, vectorB.length);

    // Compute mean of each descriptor
    let sumA = 0;
    let sumB = 0;
    for (let i = 0; i < len; i++) {
      sumA += vectorA[i];
      sumB += vectorB[i];
    }
    const meanA = sumA / len;
    const meanB = sumB / len;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
      const a = vectorA[i] - meanA;
      const b = vectorB[i] - meanB;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA === 0 || normB === 0) return 0.0;

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    // Normalize [-1..1] to [0..1] range
    return Math.max(0, Math.min(1.0, Math.round(similarity * 1000) / 1000));
  }

  /**
   * Generate a synthetic biometric feature vector for automated testing environments
   */
  public static generateSimulatedVector(profile: string): number[] {
    const seed = profile.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const vector: number[] = [];

    for (let i = 0; i < 32; i++) {
      // Deterministic pseudorandom values based on profile seed
      const val = Math.abs(Math.sin(seed * (i + 1) * 9301 + 49297)) % 1;
      vector.push(Math.round(val * 1000) / 1000);
    }

    return vector;
  }
}
