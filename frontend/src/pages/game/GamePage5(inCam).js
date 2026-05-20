import { Hands } from "@mediapipe/hands";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import React, { useState, useEffect, useRef, useCallback } from "react";

// ==================== CONFIGURATION ====================
const CONFIG = {
  SESSION_SECONDS: 300,
  CALIBRATION_SECONDS: 7, // Reduced from 20 to 7
  NUM_SHAPE_POINTS: 20,
  PICK_DISTANCE: 0.08,
  TRACE_TOLERANCE: 0.03,
  SCORE_PER_SHAPE: 10,
  MIN_COMPLETION: 0.8, // 80% points hit for success
  SMOOTH_ALPHA: 0.5,
  STABLE_FRAMES: 5,
  DRAW_FPS: 30,
  THEME: {
    PRIMARY: "#3B82F6",
    SECONDARY: "#EC4899",
    ACCENT: "#8B5CF6",
  },
};

// ==================== SHAPE GENERATION ====================
const SHAPES = ["circle", "triangle", "square", "hexagon"];

const generateShapePoints = (type, numPoints = CONFIG.NUM_SHAPE_POINTS) => {
  const centerX = 0.5;
  const centerY = 0.5;
  let radius = 0.3;
  const points = [];
  const angleStep = (2 * Math.PI) / numPoints;
  for (let i = 0; i < numPoints; i++) {
    let theta = i * angleStep;
    let x, y;
    switch (type) {
      case "circle":
        x = centerX + radius * Math.cos(theta);
        y = centerY + radius * Math.sin(theta);
        break;
      case "ellipse":
        x = centerX + radius * 1.5 * Math.cos(theta);
        y = centerY + radius * 0.8 * Math.sin(theta);
        break;
      case "triangle":
        theta += Math.PI / 2; // Start at top
        x = centerX + radius * Math.cos(theta);
        y = centerY + radius * Math.sin(theta);
        break;
      case "square":
        const t = i / numPoints;
        const sideFrac = 0.35;
        let frac = t;
        let px, py;
        if (frac < sideFrac) {
          px = -0.5 + frac / sideFrac;
          py = -0.5;
        } else if (frac < 2 * sideFrac) {
          px = 0.5;
          py = -0.5 + (frac - sideFrac) / sideFrac;
        } else if (frac < 3 * sideFrac) {
          px = 0.5 - (frac - 2 * sideFrac) / sideFrac;
          py = 0.5;
        } else {
          px = -0.5;
          py = 0.5 - (frac - 3 * sideFrac) / sideFrac;
        }
        x = centerX + radius * px;
        y = centerY + radius * py;
        break;
      case "hexagon":
        theta += Math.PI / 3; // Flat top
        x = centerX + radius * Math.cos(theta);
        y = centerY + radius * Math.sin(theta);
        break;
      default:
        x = centerX + radius * Math.cos(theta);
        y = centerY + radius * Math.sin(theta);
    }
    points.push({ x, y });
  }
  return points;
};

