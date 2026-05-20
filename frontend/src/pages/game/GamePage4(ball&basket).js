import { Hands } from "@mediapipe/hands";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { gameService } from "../../services/gameService";
// ==================== CONFIGURATION ====================
const CONFIG = {
  SESSION_SECONDS: 300,
  CALIBRATION_SECONDS: 7,
  HAND_TEST_STEP_SECONDS: 3,
  MOVEMENT_CALIBRATION_SECONDS: 5,
  TRIAL_TIMEOUT_MS: 10000,
  PICK_DWELL_MS: 250,
  DROP_DWELL_MS: 250,
  GRID_ROWS: 3,
  GRID_COLS: 3,
  PICK_DISTANCE: 0.08,
  DROP_DISTANCE: 0.1,
  SCORE_PER_DROP: 10,
  SMOOTH_ALPHA: 0.7,
  STABLE_FRAMES: 2,
  DRAW_FPS: 30,
  SHOULDER_WARNING_DEG: 115,
};

const CALIBRATION_STEPS = [
  {
    id: "left_open",
    seconds: CONFIG.HAND_TEST_STEP_SECONDS,
    text: "Left hand: hold an open palm.",
  },
  {
    id: "left_close",
    seconds: CONFIG.HAND_TEST_STEP_SECONDS,
    text: "Left hand: make a fist.",
  },
  {
    id: "right_open",
    seconds: CONFIG.HAND_TEST_STEP_SECONDS,
    text: "Right hand: hold an open palm.",
  },
  {
    id: "right_close",
    seconds: CONFIG.HAND_TEST_STEP_SECONDS,
    text: "Right hand: make a fist.",
  },
  {
    id: "movement",
    seconds: CONFIG.MOVEMENT_CALIBRATION_SECONDS,
    text: "Reach toward the corners of your comfortable range.",
  },
];
// ==================== MAIN COMPONENT ====================
const GamePage2BallBasket = () => {
  const { isDarkMode } = useAuth();
  // State Management
  const [isInitialized, setIsInitialized] = useState(false);
  const [calibrationDone, setCalibrationDone] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibTimeLeft, setCalibTimeLeft] = useState(0);
  const [calibrationInstruction, setCalibrationInstruction] = useState("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [trialTimeRemaining, setTrialTimeRemaining] = useState(10);
  const [usingMouseFallback] = useState(false);
  const [assistiveMode, setAssistiveMode] = useState(false);
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
  // eslint-disable-next-line no-unused-vars
  const [debugInfo, setDebugInfo] = useState("");

  // Refs
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const gameCanvasRef = useRef(null);
  const handsModuleRef = useRef(null);
  const poseModuleRef = useRef(null);
  const cameraRef = useRef(null);
  const sessionStartRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const trialTimeoutRef = useRef(null);
  const trialStartTimeRef = useRef(null);
  const trialIdRef = useRef(0);
  const calibIntervalRef = useRef(null);
  const calibrationStepRef = useRef("idle");
  const lastDrawTimeRef = useRef(0);
  const logsRef = useRef([]);
  const attemptsRef = useRef(0);
  const successesRef = useRef(0);
  const scoreRef = useRef(score);
  const repsRef = useRef(0);
  const postureWarningsRef = useRef(0);
  const lastPostureWarningRef = useRef(0);
  const assistiveModeLeftRef = useRef(false);
  const assistiveModeRightRef = useRef(false);
  const isInitializedRef = useRef(isInitialized);
  const usingMouseFallbackRef = useRef(usingMouseFallback);
  const showDebugRef = useRef(showDebug);
  const isSavingRef = useRef(false);

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
      elbowAngle: null,
      shoulderAngle: null,
      trunkTwist: null,
      assistivePickTimer: 0,
      assistiveDropTimer: 0,
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
      elbowAngle: null,
      shoulderAngle: null,
      trunkTwist: null,
      assistivePickTimer: 0,
      assistiveDropTimer: 0,
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
    leftCanOpen: false,
    leftCanClose: false,
    rightCanOpen: false,
    rightCanClose: false,
  });

  const gridHolesRef = useRef([]);
  const fruitRef = useRef(null);
  const basketIdxRef = useRef(null);
  const lastPoseResultsRef = useRef(null);
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
  const vecSub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
  const vecDot = (a, b) => a.x * b.x + a.y * b.y;
  const vecMag = (v) => Math.hypot(v.x, v.y);
  const vecAngle = useCallback((a, b) => {
    const mag = vecMag(a) * vecMag(b);
    if (!mag) return 0;
    const cos = Math.max(-1, Math.min(1, vecDot(a, b) / mag));
    return Math.round((Math.acos(cos) * 180) / Math.PI);
  }, []);
  const nowSec = () => {
    return sessionStartRef.current
      ? Math.floor((Date.now() - sessionStartRef.current) / 1000)
      : 0;
  };
  const getHandLog = (label) => {
    if (!label) return {};
    const hand = handStateRef.current[label];
    return {
      hand: label,
      x_norm: hand.smoothPos?.x || "",
      y_norm: hand.smoothPos?.y || "",
      shoulder_x: hand.shoulder?.x || "",
      shoulder_y: hand.shoulder?.y || "",
      elbow_x: hand.elbow?.x || "",
      elbow_y: hand.elbow?.y || "",
      elbow_angle_deg: hand.elbowAngle ?? "",
      shoulder_angle_deg: hand.shoulderAngle ?? "",
      trunk_twist_deg: hand.trunkTwist ?? "",
      mode:
        label === "Left"
          ? assistiveModeLeftRef.current
            ? "ASSISTIVE"
            : "NORMAL"
          : assistiveModeRightRef.current
            ? "ASSISTIVE"
            : "NORMAL",
    };
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
  // ==================== SETUP GRID ====================
  const setupGrid = useCallback(() => {
    const holes = [];
    const marginX = 0.15,
      marginY = 0.15;

    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      for (let c = 0; c < CONFIG.GRID_COLS; c++) {
        const x = marginX + (c / (CONFIG.GRID_COLS - 1)) * (1 - 2 * marginX);
        const y = marginY + (r / (CONFIG.GRID_ROWS - 1)) * (1 - 2 * marginY);
        holes.push({ id: r * CONFIG.GRID_COLS + c, x, y });
      }
    }
    gridHolesRef.current = holes;
  }, []);
  // ==================== SPAWN FRUIT ====================
  const spawnFruit = useCallback(() => {
    if (!sessionStartRef.current || gridHolesRef.current.length === 0) return;

    if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);

    trialIdRef.current++;
    trialStartTimeRef.current = Date.now();
    setTrialTimeRemaining(Math.ceil(CONFIG.TRIAL_TIMEOUT_MS / 1000));

    let sourceIdx = Math.floor(Math.random() * gridHolesRef.current.length);
    let bIdx = Math.floor(Math.random() * gridHolesRef.current.length);
    while (bIdx === sourceIdx) {
      bIdx = Math.floor(Math.random() * gridHolesRef.current.length);
    }

    basketIdxRef.current = bIdx;
    fruitRef.current = {
      id: `F${Date.now()}`,
      sourceIdx,
      x: gridHolesRef.current[sourceIdx].x,
      y: gridHolesRef.current[sourceIdx].y,
      attachedTo: null,
    };

    logsRef.current.push({
      timestamp: nowSec(),
      event: "spawn",
      trial_id: trialIdRef.current,
      fruit_id: fruitRef.current.id,
      source: sourceIdx,
      basket: bIdx,
      score: scoreRef.current,
      assistiveModeLeft: assistiveModeLeftRef.current,
      assistiveModeRight: assistiveModeRightRef.current,
    });

    trialTimeoutRef.current = setTimeout(() => {
      if (!sessionStartRef.current || !fruitRef.current) return;

      attemptsRef.current++;
      const attachedHand = fruitRef.current.attachedTo;
      logsRef.current.push({
        timestamp: nowSec(),
        event: "timeout",
        trial_id: trialIdRef.current,
        fruit_id: fruitRef.current.id,
        source: fruitRef.current.sourceIdx,
        basket: basketIdxRef.current,
        success: false,
        trial_duration_sec: CONFIG.TRIAL_TIMEOUT_MS / 1000,
        ...getHandLog(attachedHand),
      });

      fruitRef.current.attachedTo = null;
      const newRate = successesRef.current
        ? ((successesRef.current / attemptsRef.current) * 100).toFixed(0)
        : 0;
      setSuccessRate(newRate);
      handStateRef.current.Left.assistivePickTimer = 0;
      handStateRef.current.Left.assistiveDropTimer = 0;
      handStateRef.current.Right.assistivePickTimer = 0;
      handStateRef.current.Right.assistiveDropTimer = 0;
      showStatus("Time up. A new fruit is ready.", 1500);
      spawnFruit();
    }, CONFIG.TRIAL_TIMEOUT_MS);
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
        const rawPos = { x: palmCenter.x, y: palmCenter.y };
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
          if (lm[tipIdx].y > lm[midIdx].y + 0.03) curledFingers++;
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
        const thumbClosed = normalizedThumbDist < 0.7;

        const fingerSpread = Math.hypot(lm[8].x - lm[20].x, lm[8].y - lm[20].y);
        const normalizedSpread = fingerSpread / handSize;
        const tightSpread = normalizedSpread < 0.8;

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
        const veryCompact = normalizedCompactness < 0.9;

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
State: ${isClosed ? "CLOSED" : "OPEN"}`);
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

        if (calibrationRef.current.active) {
          const step = calibrationStepRef.current;
          if (label === "Left" && step === "left_open" && !isClosed) {
            calibrationRef.current.leftCanOpen = true;
          }
          if (label === "Left" && step === "left_close" && isClosed) {
            calibrationRef.current.leftCanClose = true;
          }
          if (label === "Right" && step === "right_open" && !isClosed) {
            calibrationRef.current.rightCanOpen = true;
          }
          if (label === "Right" && step === "right_close" && isClosed) {
            calibrationRef.current.rightCanClose = true;
          }
        }
      }
    }
    setLeftHandVisible(handState.Left.visible);
    setRightHandVisible(handState.Right.visible);
    setLeftHandClosed(handState.Left.closed);
    setRightHandClosed(handState.Right.closed);
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

      ["Left", "Right"].forEach((label) => {
        const shoulderIdx = label === "Left" ? 11 : 12;
        const elbowIdx = label === "Left" ? 13 : 14;
        const shoulder = pl[shoulderIdx];
        const elbow = pl[elbowIdx];
        const hand = handState[label];

        if (
          !shoulder ||
          !elbow ||
          shoulder.visibility < 0.3 ||
          elbow.visibility < 0.3 ||
          !hand.smoothPos
        ) {
          hand.elbowAngle = null;
          hand.shoulderAngle = null;
          hand.trunkTwist = null;
          return;
        }

        const shoulderPoint = { x: shoulder.x, y: shoulder.y };
        const elbowPoint = { x: elbow.x, y: elbow.y };
        const upperArm = vecSub(elbowPoint, shoulderPoint);
        const foreArm = vecSub(hand.smoothPos, elbowPoint);

        hand.elbowAngle = vecAngle(upperArm, foreArm);
        hand.shoulderAngle = vecAngle(upperArm, { x: 0, y: 1 });
        hand.trunkTwist = vecAngle({ x: upperArm.x, y: 0 }, { x: 1, y: 0 });

        if (
          sessionStartRef.current &&
          hand.shoulderAngle > CONFIG.SHOULDER_WARNING_DEG &&
          Date.now() - lastPostureWarningRef.current > 3000
        ) {
          postureWarningsRef.current++;
          lastPostureWarningRef.current = Date.now();
          logsRef.current.push({
            timestamp: nowSec(),
            event: "posture_warning",
            warning: "shoulder_angle_high",
            ...getHandLog(label),
          });
          showStatus(
            "Try a slower, lower reach. Keep your shoulder relaxed.",
            1800,
          );
        }
      });

      if (
        calibrationRef.current.active &&
        calibrationStepRef.current === "movement"
      ) {
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
  }, [vecAngle]);
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
          if (!usingMouseFallbackRef.current && isInitializedRef.current) {
            await handsModuleRef.current.send({ image: videoRef.current });
            await poseModuleRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      await cameraRef.current.start();
      setIsInitialized(true);
      isInitializedRef.current = true;
      console.log("✓ Camera started successfully");
    } catch (e) {
      console.warn("Camera failed:", e);
      alert(
        "Camera unavailable. Enable mouse fallback to test without webcam.",
      );
    }
  }, [onHandsResults, onPoseResults]);
  // ==================== GAME LOGIC ====================
  const gameLogicTick = useCallback(() => {
    if (!fruitRef.current || !sessionStartRef.current) return;
    const handState = handStateRef.current;

    ["Left", "Right"].forEach((label) => {
      const hand = handState[label];
      if (!hand.smoothPos || !hand.visible || !fruitRef.current) return;

      const source = gridHolesRef.current[fruitRef.current.sourceIdx];
      const basket = gridHolesRef.current[basketIdxRef.current];
      const handDistToSource = distNorm(hand.smoothPos, source);
      const handDistToBasket = distNorm(hand.smoothPos, basket);
      const isAssistive =
        label === "Left"
          ? assistiveModeLeftRef.current
          : assistiveModeRightRef.current;

      if (!fruitRef.current.attachedTo) {
        const normalPick =
          !isAssistive &&
          hand.closedFrames >= CONFIG.STABLE_FRAMES &&
          handDistToSource < CONFIG.PICK_DISTANCE;

        if (isAssistive && handDistToSource < CONFIG.PICK_DISTANCE) {
          hand.assistivePickTimer += 16;
        } else {
          hand.assistivePickTimer = 0;
        }

        const assistivePick =
          isAssistive && hand.assistivePickTimer >= CONFIG.PICK_DWELL_MS;

        if (normalPick || assistivePick) {
          fruitRef.current.attachedTo = label;
          hand.assistivePickTimer = 0;
          logsRef.current.push({
            timestamp: nowSec(),
            event: "pick",
            trial_id: trialIdRef.current,
            fruit_id: fruitRef.current.id,
            source: fruitRef.current.sourceIdx,
            basket: basketIdxRef.current,
            ...getHandLog(label),
          });
          showStatus(`${label} hand grasped fruit.`, 1000);
        }
      }

      if (fruitRef.current.attachedTo === label) {
        const normalDrop =
          !isAssistive && hand.openFrames >= CONFIG.STABLE_FRAMES;

        if (isAssistive && handDistToBasket < CONFIG.DROP_DISTANCE) {
          hand.assistiveDropTimer += 16;
        } else {
          hand.assistiveDropTimer = 0;
        }

        const assistiveDrop =
          isAssistive && hand.assistiveDropTimer >= CONFIG.DROP_DWELL_MS;

        if (normalDrop || assistiveDrop) {
          const isSuccessfulDrop =
            isAssistive || handDistToBasket < CONFIG.DROP_DISTANCE;
          const trialDurationSec = trialStartTimeRef.current
            ? (Date.now() - trialStartTimeRef.current) / 1000
            : 0;

          if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);

          if (isSuccessfulDrop) {
            const newScore = scoreRef.current + CONFIG.SCORE_PER_DROP;
            setScore(newScore);
            scoreRef.current = newScore;
            setReps((prev) => {
              const next = prev + 1;
              repsRef.current = next;
              return next;
            });
            successesRef.current++;
            attemptsRef.current++;

            logsRef.current.push({
              timestamp: nowSec(),
              event: "drop_success",
              trial_id: trialIdRef.current,
              fruit_id: fruitRef.current.id,
              source: fruitRef.current.sourceIdx,
              basket: basketIdxRef.current,
              score: newScore,
              success: true,
              trial_duration_sec: Number(trialDurationSec.toFixed(2)),
              ...getHandLog(label),
            });

            const newRate = (
              (successesRef.current / attemptsRef.current) *
              100
            ).toFixed(0);
            setSuccessRate(newRate);
            hand.assistiveDropTimer = 0;
            hand.assistivePickTimer = 0;
            showStatus(`Success! +${CONFIG.SCORE_PER_DROP} points`, 1500);
            spawnFruit();
          } else {
            attemptsRef.current++;
            const missedFruit = fruitRef.current;
            fruitRef.current = null;

            logsRef.current.push({
              timestamp: nowSec(),
              event: "drop_miss",
              trial_id: trialIdRef.current,
              fruit_id: missedFruit.id,
              source: missedFruit.sourceIdx,
              basket: basketIdxRef.current,
              success: false,
              trial_duration_sec: Number(trialDurationSec.toFixed(2)),
              ...getHandLog(label),
            });

            const newRate = successesRef.current
              ? ((successesRef.current / attemptsRef.current) * 100).toFixed(0)
              : 0;
            setSuccessRate(newRate);
            hand.assistivePickTimer = 0;
            hand.assistiveDropTimer = 0;
            showStatus("Missed. Release over the basket.", 1500);
            setTimeout(spawnFruit, 900);
          }
        }
      }

      if (fruitRef.current?.attachedTo === label) {
        fruitRef.current.x = hand.smoothPos.x;
        fruitRef.current.y = hand.smoothPos.y;
      }
    });
  }, [spawnFruit]);
  // ==================== DRAWING ====================
  const drawOverlay = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;
    if (lastPoseResultsRef.current?.poseLandmarks) {
      const pl = lastPoseResultsRef.current.poseLandmarks;
      [
        [11, "L-Sh"],
        [12, "R-Sh"],
        [13, "L-El"],
        [14, "R-El"],
      ].forEach(([idx]) => {
        if (!pl[idx] || pl[idx].visibility < 0.5) return;
        const x = pl[idx].x * w;
        const y = pl[idx].y * h;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 200, 0, 0.8)";
        ctx.fill();
      });
    }
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
    });
  }, []);
  const drawGame = useCallback(() => {
    const canvas = gameCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;
    const scale = window.devicePixelRatio || 1;
    gridHolesRef.current.forEach((hole, idx) => {
      const px = hole.x * w;
      const py = hole.y * h;
      const r = Math.max(35 * scale, CONFIG.PICK_DISTANCE * Math.min(w, h));
      ctx.beginPath();
      ctx.fillStyle =
        idx === basketIdxRef.current
          ? "rgba(180, 255, 180, 0.9)"
          : "rgba(255, 255, 255, 0.7)";
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = idx === basketIdxRef.current ? "#2f7a2f" : "#999";
      ctx.lineWidth = 3 * scale;
      ctx.stroke();
      ctx.fillStyle = "#000";
      ctx.font = `${13 * scale}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(
        idx === basketIdxRef.current ? "🧺" : `${idx}`,
        px,
        py + 5 * scale,
      );
    });
    if (fruitRef.current) {
      const handState = handStateRef.current;
      let fx, fy;
      if (
        fruitRef.current.attachedTo &&
        handState[fruitRef.current.attachedTo].smoothPos
      ) {
        fx = handState[fruitRef.current.attachedTo].smoothPos.x * w;
        fy = handState[fruitRef.current.attachedTo].smoothPos.y * h;
      } else {
        fx = fruitRef.current.x * w;
        fy = fruitRef.current.y * h;
      }
      ctx.beginPath();
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.arc(fx + 2, fy + 2, 20 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "#ff6347";
      ctx.arc(fx, fy, 20 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#8b4513";
      ctx.fillRect(fx - 2, fy - 28 * scale, 4, 12 * scale);
    }
    const handState = handStateRef.current;
    ["Left", "Right"].forEach((label) => {
      const hand = handState[label];
      if (!hand.smoothPos || !hand.visible) return;
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
    });
  }, []);
  const syncCanvasSizes = useCallback(() => {
    if (overlayRef.current && videoRef.current) {
      if (overlayRef.current.width !== videoRef.current.videoWidth) {
        overlayRef.current.width = videoRef.current.videoWidth || 640;
        overlayRef.current.height = videoRef.current.videoHeight || 480;
      }
    }

    if (gameCanvasRef.current) {
      const targetW =
        gameCanvasRef.current.clientWidth * (window.devicePixelRatio || 1);
      const targetH =
        gameCanvasRef.current.clientHeight * (window.devicePixelRatio || 1);

      if (
        gameCanvasRef.current.width !== targetW ||
        gameCanvasRef.current.height !== targetH
      ) {
        gameCanvasRef.current.width = targetW;
        gameCanvasRef.current.height = targetH;
      }
    }
  }, []);
  // ==================== MAIN LOOP ====================
  const mainLoop = useCallback(() => {
    const now = Date.now();
    const drawInterval = 1000 / CONFIG.DRAW_FPS;

    if (now - lastDrawTimeRef.current >= drawInterval) {
      syncCanvasSizes();
      drawOverlay();
      drawGame();
      if (trialStartTimeRef.current && sessionStartRef.current) {
        const elapsed = Date.now() - trialStartTimeRef.current;
        setTrialTimeRemaining(
          Math.max(0, Math.ceil((CONFIG.TRIAL_TIMEOUT_MS - elapsed) / 1000)),
        );
      }
      lastDrawTimeRef.current = now;
    }

    gameLogicTick();
    requestAnimationFrame(mainLoop);
  }, [syncCanvasSizes, drawOverlay, drawGame, gameLogicTick]);
  // ==================== EVENT HANDLERS ====================
  const handleStartCalibration = () => {
    if (calibIntervalRef.current) clearInterval(calibIntervalRef.current);

    calibrationRef.current.active = true;
    calibrationRef.current.done = false;
    calibrationRef.current.minX = 1;
    calibrationRef.current.maxX = 0;
    calibrationRef.current.minY = 1;
    calibrationRef.current.maxY = 0;
    calibrationRef.current.leftCanOpen = false;
    calibrationRef.current.leftCanClose = false;
    calibrationRef.current.rightCanOpen = false;
    calibrationRef.current.rightCanClose = false;
    calibrationRef.current.step = CALIBRATION_STEPS[0].id;
    calibrationStepRef.current = CALIBRATION_STEPS[0].id;
    assistiveModeLeftRef.current = false;
    assistiveModeRightRef.current = false;

    setIsCalibrating(true);
    setCalibrationDone(false);
    setAssistiveMode(false);
    setCalibTimeLeft(CALIBRATION_STEPS[0].seconds);
    setCalibrationInstruction(CALIBRATION_STEPS[0].text);

    let stepIndex = 0;
    const startStep = (index) => {
      const step = CALIBRATION_STEPS[index];
      calibrationRef.current.step = step.id;
      calibrationStepRef.current = step.id;

      if (step.id === "movement") {
        calibrationRef.current.minX = 1;
        calibrationRef.current.maxX = 0;
        calibrationRef.current.minY = 1;
        calibrationRef.current.maxY = 0;
      }

      setCalibrationInstruction(step.text);
    };

    calibIntervalRef.current = setInterval(() => {
      setCalibTimeLeft((prev) => {
        if (prev <= 1) {
          stepIndex++;
          if (stepIndex >= CALIBRATION_STEPS.length) {
            clearInterval(calibIntervalRef.current);
            finishCalibration();
            return 0;
          }
          startStep(stepIndex);
          return CALIBRATION_STEPS[stepIndex].seconds;
        }
        return prev - 1;
      });
    }, 1000);
  };
  const finishCalibration = () => {
    calibrationRef.current.active = false;
    setIsCalibrating(false);

    const hasMovementBounds =
      calibrationRef.current.maxX >= calibrationRef.current.minX &&
      calibrationRef.current.maxY >= calibrationRef.current.minY;

    if (hasMovementBounds) {
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
    } else {
      calibrationRef.current.centerX = 0.5;
      calibrationRef.current.centerY = 0.5;
      calibrationRef.current.maxReachNorm = 0.2;
    }
    calibrationRef.current.done = true;
    calibrationRef.current.step = "complete";
    calibrationStepRef.current = "complete";

    assistiveModeLeftRef.current = !(
      calibrationRef.current.leftCanOpen && calibrationRef.current.leftCanClose
    );
    assistiveModeRightRef.current = !(
      calibrationRef.current.rightCanOpen && calibrationRef.current.rightCanClose
    );
    setAssistiveMode(
      assistiveModeLeftRef.current || assistiveModeRightRef.current,
    );

    setCalibrationDone(true);
    setCalibrationInstruction("");
    logsRef.current.push({
      timestamp: 0,
      event: "calibration_complete",
      calibration: calibrationRef.current,
      hand_function: {
        left:
          calibrationRef.current.leftCanOpen &&
          calibrationRef.current.leftCanClose
            ? "full"
            : "limited",
        right:
          calibrationRef.current.rightCanOpen &&
          calibrationRef.current.rightCanClose
            ? "full"
            : "limited",
      },
      assistive_config:
        assistiveModeLeftRef.current && assistiveModeRightRef.current
          ? "full_assistive"
          : assistiveModeLeftRef.current
            ? "left_assistive"
            : assistiveModeRightRef.current
              ? "right_assistive"
              : "normal",
      assistiveModeLeft: assistiveModeLeftRef.current,
      assistiveModeRight: assistiveModeRightRef.current,
    });
    showStatus("Calibration complete. Ready to start.");
  };
  const handleStartSession = () => {
    if (isSessionActive) {
      handleEndSession();
      return;
    }

    if (!calibrationDone) {
      if (!window.confirm("Calibration recommended. Continue anyway?")) return;
    }

    setScore(0);
    scoreRef.current = 0;
    setReps(0);
    repsRef.current = 0;
    attemptsRef.current = 0;
    successesRef.current = 0;
    postureWarningsRef.current = 0;
    trialIdRef.current = 0;
    logsRef.current = [];
    sessionStartRef.current = Date.now();

    setupGrid();
    spawnFruit();
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

    logsRef.current.push({
      timestamp: 0,
      event: "session_start",
      mode:
        assistiveModeLeftRef.current || assistiveModeRightRef.current
          ? "ASSISTIVE"
          : "NORMAL",
      hand_function_left:
        calibrationRef.current.leftCanOpen && calibrationRef.current.leftCanClose
          ? "full"
          : "limited",
      hand_function_right:
        calibrationRef.current.rightCanOpen &&
        calibrationRef.current.rightCanClose
          ? "full"
          : "limited",
    });
    showStatus("Session started. Close your hand to grab fruit.", 3000);
  };
  const handleEndSession = async () => {
    if (isSavingRef.current || !sessionStartRef.current) return;
    isSavingRef.current = true;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);

    const durationSec = nowSec();
    const finalReps = repsRef.current;
    const successRateVal =
      attemptsRef.current > 0
        ? ((successesRef.current / attemptsRef.current) * 100).toFixed(1)
        : 0;

    setIsSessionActive(false);
    logsRef.current.push({
      timestamp: durationSec,
      event: "session_end",
      score: scoreRef.current,
      reps: finalReps,
      attempts: attemptsRef.current,
      successes: successesRef.current,
      successRate: Number(successRateVal),
    });

    try {
      await gameService.saveGameSession({
        gameType: "arm_fruit_fetch",
        gameName: "Arm Fruit Fetch",
        metrics: {
          score: scoreRef.current,
          reps: finalReps,
          attempts: attemptsRef.current,
          successes: successesRef.current,
          successRate: Number(successRateVal),
          durationSec,
          postureWarnings: postureWarningsRef.current,
          assistiveMode:
            assistiveModeLeftRef.current || assistiveModeRightRef.current,
          assistiveModeLeft: assistiveModeLeftRef.current,
          assistiveModeRight: assistiveModeRightRef.current,
          calibration: calibrationRef.current,
        },
        trialLogs: logsRef.current,
      });
      showStatus("Session saved to your dashboard.", 3000);
      alert(
        `Session Complete!\n\nScore: ${scoreRef.current}\nReps: ${finalReps}\nSuccess Rate: ${successRateVal}%\n\nSaved to your dashboard.`,
      );
    } catch (error) {
      console.error("Failed to save Arm Fruit Fetch session:", error);
      alert(
        `Session Complete, but saving failed.\n\nScore: ${scoreRef.current}\nReps: ${finalReps}\nSuccess Rate: ${successRateVal}%`,
      );
    } finally {
      fruitRef.current = null;
      sessionStartRef.current = null;
      trialStartTimeRef.current = null;
      setTrialTimeRemaining(Math.ceil(CONFIG.TRIAL_TIMEOUT_MS / 1000));
      isSavingRef.current = false;
    }
  };

  const handleReset = () => {
    window.location.reload();
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
    repsRef.current = reps;
  }, [reps]);
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
    setupGrid();
    setupMediaPipe();

    const loopId = requestAnimationFrame(mainLoop);
    const handleKeyDown = (e) => {
      if (e.key === "d" || e.key === "D") {
        setShowDebug((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(loopId);
      document.removeEventListener("keydown", handleKeyDown);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
      if (calibIntervalRef.current) clearInterval(calibIntervalRef.current);
      if (cameraRef.current) cameraRef.current.stop();
    };
  }, [setupGrid, setupMediaPipe, mainLoop]);
  // ==================== RENDER ====================
  const themeStyles = {
    container: {
      ...styles.container,
      background: isDarkMode ? "#000" : "#F4F7FE",
      color: isDarkMode ? "#fff" : "#333",
    },
    panel: {
      ...styles.panel,
      background: isDarkMode
        ? "rgba(17, 24, 39, 0.95)"
        : "rgba(255, 255, 255, 0.95)",
      borderRight: isDarkMode
        ? "1px solid rgba(255, 255, 255, 0.1)"
        : "1px solid rgba(0, 0, 0, 0.1)",
      backdropFilter: "blur(20px)",
    },
    title: {
      ...styles.title,
      color: isDarkMode ? "#4ade80" : "#2f7a2f",
    },
    muted: {
      ...styles.muted,
      color: isDarkMode ? "#94a3b8" : "#575f56",
    },
    videoWrap: {
      ...styles.videoWrap,
      borderColor: isDarkMode ? "#1f2937" : "#eee",
      background: "#000",
    },
    statItem: {
      ...styles.statItem,
      background: isDarkMode ? "#111827" : "#f9f9f9",
      borderColor: isDarkMode ? "#1f2937" : "#eee",
    },
    statValue: {
      ...styles.statValue,
      color: isDarkMode ? "#4ade80" : "#2f7a2f",
    },
    statLabel: {
      ...styles.statLabel,
      color: isDarkMode ? "#94a3b8" : "#575f56",
    },
    note: {
      ...styles.note,
      background: isDarkMode
        ? "rgba(31, 41, 55, 0.5)"
        : "rgba(255, 255, 255, 0.5)",
      color: isDarkMode ? "#94a3b8" : "#575f56",
      borderTop: isDarkMode
        ? "1px solid rgba(255, 255, 255, 0.1)"
        : "1px solid rgba(0, 0, 0, 0.05)",
    },
    statusMessage: {
      ...styles.statusMessage,
      background: isDarkMode
        ? "rgba(17, 24, 39, 0.95)"
        : "rgba(255, 255, 255, 0.95)",
      color: isDarkMode ? "#4ade80" : "#2f7a2f",
      border: isDarkMode ? "1px solid #4ade80" : "none",
    },
  };

  return (
    <div style={themeStyles.container}>
      <aside style={themeStyles.panel}>
        <h1 style={themeStyles.title}>Arm Fruit Fetch</h1>
        <p style={themeStyles.muted}>
          Grasp, transport, and release fruits into the basket to improve
          coordination.
        </p>
        <div style={themeStyles.videoWrap}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={styles.video}
          />
          <canvas
            ref={overlayRef}
            style={styles.overlay}
            onMouseMove={handleOverlayMouseMove}
            onMouseDown={handleOverlayMouseDown}
            onMouseUp={handleOverlayMouseUp}
          />

          {isCalibrating && (
            <div style={themeStyles.statusMessage}>
              Calibrating... {calibTimeLeft}s
              <div style={styles.smallStatusText}>{calibrationInstruction}</div>
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
                <span>Left {leftHandClosed ? "🔴" : "🟢"}</span>
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
                <span>Right {rightHandClosed ? "🔴" : "🟢"}</span>
              </div>
            )}
          </div>
        </div>
        <div style={styles.controls}>
          <button
            onClick={handleStartCalibration}
            style={styles.controlButton}
            disabled={isCalibrating}
          >
            Calibrate
          </button>
          <button onClick={handleStartSession} style={styles.controlButton}>
            {isSessionActive ? "End and Save Session" : "Start Session"}
          </button>
        </div>
        <div style={themeStyles.stats}>
          <div style={themeStyles.statItem}>
            <div style={themeStyles.statLabel}>Score</div>
            <div style={themeStyles.statValue}>{score}</div>
          </div>
          <div style={themeStyles.statItem}>
            <div style={themeStyles.statLabel}>Reps</div>
            <div style={themeStyles.statValue}>{reps}</div>
          </div>
          <div style={themeStyles.statItem}>
            <div style={themeStyles.statLabel}>Timer</div>
            <div style={themeStyles.statValue}>{formatTime(timeRemaining)}</div>
          </div>
          <div style={themeStyles.statItem}>
            <div style={themeStyles.statLabel}>Success</div>
            <div style={themeStyles.statValue}>{successRate}%</div>
          </div>
          <div style={themeStyles.statItem}>
            <div style={themeStyles.statLabel}>Trial</div>
            <div style={themeStyles.statValue}>{trialTimeRemaining}s</div>
          </div>
          <div style={themeStyles.statItem}>
            <div style={themeStyles.statLabel}>Mode</div>
            <div style={themeStyles.statValue}>
              {assistiveMode ? "Assistive" : "Normal"}
            </div>
          </div>
        </div>
        <div style={styles.actions}>
          <button
            onClick={() => window.history.back()}
            style={styles.actionButton}
          >
            Quit
          </button>
          <button onClick={handleReset} style={styles.actionButton}>
            Reset
          </button>
        </div>
        <div style={themeStyles.note}>
          <strong style={themeStyles.statValue}>Pro-tip:</strong> Watch the
          skeletal feedback for grip status. Close your hand over the fruit, move to the basket, then open your hand to release.
          {assistiveMode && (
            <span>
              {" "}
              Assistive mode is on, so holding your hand over fruit or basket
              can pick or drop without a reliable open-close gesture.
            </span>
          )}
        </div>
      </aside>
      <main style={styles.gameArea}>
        <canvas ref={gameCanvasRef} style={styles.gameCanvas} />
        {statusMessage.visible && (
          <div style={themeStyles.statusMessage}>{statusMessage.text}</div>
        )}
      </main>
    </div>
  );
};
// ==================== STYLES ====================
const styles = {
  container: {
    display: "flex",
    gap: "12px",
    padding: "12px",
    height: "100vh",
    background: "linear-gradient(#eaf7ea, #f6faf3)",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial',
    overflow: "hidden",
  },
  panel: {
    width: "360px",
    background: "#fff",
    padding: "14px",
    borderRadius: "10px",
    boxShadow: "0 8px 20px rgba(20, 40, 20, 0.06)",
    overflowY: "auto",
  },
  title: {
    color: "#2f7a2f",
    margin: "0 0 8px",
    fontSize: "22px",
  },
  muted: {
    color: "#575f56",
    fontSize: "13px",
    margin: "0 0 12px",
    lineHeight: 1.4,
  },
  videoWrap: {
    position: "relative",
    height: "260px",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#111",
    border: "2px solid #ddd",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)",
  },
  overlay: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "auto",
  },
  calibOverlay: {
    position: "absolute",
    left: "8px",
    top: "8px",
    padding: "10px 14px",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "6px",
    zIndex: 10,
    fontSize: "13px",
    fontWeight: 500,
    maxWidth: "280px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
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
    marginTop: "12px",
  },
  controlButton: {
    padding: "11px",
    borderRadius: "8px",
    border: 0,
    background: "#2f7a2f",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    transition: "all 0.2s",
  },
  buttonDisabled: {
    background: "#ccc",
    cursor: "not-allowed",
    opacity: 0.6,
  },
  checkboxLabel: {
    fontSize: "13px",
    color: "#575f56",
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
    marginTop: "12px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  statItem: {
    padding: "10px",
    background: "#f9f9f9",
    borderRadius: "6px",
    border: "1px solid #eee",
  },
  statLabel: {
    fontSize: "11px",
    color: "#575f56",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#2f7a2f",
  },
  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "12px",
  },
  actionButton: {
    flex: 1,
    padding: "9px",
    borderRadius: "8px",
    border: 0,
    background: "#e8e8e8",
    color: "#333",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    transition: "background 0.2s",
  },
  note: {
    fontSize: "12px",
    color: "#575f56",
    marginTop: "12px",
    padding: "12px",
    background: "#f9f9f9",
    borderRadius: "6px",
    lineHeight: 1.6,
    borderLeft: "3px solid #2f7a2f",
  },
  noteTitle: {
    color: "#2f7a2f",
    display: "block",
    marginBottom: "6px",
  },
  gameArea: {
    flex: 1,
    display: "flex",
    alignItems: "stretch",
    position: "relative",
  },
  gameCanvas: {
    flex: 1,
    borderRadius: "10px",
    background: "linear-gradient(135deg, #cfead1, #86c98a)",
    display: "block",
    width: "100%",
    height: "100%",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
  statusMessage: {
    position: "absolute",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(255, 255, 255, 0.95)",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 600,
    color: "#2f7a2f",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    zIndex: 10,
    pointerEvents: "none",
    animation: "slideDown 0.3s ease",
  },
  smallStatusText: {
    marginTop: "6px",
    fontSize: "12px",
    fontWeight: 500,
    color: "inherit",
    maxWidth: "280px",
  },
};
export default GamePage2BallBasket;