// ==================== MAIN COMPONENT ====================
const DrawingGame = () => {
  const { user, isDarkMode } = useAuth();
  // State Management
  const [isInitialized, setIsInitialized] = useState(false);
  const [calibrationDone, setCalibrationDone] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibTimeLeft, setCalibTimeLeft] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [usingMouseFallback, setUsingMouseFallback] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [statusMessage, setStatusMessage] = useState({
    text: "",
    visible: false,
  });

  // Game Stats
  const [score, setScore] = useState(0);
  const [reps, setReps] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [successRate, setSuccessRate] = useState(0);

  // Hand State
  const [leftHandVisible, setLeftHandVisible] = useState(false);
  const [rightHandVisible, setRightHandVisible] = useState(false);
  const [leftHandClosed, setLeftHandClosed] = useState(false);
  const [rightHandClosed, setRightHandClosed] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  // Refs
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const handsModuleRef = useRef(null);
  const poseModuleRef = useRef(null);
  const cameraRef = useRef(null);
  const sessionStartRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const calibIntervalRef = useRef(null);
  const lastDrawTimeRef = useRef(0);
  const logsRef = useRef([]);
  const attemptsRef = useRef(0);
  const successesRef = useRef(0);
  const scoreRef = useRef(score);
  const isInitializedRef = useRef(isInitialized);
  const usingMouseFallbackRef = useRef(usingMouseFallback);
  const showDebugRef = useRef(showDebug);
  const isMountedRef = useRef(true);

  // Game State Refs
  const handStateRef = useRef({
    Left: {
      pos: null,
      smoothPos: null,
      closed: false,
      closedFrames: 0,
      openFrames: 0,
      landmarks: null,
      elbow: null,
      shoulder: null,
      visible: false,
    },
    Right: {
      pos: null,
      smoothPos: null,
      closed: false,
      closedFrames: 0,
      openFrames: 0,
      landmarks: null,
      elbow: null,
      shoulder: null,
      visible: false,
    },
  });

  const calibrationRef = useRef({
    active: false,
    done: false,
    minX: 1,
    maxX: 0,
    minY: 1,
    maxY: 0,
    centerX: 0.5,
    centerY: 0.5,
    maxReachNorm: 0.2,
  });

  const shapeRef = useRef(null);
  const currentTargetIdxRef = useRef(0);
  const drawnPathRef = useRef([]);
  const lastPoseResultsRef = useRef(null);
  const detectionCounterRef = useRef(0);

  // ==================== UTILITY FUNCTIONS ====================
  const distNorm = (a, b) => {
    if (!a || !b) return 999;
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const smoothPos = (prev, next) => {
    if (!prev) return { x: next.x, y: next.y };
    return {
      x: prev.x * (1 - CONFIG.SMOOTH_ALPHA) + next.x * CONFIG.SMOOTH_ALPHA,
      y: prev.y * (1 - CONFIG.SMOOTH_ALPHA) + next.y * CONFIG.SMOOTH_ALPHA,
    };
  };
  const nowSec = () => {
    return sessionStartRef.current
      ? Math.floor((Date.now() - sessionStartRef.current) / 1000)
      : 0;
  };
  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };
  const showStatus = (msg, duration = 2000) => {
    setStatusMessage({ text: msg, visible: true });
    setTimeout(() => setStatusMessage({ text: "", visible: false }), duration);
  };

  // ==================== SPAWN SHAPE ====================
  const spawnShape = useCallback(() => {
    const type = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const points = generateShapePoints(type);
    shapeRef.current = {
      type,
      points,
      drawingHand: null,
      startTime: Date.now(),
    };
    currentTargetIdxRef.current = 0;
    drawnPathRef.current = [];

    logsRef.current.push({
      timestamp: nowSec(),
      event: "spawn_shape",
      shape_type: type,
      num_points: points.length,
      score: scoreRef.current,
    });
  }, []);

  // ==================== MEDIAPIPE HANDLERS ====================
  const onHandsResults = useCallback((results) => {
    const handState = handStateRef.current;

    handState.Left.visible = false;
    handState.Right.visible = false;
    handState.Left.landmarks = null;
    handState.Right.landmarks = null;
    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const lm = results.multiHandLandmarks[i];
        const label = results.multiHandedness[i].label;

        const palmCenter = {
          x: (lm[0].x + lm[5].x + lm[9].x + lm[13].x + lm[17].x) / 5,
          y: (lm[0].y + lm[5].y + lm[9].y + lm[13].y + lm[17].y) / 5,
        };
        const rawPos = { x: lm[8].x, y: lm[8].y };
        handState[label].pos = rawPos;
        handState[label].smoothPos = smoothPos(
          handState[label].smoothPos,
          rawPos,
        );
        handState[label].landmarks = lm;
        handState[label].visible = true;
        // Grasp detection
        const fingerPairs = [
          [8, 6],
          [12, 10],
          [16, 14],
          [20, 18],
        ];
        let curledFingers = 0;
        fingerPairs.forEach(([tipIdx, midIdx]) => {
          if (lm[tipIdx].y > lm[midIdx].y + 0.02) curledFingers++;
        });

        const thumbTipPoint = lm[4];
        const wrist = lm[0];
        const middleBase = lm[9];
        const thumbToPalm = Math.hypot(
          thumbTipPoint.x - palmCenter.x,
          thumbTipPoint.y - palmCenter.y,
        );
        const handSize =
          Math.hypot(middleBase.x - wrist.x, middleBase.y - wrist.y) || 0.05;
        const normalizedThumbDist = thumbToPalm / handSize;
        const thumbClosed = normalizedThumbDist < 0.6;

        const fingerSpread = Math.hypot(lm[8].x - lm[20].x, lm[8].y - lm[20].y);
        const normalizedSpread = fingerSpread / handSize;
        const tightSpread = normalizedSpread < 0.7;

        const allTips = [4, 8, 12, 16, 20].map((idx) => lm[idx]);
        let avgDistToPalm = 0;
        allTips.forEach((tip) => {
          avgDistToPalm += Math.hypot(
            tip.x - palmCenter.x,
            tip.y - palmCenter.y,
          );
        });
        avgDistToPalm /= allTips.length;
        const normalizedCompactness = avgDistToPalm / handSize;
        const veryCompact = normalizedCompactness < 0.8;

        const isClosed =
          curledFingers === 4 ||
          (curledFingers >= 3 && thumbClosed) ||
          (curledFingers >= 2 && thumbClosed && tightSpread) ||
          (veryCompact && tightSpread && thumbClosed);

        if (i === 0 && showDebugRef.current) {
          setDebugInfo(`${label} Hand
Curled: ${curledFingers}/4
Thumb: ${thumbClosed ? "TUCKED" : "OUT"} (${normalizedThumbDist.toFixed(2)})
Spread: ${tightSpread ? "TIGHT" : "WIDE"} (${normalizedSpread.toFixed(2)})
Compact: ${veryCompact ? "YES" : "NO"} (${normalizedCompactness.toFixed(2)})
State: ${isClosed ? "🔴 CLOSED" : "🟢 OPEN"}`);
        }
        if (isClosed) {
          handState[label].closedFrames = Math.min(
            handState[label].closedFrames + 1,
            CONFIG.STABLE_FRAMES + 2,
          );
          handState[label].openFrames = 0;
        } else {
          handState[label].openFrames = Math.min(
            handState[label].openFrames + 1,
            CONFIG.STABLE_FRAMES + 2,
          );
          handState[label].closedFrames = 0;
        }
        handState[label].closed =
          handState[label].closedFrames >= CONFIG.STABLE_FRAMES;
      }
    }
    setLeftHandVisible(handState.Left.visible);
    setRightHandVisible(handState.Right.visible);
    setLeftHandClosed(handState.Left.closed);
    setLeftHandClosed(handState.Left.closed);
    setRightHandClosed(handState.Right.closed);

    // Auto-finish calibration if hands are detected early
    if (
      calibrationRef.current.active &&
      (handState.Left.visible || handState.Right.visible)
    ) {
      detectionCounterRef.current++;
      if (detectionCounterRef.current > 45) {
        // ~1.5 seconds at 30fps
        if (calibIntervalRef.current) clearInterval(calibIntervalRef.current);
        finishCalibration();
        detectionCounterRef.current = 0;
      }
    } else {
      detectionCounterRef.current = 0;
    }
  }, []);

  const onPoseResults = useCallback((results) => {
    lastPoseResultsRef.current = results;
    const handState = handStateRef.current;

    if (results.poseLandmarks) {
      const pl = results.poseLandmarks;

      const update = (label, shoulderIdx, elbowIdx) => {
        if (pl[shoulderIdx] && pl[shoulderIdx].visibility > 0.5) {
          const shoulder = { x: pl[shoulderIdx].x, y: pl[shoulderIdx].y };
          handState[label].shoulder = smoothPos(
            handState[label].shoulder,
            shoulder,
          );
        }
        if (pl[elbowIdx] && pl[elbowIdx].visibility > 0.5) {
          const elbow = { x: pl[elbowIdx].x, y: pl[elbowIdx].y };
          handState[label].elbow = smoothPos(handState[label].elbow, elbow);
        }
      };
      update("Left", 11, 13);
      update("Right", 12, 14);
      if (calibrationRef.current.active) {
        ["Left", "Right"].forEach((label) => {
          if (handState[label].smoothPos) {
            calibrationRef.current.minX = Math.min(
              calibrationRef.current.minX,
              handState[label].smoothPos.x,
            );
            calibrationRef.current.maxX = Math.max(
              calibrationRef.current.maxX,
              handState[label].smoothPos.x,
            );
            calibrationRef.current.minY = Math.min(
              calibrationRef.current.minY,
              handState[label].smoothPos.y,
            );
            calibrationRef.current.maxY = Math.max(
              calibrationRef.current.maxY,
              handState[label].smoothPos.y,
            );
          }
        });
      }
    }
  }, []);

  // ==================== SETUP MEDIAPIPE ====================
  const setupMediaPipe = useCallback(async () => {
    if (handsModuleRef.current || poseModuleRef.current) {
      console.log("MediaPipe already initialized, skipping.");
      return;
    }
    if (!Hands || !Pose || !Camera) {
      console.error("MediaPipe libraries not loaded");
      return;
    }
    try {
      handsModuleRef.current = new Hands({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      });
      handsModuleRef.current.setOptions({
        selfieMode: true,
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      handsModuleRef.current.onResults(onHandsResults);
      poseModuleRef.current = new Pose({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
      });
      poseModuleRef.current.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: true,
      });
      poseModuleRef.current.onResults(onPoseResults);
      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          if (
            isMountedRef.current &&
            !usingMouseFallbackRef.current &&
            isInitializedRef.current &&
            handsModuleRef.current
          ) {
            try {
              await handsModuleRef.current.send({ image: videoRef.current });
              if (poseModuleRef.current)
                await poseModuleRef.current.send({ image: videoRef.current });
            } catch (err) {
              console.warn("MediaPipe error:", err);
            }
          }
        },
        width: 640,
        height: 480,
      });
      await cameraRef.current.start();
      if (isMountedRef.current) {
        setIsInitialized(true);
        isInitializedRef.current = true;
        console.log("✓ Camera started successfully");
      }
    } catch (e) {
      console.warn("Camera failed:", e);
      alert(
        "Camera unavailable. Enable mouse fallback to test without webcam.",
      );
    }
  }, [onHandsResults, onPoseResults]);

  // ==================== GAME LOGIC ====================
  const gameLogicTick = useCallback(() => {
    if (!shapeRef.current || !sessionStartRef.current) return;
    const handState = handStateRef.current;
    const shape = shapeRef.current;
    ["Left", "Right"].forEach((label) => {
      const hand = handState[label];
      if (!hand.smoothPos || !hand.visible) return;
      const pos = hand.smoothPos;
      const isDrawing = shape.drawingHand === label;
      if (
        !shape.drawingHand &&
        hand.closed &&
        currentTargetIdxRef.current === 0
      ) {
        if (distNorm(pos, shape.points[0]) < CONFIG.PICK_DISTANCE) {
          shape.drawingHand = label;
          drawnPathRef.current = [{ ...pos }];
          currentTargetIdxRef.current = 1;
          logsRef.current.push({
            timestamp: nowSec(),
            event: "start_drawing",
            shape_type: shape.type,
            hand: label,
          });
          showStatus(
            `✏️ ${label} hand started drawing! Follow the points in order.`,
            1500,
          );
        }
      } else if (isDrawing) {
        if (hand.closed) {
          drawnPathRef.current.push({ ...pos });
          // Advance targets if close
          while (
            currentTargetIdxRef.current < shape.points.length &&
            distNorm(pos, shape.points[currentTargetIdxRef.current]) <
              CONFIG.TRACE_TOLERANCE
          ) {
            currentTargetIdxRef.current++;
          }
          if (currentTargetIdxRef.current >= shape.points.length) {
            showStatus(
              "All points reached! Open hand to complete the shape.",
              1000,
            );
          }
        } else {
          // Open hand - end drawing
          shape.drawingHand = null;
          const hits = currentTargetIdxRef.current;
          const total = shape.points.length;
          const completion = hits / total;
          logsRef.current.push({
            timestamp: nowSec(),
            event: "end_drawing",
            shape_type: shape.type,
            hand: label,
            hits,
            total,
            completion,
          });
          if (completion >= CONFIG.MIN_COMPLETION) {
            const newScore = scoreRef.current + CONFIG.SCORE_PER_SHAPE;
            setScore(newScore);
            scoreRef.current = newScore;
            setReps((prev) => prev + 1);
            successesRef.current++;
            attemptsRef.current++;
            logsRef.current.push({
              timestamp: nowSec(),
              event: "drawing_success",
              shape_type: shape.type,
              hand: label,
              hits,
              total,
              score: newScore,
            });
            const newRate = (
              (successesRef.current / attemptsRef.current) *
              100
            ).toFixed(0);
            setSuccessRate(newRate);
            showStatus(
              `✅ Shape completed! ${Math.round(completion * 100)}% accuracy +${CONFIG.SCORE_PER_SHAPE} points`,
              2000,
            );
            spawnShape();
          } else {
            attemptsRef.current++;
            logsRef.current.push({
              timestamp: nowSec(),
              event: "drawing_fail",
              shape_type: shape.type,
              hand: label,
              hits,
              total,
              completion,
            });
            const newRate = (
              (successesRef.current / attemptsRef.current) *
              100
            ).toFixed(0);
            setSuccessRate(newRate);
            showStatus(
              `⚠️ Incomplete trace: ${Math.round(completion * 100)}% - Close hand near start to retry.`,
              2000,
            );
            currentTargetIdxRef.current = 0;
            drawnPathRef.current = [];
          }
        }
      }
    });
  }, [spawnShape]);

  // ==================== DRAWING ====================
  const drawOverlay = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas || !isMountedRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;
    const scale = window.devicePixelRatio || 1;

    // Draw pose points
    if (lastPoseResultsRef.current?.poseLandmarks) {
      const pl = lastPoseResultsRef.current.poseLandmarks;
      [
        [11, "L-Sh"],
        [12, "R-Sh"],
        [13, "L-El"],
        [14, "R-El"],
      ].forEach(([idx]) => {
        if (!pl[idx] || pl[idx].visibility < 0.5) return;
        const x = 10;
        const y = 2;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 1);
        ctx.fillStyle = "rgba(255, 200, 0, 0.8)";
        ctx.fill();
      });
    }

    // Draw hands
    const handState = handStateRef.current;
    ["Left", "Right"].forEach((label) => {
      const hand = handState[label];
      if (!hand.landmarks || !hand.visible) return;
      const lm = hand.landmarks;
      const color = hand.closed
        ? "rgba(220, 50, 50, 0.9)"
        : "rgba(50, 200, 80, 0.9)";

      const palmCenter = {
        x: (lm[0].x + lm[5].x + lm[9].x + lm[13].x + lm[17].x) / 5,
        y: (lm[0].y + lm[5].y + lm[9].y + lm[13].y + lm[17].y) / 5,
      };

      const connections = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [0, 5],
        [5, 6],
        [6, 7],
        [7, 8],
        [0, 9],
        [9, 10],
        [10, 11],
        [11, 12],
        [0, 13],
        [13, 14],
        [14, 15],
        [15, 16],
        [0, 17],
        [17, 18],
        [18, 19],
        [19, 20],
        [5, 9],
        [9, 13],
        [13, 17],
      ];

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      connections.forEach(([start, end]) => {
        const p1 = lm[start];
        const p2 = lm[end];
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      });

      lm.forEach((landmark, i) => {
        const x = landmark.x * w;
        const y = landmark.y * h;
        ctx.beginPath();

        let radius = 4;
        if (i === 8) radius = 10;
        else if ([4, 12, 16, 20].includes(i)) radius = 7;
        else if (i === 0) radius = 6;

        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if ([0, 4, 8, 12, 16, 20].includes(i)) {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      const pcx = palmCenter.x * w;
      const pcy = palmCenter.y * h;
      ctx.beginPath();
      ctx.arc(pcx, pcy, 16, 0, Math.PI * 2);
      ctx.strokeStyle = hand.closed ? "#ff6b6b" : "#51cf66";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pcx - 12, pcy);
      ctx.lineTo(pcx + 12, pcy);
      ctx.moveTo(pcx, pcy - 12);
      ctx.lineTo(pcx, pcy + 12);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pcx, pcy, 4, 0, Math.PI * 2);
      ctx.fillStyle = hand.closed ? "#ff6b6b" : "#51cf66";
      ctx.fill();
      const stateText = hand.closed ? "CLOSED" : "OPEN";
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(pcx + 20, pcy - 16, 120, 26);

      ctx.fillStyle = hand.closed ? "#ff6b6b" : "#51cf66";
      ctx.font = "bold 14px Arial";
      ctx.fillText(`${label} ${stateText}`, pcx + 26, pcy);

      // Draw hand cursor using smoothPos (index tip)
      if (hand.smoothPos) {
        const px = hand.smoothPos.x * w;
        const py = hand.smoothPos.y * h;
        ctx.beginPath();
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.arc(px + 2, py + 2, 14 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = hand.closed
          ? "rgba(220, 50, 50, 0.95)"
          : "rgba(50, 200, 80, 0.95)";
        ctx.arc(px, py, 14 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3 * scale;
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = `bold ${12 * scale}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label[0], px, py);
      }
    });

    // Draw game elements (shape, points, path)
    if (shapeRef.current) {
      const shape = shapeRef.current;
      // Draw shape outline
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x * w, shape.points[0].y * h);
      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i].x * w, shape.points[i].y * h);
      }
      ctx.closePath();
      ctx.stroke();

      // Draw points
      shape.points.forEach((p, i) => {
        const px = p.x * w;
        const py = p.y * h;
        let fillColor =
          i < currentTargetIdxRef.current
            ? "#28a745" // green for hit
            : i === currentTargetIdxRef.current
              ? "#dc3545" // red for current
              : "#007bff"; // blue for future
        ctx.beginPath();
        ctx.fillStyle = fillColor;
        ctx.arc(px, py, 8 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
      });

      // Draw drawn path
      if (drawnPathRef.current.length > 1) {
        ctx.strokeStyle = shape.drawingHand ? "#ff9500" : "#6c757d"; // orange if active, gray if not
        ctx.lineWidth = 4 * scale;
        ctx.beginPath();
        ctx.moveTo(
          drawnPathRef.current[0].x * w,
          drawnPathRef.current[0].y * h,
        );
        for (let i = 1; i < drawnPathRef.current.length; i++) {
          ctx.lineTo(
            drawnPathRef.current[i].x * w,
            drawnPathRef.current[i].y * h,
          );
        }
        ctx.stroke();
      }
    }
  }, []);

  const syncCanvasSizes = useCallback(() => {
    if (overlayRef.current && videoRef.current && isMountedRef.current) {
      if (overlayRef.current.width !== videoRef.current.videoWidth) {
        overlayRef.current.width = videoRef.current.videoWidth || 640;
        overlayRef.current.height = videoRef.current.videoHeight || 480;
      }
    }
  }, []);

  // ==================== MAIN LOOP ====================
  const mainLoop = useCallback(() => {
    if (!isMountedRef.current) return;
    const now = Date.now();
    const drawInterval = 1000 / CONFIG.DRAW_FPS;

    if (now - lastDrawTimeRef.current >= drawInterval) {
      syncCanvasSizes();
      drawOverlay();
      lastDrawTimeRef.current = now;
    }

    gameLogicTick();
    requestAnimationFrame(mainLoop);
  }, [syncCanvasSizes, drawOverlay, gameLogicTick]);

  // ==================== EVENT HANDLERS ====================
  const handleStartCalibration = () => {
    calibrationRef.current.active = true;
    calibrationRef.current.minX = 1;
    calibrationRef.current.maxX = 0;
    calibrationRef.current.minY = 1;
    calibrationRef.current.maxY = 0;
    detectionCounterRef.current = 0;

    setIsCalibrating(true);
    setCalibTimeLeft(7); // Changed from CONFIG.CALIBRATION_SECONDS to 7

    // Auto-advance if landmarks are already stable
    const checkStableInterval = setInterval(() => {
      if (calibrationRef.current.maxX > 0) {
        clearInterval(checkStableInterval);
        clearInterval(calibIntervalRef.current);
        finishCalibration();
      }
    }, 500);

    calibIntervalRef.current = setInterval(() => {
      setCalibTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(calibIntervalRef.current);
          clearInterval(checkStableInterval);
          finishCalibration();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishCalibration = () => {
    calibrationRef.current.active = false;
    setIsCalibrating(false);

    calibrationRef.current.centerX =
      (calibrationRef.current.minX + calibrationRef.current.maxX) / 2;
    calibrationRef.current.centerY =
      (calibrationRef.current.minY + calibrationRef.current.maxY) / 2;
    const dx = Math.max(
      Math.abs(calibrationRef.current.centerX - calibrationRef.current.minX),
      Math.abs(calibrationRef.current.centerX - calibrationRef.current.maxX),
    );
    const dy = Math.max(
      Math.abs(calibrationRef.current.centerY - calibrationRef.current.minY),
      Math.abs(calibrationRef.current.centerY - calibrationRef.current.maxY),
    );
    calibrationRef.current.maxReachNorm = Math.sqrt(dx * dx + dy * dy) || 0.2;
    calibrationRef.current.done = true;

    setCalibrationDone(true);
    logsRef.current.push({
      timestamp: 0,
      event: "calibration_complete",
      calibration: calibrationRef.current,
    });
    showStatus("✓ Calibration complete! Ready to start.");
  };

  const handleStartSession = () => {
    if (!calibrationDone) {
      if (!window.confirm("Calibration recommended. Continue anyway?")) return;
    }

    setScore(0);
    scoreRef.current = 0;
    setReps(0);
    attemptsRef.current = 0;
    successesRef.current = 0;
    logsRef.current = [];
    sessionStartRef.current = Date.now();

    spawnShape();
    setTimeRemaining(CONFIG.SESSION_SECONDS);
    setSuccessRate(0);
    setIsSessionActive(true);

    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      const remaining = Math.max(0, CONFIG.SESSION_SECONDS - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(timerIntervalRef.current);
        handleEndSession();
      }
    }, 1000);

    logsRef.current.push({ timestamp: 0, event: "session_start" });
    showStatus(
      "🎮 Session started! Close hand near first point to begin tracing.",
      3000,
    );
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    logsRef.current.push({
      timestamp: nowSec(),
      event: "session_end",
      score: scoreRef.current,
      reps,
    });
    const successRateVal =
      attemptsRef.current > 0
        ? ((successesRef.current / attemptsRef.current) * 100).toFixed(1)
        : 0;
    alert(
      `Session Complete!\n\nScore: ${scoreRef.current}\nShapes Completed: ${reps}\nSuccess Rate: ${successRateVal}%\n\nDownload CSV to save your data.`,
    );
  };

  const handleDownloadCSV = () => {
    const headers = [
      "timestamp_sec",
      "event",
      "shape_type",
      "hand",
      "hits",
      "total",
      "completion",
      "score",
    ];
    const rows = [headers.join(",")];

    logsRef.current.forEach((log) => {
      const row = [
        log.timestamp ?? "",
        log.event ?? "",
        log.shape_type ?? "",
        log.hand ?? "",
        log.hits ?? "",
        log.total ?? "",
        log.completion ?? "",
        log.score ?? "",
      ];
      rows.push(row.join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shape-drawing-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    window.location.reload();
  };

  const handleMouseFallbackChange = (e) => {
    const checked = e.target.checked;
    setUsingMouseFallback(checked);
    usingMouseFallbackRef.current = checked;
    if (checked) {
      alert(
        "Mouse fallback enabled. Click/drag on video to control right hand.",
      );
      handStateRef.current.Right.visible = true;
      setRightHandVisible(true);
    } else {
      handStateRef.current.Right.visible = false;
      setRightHandVisible(false);
    }
  };

  const handleOverlayMouseMove = (e) => {
    if (!usingMouseFallbackRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const pos = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
    handStateRef.current.Right.smoothPos = smoothPos(
      handStateRef.current.Right.smoothPos,
      pos,
    );
    handStateRef.current.Right.visible = true;
    setRightHandVisible(true);
  };

  const handleOverlayMouseDown = () => {
    if (!usingMouseFallbackRef.current) return;
    handStateRef.current.Right.closedFrames = CONFIG.STABLE_FRAMES;
    handStateRef.current.Right.openFrames = 0;
    handStateRef.current.Right.closed = true;
    setRightHandClosed(true);
  };

  const handleOverlayMouseUp = () => {
    if (!usingMouseFallbackRef.current) return;
    handStateRef.current.Right.openFrames = CONFIG.STABLE_FRAMES;
    handStateRef.current.Right.closedFrames = 0;
    handStateRef.current.Right.closed = false;
    setRightHandClosed(false);
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    isInitializedRef.current = isInitialized;
  }, [isInitialized]);

  useEffect(() => {
    usingMouseFallbackRef.current = usingMouseFallback;
  }, [usingMouseFallback]);

  useEffect(() => {
    showDebugRef.current = showDebug;
  }, [showDebug]);

  useEffect(() => {
    setupMediaPipe();

    const loopId = requestAnimationFrame(mainLoop);
    const handleKeyDown = (e) => {
      if (e.key === "d" || e.key === "D") {
        setShowDebug((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      isMountedRef.current = false;
      cancelAnimationFrame(loopId);
      document.removeEventListener("keydown", handleKeyDown);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (calibIntervalRef.current) clearInterval(calibIntervalRef.current);
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {
          console.warn("Error stopping camera:", e);
        }
      }
    };
  }, [setupMediaPipe, mainLoop]);

  // ==================== RENDER ====================
  const styles = getStyles(isDarkMode);
  return (
    <div style={styles.container}>
      <div style={styles.topPanel}>
        <div style={styles.topLeft}>
          <h1 style={styles.title}>✏️ Shape Tracing – Drawing Rehab</h1>
          <p style={styles.muted}>
            Upper limb rehabilitation game: Close hand to start tracing at first
            point, keep closed to follow points in order, open hand after last
            point to complete. 5-minute therapeutic session.
          </p>
        </div>
        <div style={styles.topRight}>
          <div style={styles.controls}>
            <button
              onClick={handleStartCalibration}
              style={styles.controlButton}
              disabled={isCalibrating}
            >
              📏 Start 7s Calibration
            </button>
            <button
              onClick={handleStartSession}
              style={{ ...styles.controlButton }}
              // disabled={!calibrationDone || isSessionActive}
            >
              ▶️ Start 5min Session
            </button>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={usingMouseFallback}
                onChange={handleMouseFallbackChange}
                style={styles.checkbox}
              />
              <span>Use mouse fallback (if webcam fails)</span>
            </label>
          </div>
          <div style={styles.stats}>
            <div style={styles.statItem}>
              <div style={styles.statLabel}>Score</div>
              <div style={styles.statValue}>{score}</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statLabel}>Shapes</div>
              <div style={styles.statValue}>{reps}</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statLabel}>Timer</div>
              <div style={styles.statValue}>{formatTime(timeRemaining)}</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statLabel}>Success</div>
              <div style={styles.statValue}>{successRate}%</div>
            </div>
          </div>
          <div style={styles.actions}>
            <button onClick={handleDownloadCSV} style={styles.actionButton}>
              💾 Download CSV
            </button>
            <button onClick={handleReset} style={styles.actionButton}>
              🔄 Reset
            </button>
          </div>
        </div>
      </div>
      <div style={styles.videoWrap}>
        <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
        <canvas
          ref={overlayRef}
          style={styles.overlay}
          onMouseMove={handleOverlayMouseMove}
          onMouseDown={handleOverlayMouseDown}
          onMouseUp={handleOverlayMouseUp}
        />

        {isCalibrating && (
          <div style={styles.calibOverlay}>
            <div style={styles.calibText}>
              Calibrating... {calibTimeLeft}s - Move to corners & center!
            </div>
          </div>
        )}

        <div style={styles.handStatus}>
          {leftHandVisible && (
            <div
              style={{
                ...styles.handIndicator,
                ...(leftHandClosed ? styles.handClosed : styles.handOpen),
              }}
            >
              <span style={styles.dot}></span>
              <span>Left - {leftHandClosed ? "CLOSED 🔴" : "OPEN 🟢"}</span>
            </div>
          )}
          {rightHandVisible && (
            <div
              style={{
                ...styles.handIndicator,
                ...(rightHandClosed ? styles.handClosed : styles.handOpen),
              }}
            >
              <span style={styles.dot}></span>
              <span>Right - {rightHandClosed ? "CLOSED 🔴" : "OPEN 🟢"}</span>
            </div>
          )}
        </div>

        {showDebug && debugInfo && (
          <div style={styles.debugPanel}>
            <pre style={{ margin: 0, fontSize: "11px" }}>{debugInfo}</pre>
          </div>
        )}

        {statusMessage.visible && (
          <div style={styles.statusMessage}>{statusMessage.text}</div>
        )}
      </div>
      <div style={styles.note}>
        <strong style={styles.noteTitle}>How to play:</strong>•{" "}
        <strong style={{ color: "#dc3545" }}>CLOSE HAND (fist)</strong> near
        first point (red) to start tracing 🔴
        <br />
        • Keep closed, move to follow points in order (green when hit)
        <br />• <strong style={{ color: "#28a745" }}>OPEN HAND</strong> after
        last point to complete 🟢
        <br />
        • Orange line shows your trace path
        <br />• Press <strong>'D'</strong> to show debug metrics
      </div>
    </div>
  );
};

// ==================== STYLES ====================
const getStyles = (isDarkMode) => ({
  container: {
    position: "relative",
    height: "100vh",
    background: isDarkMode ? "#000" : "linear-gradient(#eaf7ea, #f6faf3)",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial',
    overflow: "hidden",
  },
  topPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "12px",
    background: isDarkMode ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    borderBottom: isDarkMode
      ? "1px solid rgba(255, 255, 255, 0.1)"
      : "1px solid rgba(0, 0, 0, 0.1)",
    gap: "12px",
  },
  topLeft: {
    flex: 1,
  },
  topRight: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "300px",
  },
  title: {
    color: isDarkMode ? "#4ade80" : "#2f7a2f",
    margin: "0 0 8px",
    fontSize: "22px",
    fontWeight: "800",
  },
  muted: {
    color: isDarkMode ? "#94a3b8" : "#575f56",
    fontSize: "13px",
    margin: 0,
    lineHeight: 1.4,
  },
  videoWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: "#111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    transform: "scaleX(-1)",
  },
  overlay: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "auto",
    cursor: "crosshair",
  },
  calibOverlay: {
    position: "absolute",
    left: "20px",
    top: "20px",
    padding: "16px 24px",
    background: isDarkMode
      ? "rgba(30, 41, 59, 0.95)"
      : "rgba(255, 255, 255, 0.95)",
    borderRadius: "16px",
    zIndex: 10,
    fontSize: "14px",
    fontWeight: "700",
    color: isDarkMode ? "#f8fafc" : "#1e293b",
    maxWidth: "320px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    border: isDarkMode ? "1px solid rgba(255,255,255,0.1)" : "none",
  },
  calibText: {
    margin: 0,
  },
  handStatus: {
    position: "absolute",
    bottom: "8px",
    left: "8px",
    display: "flex",
    gap: "8px",
    zIndex: 5,
  },
  handIndicator: {
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
  },
  handClosed: {
    background: "#dc3545",
  },
  handOpen: {
    background: "#28a745",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "white",
  },
  debugPanel: {
    position: "absolute",
    top: "8px",
    right: "8px",
    padding: "8px",
    background: "rgba(0, 0, 0, 0.85)",
    color: "#0f0",
    borderRadius: "4px",
    fontSize: "11px",
    fontFamily: "monospace",
    maxWidth: "200px",
    zIndex: 10,
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  controlButton: {
    padding: "11px",
    borderRadius: "8px",
    border: 0,
    background: isDarkMode ? "#10b981" : "#2f7a2f",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    transition: "all 0.2s",
  },
  buttonDisabled: {
    background: isDarkMode ? "#374151" : "#ccc",
    cursor: "not-allowed",
    opacity: 0.6,
  },
  checkboxLabel: {
    fontSize: "13px",
    color: isDarkMode ? "#94a3b8" : "#575f56",
    marginTop: "6px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  checkbox: {
    cursor: "pointer",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  statItem: {
    padding: "10px",
    background: isDarkMode ? "#1e293b" : "#f9f9f9",
    borderRadius: "8px",
    border: isDarkMode ? "1px solid rgba(255,255,255,0.05)" : "1px solid #eee",
  },
  statLabel: {
    fontSize: "10px",
    color: isDarkMode ? "#64748b" : "#575f56",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: "800",
    marginBottom: "4px",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: 900,
    color: isDarkMode ? "#10b981" : "#2f7a2f",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  actionButton: {
    flex: 1,
    padding: "9px",
    borderRadius: "8px",
    border: 0,
    background: isDarkMode ? "#334155" : "#e8e8e8",
    color: isDarkMode ? "#f8fafc" : "#333",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    transition: "all 0.2s",
  },
  note: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    fontSize: "12px",
    color: isDarkMode ? "#94a3b8" : "#575f56",
    padding: "14px",
    background: isDarkMode ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.4)",
    backdropFilter: "blur(20px)",
    borderTop: isDarkMode
      ? "1px solid rgba(255, 255, 255, 0.1)"
      : "1px solid rgba(0, 0, 0, 0.05)",
    lineHeight: 1.6,
    borderLeft: `4px solid ${isDarkMode ? "#10b981" : "#2f7a2f"}`,
  },
  noteTitle: {
    color: isDarkMode ? "#10b981" : "#2f7a2f",
    display: "block",
    marginBottom: "4px",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statusMessage: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: isDarkMode
      ? "rgba(15, 23, 42, 0.98)"
      : "rgba(255, 255, 255, 0.95)",
    padding: "16px 32px",
    borderRadius: "16px",
    fontSize: "18px",
    fontWeight: 800,
    color: isDarkMode ? "#10b981" : "#2f7a2f",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
    zIndex: 100,
    pointerEvents: "none",
    border: `2px solid ${isDarkMode ? "#10b981" : "#2f7a2f"}`,
    animation: "slideDown 0.3s ease",
  },
});

export default DrawingGame;
