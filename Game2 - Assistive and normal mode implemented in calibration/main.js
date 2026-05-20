// Arm Orchard: Fruit Fetch - Enhanced Calibration with Hand Function Assessment
// Upper Limb Telerehabilitation Game

// ==================== CONFIGURATION ====================
const CONFIG = {
  SESSION_SECONDS: 300,
  CALIBRATION_SECONDS: 20,
  HAND_TEST_DURATION_MS: 5000, // 5 seconds per hand test
  GRID_ROWS: 3,
  GRID_COLS: 3,
  PICK_DISTANCE: 0.08,
  DROP_DISTANCE: 0.1,
  SCORE_PER_DROP: 10,
  SMOOTH_ALPHA: 0.7,
  STABLE_FRAMES: 2,
  DRAW_FPS: 30,
  PICK_DWELL_MS: 250,
  DROP_DWELL_MS: 250,
  TRIAL_TIMEOUT_MS: 10000, // 10 seconds per fruit
  MIN_SHOULDER_VISIBILITY: 0.5,
  IDEAL_SHOULDER_Y_RANGE: [0.15, 0.6],
  MIN_SHOULDER_WIDTH: 0.12
};

// ==================== DOM ELEMENTS ====================
const DOM = {
  video: document.getElementById('video'),
  overlay: document.getElementById('overlay'),
  gameCanvas: document.getElementById('gameCanvas'),
  startCalBtn: document.getElementById('startCal'),
  startGameBtn: document.getElementById('startGame'),
  stopGameBtn: document.getElementById('stopGame'),
  downloadCsvBtn: document.getElementById('downloadCsv'),
  resetBtn: document.getElementById('reset'),
  assistiveMode: document.getElementById('assistiveMode'),
  scoreEl: document.getElementById('score'),
  repsEl: document.getElementById('reps'),
  timerEl: document.getElementById('timer'),
  succEl: document.getElementById('succ'),
  calibOverlay: document.getElementById('calibOverlay'),
  calibText: document.getElementById('calibText'),
  statusMsg: document.getElementById('statusMsg'),
  leftHandStatus: document.getElementById('leftHandStatus'),
  rightHandStatus: document.getElementById('rightHandStatus'),
  debugPanel: document.getElementById('debugPanel'),
  errorModal: document.getElementById('errorModal'),
  errorMsg: document.getElementById('errorMsg'),
  retryCamera: document.getElementById('retryCamera'),
  closeError: document.getElementById('closeError'),
  positionIndicator: document.getElementById('positionIndicator'),
  posStatus: document.getElementById('posStatus'),
  trialTimer: document.getElementById('trialTimer')
};

const octx = DOM.overlay.getContext('2d');
const gctx = DOM.gameCanvas.getContext('2d');

// ==================== STATE ====================
let handsModule = null;
let poseModule = null;
let camera = null;
let isInitialized = false;
let assistiveMode = false;
let assistiveModeLeft = false;
let assistiveModeRight = false;
let trialId = 0;
let trialStartTime = null;
let trialTimeoutId = null;
let isPositionedCorrectly = false;

const calibration = {
  active: false,
  done: false,
  frames: [],
  minX: 1, maxX: 0,
  minY: 1, maxY: 0,
  centerX: 0.5, centerY: 0.5,
  maxReachNorm: 0.2,
  shoulderWidth: 0,
  // New hand function assessment fields
  step: 'positioning', // positioning, left_open, left_close, right_open, right_close
  leftCanOpen: false,
  leftCanClose: false,
  rightCanOpen: false,
  rightCanClose: false,
  handTestTimer: null,
  currentHand: null,
  currentAction: null
};

const handState = {
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
    assistivePickTimer: 0,
    assistiveDropTimer: 0,
    elbowAngle: null,
    shoulderAngle: null,
    trunkTwist: null
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
    assistivePickTimer: 0,
    assistiveDropTimer: 0,
    elbowAngle: null,
    shoulderAngle: null,
    trunkTwist: null
  }
};

let gridHoles = [];
let fruit = null;
let basketIdx = null;
let score = 0;
let reps = 0;
let attempts = 0;
let successes = 0;
let aratTotalScore = 0;
let logs = [];
let sessionStart = null;
let timerInterval = null;
let lastPoseResults = null;

// FPS limiting
let lastDrawTime = 0;
const drawInterval = 1000 / CONFIG.DRAW_FPS;

// ==================== UTILITY & ANGLE FUNCTIONS ====================
function distNorm(a, b) {
  if (!a || !b) return 999;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function smoothPos(prev, next) {
  if (!prev) return { x: next.x, y: next.y };
  return {
    x: prev.x * (1 - CONFIG.SMOOTH_ALPHA) + next.x * CONFIG.SMOOTH_ALPHA,
    y: prev.y * (1 - CONFIG.SMOOTH_ALPHA) + next.y * CONFIG.SMOOTH_ALPHA
  };
}

function nowSec() {
  return sessionStart ? Math.floor((Date.now() - sessionStart) / 1000) : 0;
}

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function showStatus(msg, duration = 2000) {
  DOM.statusMsg.textContent = msg;
  DOM.statusMsg.classList.remove('hidden');
  setTimeout(() => DOM.statusMsg.classList.add('hidden'), duration);
}

function calculateAratScore(trialDurationMs) {
  const sec = trialDurationMs / 1000;
  if (sec < 5) return 3;
  if (sec < 10) return 2;
  return 1;
}

// ==================== ANGLE COMPUTATION HELPERS ====================
function vecSub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
function vecDot(a, b) { return a.x * b.x + a.y * b.y; }
function vecMag(v)   { return Math.hypot(v.x, v.y); }
function vecAngle(a, b) {
  const mag = vecMag(a) * vecMag(b);
  if (mag === 0) return 0;
  const cos = Math.max(-1, Math.min(1, vecDot(a, b) / mag));
  return Math.acos(cos) * 180 / Math.PI;
}

// ==================== POSITION CHECK (IMPROVED) ====================
function checkPatientPositioning() {
  if (!lastPoseResults || !lastPoseResults.poseLandmarks) {
    isPositionedCorrectly = false;
    return;
  }
  
  const pl = lastPoseResults.poseLandmarks;
  const leftShoulder = pl[11];
  const rightShoulder = pl[12];
  
  if (!leftShoulder || !rightShoulder || 
      leftShoulder.visibility < CONFIG.MIN_SHOULDER_VISIBILITY || 
      rightShoulder.visibility < CONFIG.MIN_SHOULDER_VISIBILITY) {
    isPositionedCorrectly = false;
    return;
  }
  
  const leftInFrame = leftShoulder.x > 0.1 && leftShoulder.x < 0.9 && 
                     leftShoulder.y > CONFIG.IDEAL_SHOULDER_Y_RANGE[0] && 
                     leftShoulder.y < CONFIG.IDEAL_SHOULDER_Y_RANGE[1];
  
  const rightInFrame = rightShoulder.x > 0.1 && rightShoulder.x < 0.9 && 
                      rightShoulder.y > CONFIG.IDEAL_SHOULDER_Y_RANGE[0] && 
                      rightShoulder.y < CONFIG.IDEAL_SHOULDER_Y_RANGE[1];
  
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  calibration.shoulderWidth = shoulderWidth;
  
  isPositionedCorrectly = leftInFrame && rightInFrame && shoulderWidth >= CONFIG.MIN_SHOULDER_WIDTH;
}

// ==================== MEDIAPIPE SETUP ====================
function setupMediaPipe() {
  handsModule = new Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
  });
  handsModule.setOptions({
    selfieMode: true,
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });
  handsModule.onResults(onHandsResults);

  poseModule = new Pose({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
  });
  poseModule.setOptions({
    modelComplexity: 0,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    selfieMode: true
  });
  poseModule.onResults(onPoseResults);

  camera = new Camera(DOM.video, {
    onFrame: async () => {
      if (isInitialized) {
        await handsModule.send({ image: DOM.video });
        await poseModule.send({ image: DOM.video });
      }
    },
    width: 640,
    height: 480
  });

  camera.start().then(() => {
    isInitialized = true;
    console.log('✓ Camera started successfully');
    DOM.errorModal.classList.add('hidden');
  }).catch(e => {
    console.error('Camera failed:', e);
    showCameraError(e.message || 'Unknown camera error');
  });
}

function showCameraError(details) {
  DOM.errorMsg.innerHTML = `
    <strong>Unable to access camera</strong><br>
    <small>${details}</small><br><br>
    Please check:
  `;
  DOM.errorModal.classList.remove('hidden');
}

// ==================== HAND DETECTION ====================
function onHandsResults(results) {
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
        y: (lm[0].y + lm[5].y + lm[9].y + lm[13].y + lm[17].y) / 5
      };

      const rawPos = { x: palmCenter.x, y: palmCenter.y };
      handState[label].pos = rawPos;
      handState[label].smoothPos = smoothPos(handState[label].smoothPos, rawPos);
      handState[label].landmarks = lm;
      handState[label].visible = true;

      const fingerPairs = [[8, 6], [12, 10], [16, 14], [20, 18]];
      let curledFingers = 0;
      fingerPairs.forEach(([tipIdx, midIdx]) => {
        const tip = lm[tipIdx];
        const mid = lm[midIdx];
        if (tip.y > mid.y + 0.03) {
          curledFingers++;
        }
      });
      
      const thumbTipPoint = lm[4];
      const indexBase = lm[5];
      const middleBase = lm[9];
      const thumbToPalm = Math.hypot(thumbTipPoint.x - palmCenter.x, thumbTipPoint.y - palmCenter.y);
      const handSize = Math.hypot(middleBase.x - lm[0].x, middleBase.y - lm[0].y) || 0.05;
      const normalizedThumbDist = thumbToPalm / handSize;
      const thumbClosed = normalizedThumbDist < 0.7;
      
      const fingerSpread = Math.hypot(lm[8].x - lm[20].x, lm[8].y - lm[20].y);
      const normalizedSpread = fingerSpread / handSize;
      const tightSpread = normalizedSpread < 0.8;
      
      const allTips = [4, 8, 12, 16, 20].map(idx => lm[idx]);
      let avgDistToPalm = 0;
      allTips.forEach(tip => {
        avgDistToPalm += Math.hypot(tip.x - palmCenter.x, tip.y - palmCenter.y);
      });
      avgDistToPalm /= allTips.length;
      const normalizedCompactness = avgDistToPalm / handSize;
      const veryCompact = normalizedCompactness < 0.9;
      
      const isClosed = (curledFingers === 4) || 
                       (curledFingers >= 3 && thumbClosed) ||
                       (curledFingers >= 2 && thumbClosed && tightSpread) ||
                       (veryCompact && tightSpread && thumbClosed);

      if (isClosed) {
        handState[label].closedFrames = Math.min(handState[label].closedFrames + 1, CONFIG.STABLE_FRAMES + 2);
        handState[label].openFrames = 0;
      } else {
        handState[label].openFrames = Math.min(handState[label].openFrames + 1, CONFIG.STABLE_FRAMES + 2);
        handState[label].closedFrames = 0;
      }

      handState[label].closed = handState[label].closedFrames >= CONFIG.STABLE_FRAMES;
    }
  }

  updateHandIndicators();
}

// ==================== POSE DETECTION & ANGLE COMPUTATION ====================
function onPoseResults(results) {
  lastPoseResults = results;
  
  if (results.poseLandmarks) {
    const pl = results.poseLandmarks;
    
    const update = (label, shoulderIdx, elbowIdx) => {
      if (pl[shoulderIdx] && pl[shoulderIdx].visibility > 0.5) {
        const shoulder = { x: pl[shoulderIdx].x, y: pl[shoulderIdx].y };
        handState[label].shoulder = smoothPos(handState[label].shoulder, shoulder);
      }
      if (pl[elbowIdx] && pl[elbowIdx].visibility > 0.5) {
        const elbow = { x: pl[elbowIdx].x, y: pl[elbowIdx].y };
        handState[label].elbow = smoothPos(handState[label].elbow, elbow);
      }
    };

    update('Left', 11, 13);
    update('Right', 12, 14);

    // ---------- COMPUTE BIOMECHANICAL ANGLES ----------
    ['Left', 'Right'].forEach(side => {
      const shIdx = side === 'Left' ? 11 : 12;
      const elIdx = side === 'Left' ? 13 : 14;
      const sh = pl[shIdx], el = pl[elIdx];
      if (!sh || !el || sh.visibility < 0.3 || el.visibility < 0.3) {
        handState[side].elbowAngle = null;
        handState[side].shoulderAngle = null;
        handState[side].trunkTwist = null;
        return;
      }
      const wrist = handState[side].smoothPos || { x: 0, y: 0 };
      const vUpper = vecSub({ x: el.x, y: el.y }, { x: sh.x, y: sh.y });
      const vFore  = vecSub(wrist, { x: el.x, y: el.y });
      handState[side].elbowAngle = Math.round(vecAngle(vUpper, vFore));
      
      const vTrunk = { x: 0, y: 1 }; // vertical down
      handState[side].shoulderAngle = Math.round(vecAngle(vUpper, vTrunk));
      
      const vUpperH = { x: vUpper.x, y: 0 };
      const vTrunkH = { x: 1, y: 0 };
      handState[side].trunkTwist = Math.round(vecAngle(vUpperH, vTrunkH));
    });
    // ----------------------------------------------------

    // Check positioning during calibration
    checkPatientPositioning();

    if (calibration.active) {
      ['Left', 'Right'].forEach(label => {
        if (handState[label].smoothPos) {
          calibration.minX = Math.min(calibration.minX, handState[label].smoothPos.x);
          calibration.maxX = Math.max(calibration.maxX, handState[label].smoothPos.x);
          calibration.minY = Math.min(calibration.minY, handState[label].smoothPos.y);
          calibration.maxY = Math.max(calibration.maxY, handState[label].smoothPos.y);
        }
      });
    }
  }
}

// ==================== HAND INDICATORS ====================
function updateHandIndicators() {
  ['Left', 'Right'].forEach(label => {
    const hand = handState[label];
    const indicator = label === 'Left' ? DOM.leftHandStatus : DOM.rightHandStatus;
    
    if (hand.visible && hand.smoothPos) {
      indicator.classList.remove('hidden');
      if (hand.closed) {
        indicator.classList.remove('open');
        indicator.classList.add('closed');
        indicator.innerHTML = `<span class="dot"></span><span>${label} - CLOSED 🔴</span>`;
      } else {
        indicator.classList.remove('closed');
        indicator.classList.add('open');
        indicator.innerHTML = `<span class="dot"></span><span>${label} - OPEN 🟢</span>`;
      }
    } else {
      indicator.classList.add('hidden');
    }
  });
}

// ==================== NEW CALIBRATION SYSTEM ====================
function startCalibration() {
  // Reset calibration state
  calibration.active = true;
  calibration.done = false;
  calibration.step = 'left_open';
  calibration.leftCanOpen = false;
  calibration.leftCanClose = false;
  calibration.rightCanOpen = false;
  calibration.rightCanClose = false;
  
  // Show calibration overlay
  DOM.calibOverlay.classList.remove('hidden');
  DOM.positionIndicator.classList.remove('hidden');
  DOM.startCalBtn.disabled = true;
  
  // Start the first step
  runCalibrationStep();
}

function runCalibrationStep() {
  // Clear any existing timer
  if (calibration.handTestTimer) {
    clearTimeout(calibration.handTestTimer);
    calibration.handTestTimer = null;
  }
  
  switch(calibration.step) {
    case 'left_open':
      DOM.calibText.innerHTML = `
        <span class="step-counter">Step 1/5</span>
        <strong>LEFT HAND: OPEN PALM ✋</strong>
        <em>Hold for 5s...</em>
      `;
      calibration.currentHand = 'Left';
      calibration.currentAction = 'open';
      // Monitor for open hand
      monitorHandForDuration('Left', 'open', CONFIG.HAND_TEST_DURATION_MS, () => {
        calibration.leftCanOpen = true;
        calibration.step = 'left_close';
        runCalibrationStep();
      }, () => {
        // Timeout - cannot open
        calibration.leftCanOpen = false;
        calibration.step = 'left_close';
        runCalibrationStep();
      });
      break;
      
    case 'left_close':
      DOM.calibText.innerHTML = `
        <span class="step-counter">Step 2/5</span>
        <strong>LEFT HAND: CLOSED FIST ✊</strong>
        <em>Hold for 5s...</em>
      `;
      calibration.currentHand = 'Left';
      calibration.currentAction = 'close';
      // Monitor for closed hand
      monitorHandForDuration('Left', 'close', CONFIG.HAND_TEST_DURATION_MS, () => {
        calibration.leftCanClose = true;
        calibration.step = 'right_open';
        runCalibrationStep();
      }, () => {
        // Timeout - cannot close
        calibration.leftCanClose = false;
        calibration.step = 'right_open';
        runCalibrationStep();
      });
      break;
      
    case 'right_open':
      DOM.calibText.innerHTML = `
        <span class="step-counter">Step 3/5</span>
        <strong>RIGHT HAND: OPEN PALM ✋</strong>
        <em>Hold for 5s...</em>
      `;
      calibration.currentHand = 'Right';
      calibration.currentAction = 'open';
      // Monitor for open hand
      monitorHandForDuration('Right', 'open', CONFIG.HAND_TEST_DURATION_MS, () => {
        calibration.rightCanOpen = true;
        calibration.step = 'right_close';
        runCalibrationStep();
      }, () => {
        // Timeout - cannot open
        calibration.rightCanOpen = false;
        calibration.step = 'right_close';
        runCalibrationStep();
      });
      break;
      
    case 'right_close':
      DOM.calibText.innerHTML = `
        <span class="step-counter">Step 4/5</span>
        <strong>RIGHT HAND: CLOSED FIST ✊</strong>
        <em>Hold for 5s...</em>
      `;
      calibration.currentHand = 'Right';
      calibration.currentAction = 'close';
      // Monitor for closed hand
      monitorHandForDuration('Right', 'close', CONFIG.HAND_TEST_DURATION_MS, () => {
        calibration.rightCanClose = true;
        calibration.step = 'movement';
        runCalibrationStep();
      }, () => {
        // Timeout - cannot close
        calibration.rightCanClose = false;
        calibration.step = 'movement';
        runCalibrationStep();
      });
      break;
      
    case 'movement':
      DOM.calibText.innerHTML = `
        <span class="step-counter">Step 5/5</span>
        <strong>MOVE BOTH HANDS TO CORNERS</strong>
        <em>5 seconds remaining...</em>
      `;
      // Reset bounds for movement tracking
      calibration.minX = 1; calibration.maxX = 0;
      calibration.minY = 1; calibration.maxY = 0;
      calibration.handTestTimer = setTimeout(() => {
        calibration.step = 'complete';
        runCalibrationStep();
      }, 5000);
      break;
      
    case 'complete':
      finishCalibration();
      break;
  }
}

function monitorHandForDuration(handLabel, action, durationMs, onSuccess, onTimeout) {
  let startTime = Date.now();
  let successFrames = 0;
  const requiredFrames = 3; // Need 3 consecutive successful frames
  
  function checkHand() {
    const elapsed = Date.now() - startTime;
    const hand = handState[handLabel];
    
    // Check if hand is visible
    if (!hand.visible || !hand.smoothPos) {
      if (elapsed >= durationMs) {
        onTimeout();
        return;
      }
      calibration.handTestTimer = setTimeout(checkHand, 50);
      return;
    }
    
    // Check if hand is in the required state
    const isCorrectState = action === 'open' ? !hand.closed : hand.closed;
    
    if (isCorrectState) {
      successFrames++;
      if (successFrames >= requiredFrames) {
        onSuccess();
        return;
      }
    } else {
      successFrames = 0;
    }
    
    if (elapsed >= durationMs) {
      onTimeout();
    } else {
      // Update progress indicator
      const remaining = Math.ceil((durationMs - elapsed) / 1000);
      DOM.calibText.innerHTML = DOM.calibText.innerHTML.replace(/<em>.*<\/em>/, `<em>Holding... ${remaining}s</em>`);
      calibration.handTestTimer = setTimeout(checkHand, 50);
    }
  }
  
  checkHand();
}

function finishCalibration() {
  calibration.active = false;
  DOM.calibOverlay.classList.add('hidden');
  DOM.positionIndicator.classList.add('hidden');
  DOM.startCalBtn.disabled = false;
  
  // Calculate movement range
  calibration.centerX = (calibration.minX + calibration.maxX) / 2;
  calibration.centerY = (calibration.minY + calibration.maxY) / 2;
  const dx = Math.max(Math.abs(calibration.centerX - calibration.minX), 
                      Math.abs(calibration.centerX - calibration.maxX));
  const dy = Math.max(Math.abs(calibration.centerY - calibration.minY), 
                      Math.abs(calibration.centerY - calibration.maxY));
  calibration.maxReachNorm = Math.sqrt(dx * dx + dy * dy) || 0.2;
  calibration.done = true;
  
  // Determine assistive mode per hand
  assistiveModeLeft = !(calibration.leftCanOpen && calibration.leftCanClose);
  assistiveModeRight = !(calibration.rightCanOpen && calibration.rightCanClose);
  
  // Set global assistive mode (if any hand needs assistance, enable global flag)
  assistiveMode = assistiveModeLeft || assistiveModeRight;
  DOM.assistiveMode.checked = assistiveMode;
  
  // Log results
  const handFunction = {
    left: calibration.leftCanOpen && calibration.leftCanClose ? 'full' : 'limited',
    right: calibration.rightCanOpen && calibration.rightCanClose ? 'full' : 'limited'
  };
  
  const assistiveConfig = assistiveModeLeft && assistiveModeRight ? 'full_assistive' :
                         assistiveModeLeft ? 'left_assistive' :
                         assistiveModeRight ? 'right_assistive' : 'normal';
  
  logs.push({ 
    timestamp: 0, 
    event: 'calibration_complete', 
    calibration,
    hand_function: handFunction,
    assistive_config: assistiveConfig
  });
  
  DOM.startGameBtn.disabled = false;
  
  // Show summary
  let summary = '✓ Calibration complete!\n\n';
  summary += `Left Hand: ${handFunction.left === 'full' ? '✅ Full function' : '⚠️ Limited function'}\n`;
  summary += `Right Hand: ${handFunction.right === 'full' ? '✅ Full function' : '⚠️ Limited function'}\n\n`;
  summary += `Mode: ${assistiveConfig === 'normal' ? 'Normal' : 
                         assistiveConfig === 'full_assistive' ? 'Full Assistive' :
                         assistiveConfig.includes('left') ? 'Left Assistive' : 'Right Assistive'}`;
  
  alert(summary);
  showStatus('Ready to start game!', 3000);
}

// ==================== GRID & FRUIT ====================
function setupGrid() {
  gridHoles = [];
  const marginX = 0.15, marginY = 0.15;
  
  for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
    for (let c = 0; c < CONFIG.GRID_COLS; c++) {
      const x = marginX + (c / (CONFIG.GRID_COLS - 1)) * (1 - 2 * marginX);
      const y = marginY + (r / (CONFIG.GRID_ROWS - 1)) * (1 - 2 * marginY);
      gridHoles.push({ id: r * CONFIG.GRID_COLS + c, x, y });
    }
  }
}

function spawnFruit() {
  trialId++;
  trialStartTime = Date.now();
  
  if (trialTimeoutId) {
    clearTimeout(trialTimeoutId);
    trialTimeoutId = null;
  }
  
  let sourceIdx = Math.floor(Math.random() * gridHoles.length);
  let bIdx = Math.floor(Math.random() * gridHoles.length);
  while (bIdx === sourceIdx) {
    bIdx = Math.floor(Math.random() * gridHoles.length);
  }
  
  basketIdx = bIdx;
  fruit = {
    id: `F${Date.now()}`,
    sourceIdx,
    x: gridHoles[sourceIdx].x,
    y: gridHoles[sourceIdx].y,
    attachedTo: null
  };
  
  // Start trial timeout - FIXED: Removed condition that prevented timeout if fruit not picked
  trialTimeoutId = setTimeout(() => {
    handleTrialTimeout();
  }, CONFIG.TRIAL_TIMEOUT_MS);
  
  // Reset and show trial timer
  DOM.trialTimer.textContent = `⏱️ ${Math.ceil(CONFIG.TRIAL_TIMEOUT_MS / 1000)}s`;
  DOM.trialTimer.classList.remove('hidden');
  
  logs.push({
    timestamp: nowSec(),
    event: 'spawn',
    trial_id: trialId,
    mode: assistiveMode ? 'ASSISTIVE' : 'NORMAL',
    hand_function_left: calibration.leftCanOpen && calibration.leftCanClose ? 'full' : 'limited',
    hand_function_right: calibration.rightCanOpen && calibration.rightCanClose ? 'full' : 'limited',
    fruit_id: fruit.id,
    source_idx: fruit.sourceIdx,
    basket_idx: basketIdx,
    score: aratTotalScore
  });
}

// BUG FIX: Removed condition that prevented timeout handling when fruit not picked
function handleTrialTimeout() {
  // This function is called when the trial time expires (10 seconds)
  // It handles both cases: fruit never picked, or fruit picked but not placed
  
  attempts++;
  const handLabel = fruit ? fruit.attachedTo : null; // Will be null if never picked
  
  logs.push({
    timestamp: nowSec(),
    event: 'timeout',
    trial_id: trialId,
    mode: assistiveMode ? 'ASSISTIVE' : 'NORMAL',
    hand: handLabel || '',
    hand_function_left: calibration.leftCanOpen && calibration.leftCanClose ? 'full' : 'limited',
    hand_function_right: calibration.rightCanOpen && calibration.rightCanClose ? 'full' : 'limited',
    x_norm: handLabel ? (handState[handLabel].smoothPos?.x || '') : '',
    y_norm: handLabel ? (handState[handLabel].smoothPos?.y || '') : '',
    shoulder_x: handLabel ? (handState[handLabel].shoulder?.x || '') : '',
    shoulder_y: handLabel ? (handState[handLabel].shoulder?.y || '') : '',
    elbow_x: handLabel ? (handState[handLabel].elbow?.x || '') : '',
    elbow_y: handLabel ? (handState[handLabel].elbow?.y || '') : '',
    elbow_angle_deg: handLabel ? (handState[handLabel].elbowAngle ?? '') : '',
    shoulder_angle_deg: handLabel ? (handState[handLabel].shoulderAngle ?? '') : '',
    trunk_twist_deg: handLabel ? (handState[handLabel].trunkTwist ?? '') : '',
    fruit_id: fruit ? fruit.id : '',
    source_idx: fruit ? fruit.sourceIdx : '',
    basket_idx: basketIdx,
    trial_duration_sec: (CONFIG.TRIAL_TIMEOUT_MS / 1000).toFixed(2),
    success: false,
    arat_score: 0
  });
  
  // Reset timers
  handState.Left.assistivePickTimer = 0;
  handState.Left.assistiveDropTimer = 0;
  handState.Right.assistivePickTimer = 0;
  handState.Right.assistiveDropTimer = 0;
  
  // Detach fruit if it was attached
  if (fruit) {
    fruit.attachedTo = null;
  }
  
  // Show status and start new trial (resets timer)
  showStatus('⏱️ Timeout! New fruit spawning...', 2000);
  spawnFruit();
  updateHUD();
}

// ==================== GAME SESSION ====================
function startSession() {
  if (!calibration.done) {
    if (!confirm('Calibration recommended. Continue anyway?')) return;
  }
  
  score = 0;
  reps = 0;
  attempts = 0;
  successes = 0;
  aratTotalScore = 0;
  trialId = 0;
  trialStartTime = null;
  logs = [];
  sessionStart = Date.now();
  
  // Reset timers
  handState.Left.assistivePickTimer = 0;
  handState.Left.assistiveDropTimer = 0;
  handState.Right.assistivePickTimer = 0;
  handState.Right.assistiveDropTimer = 0;
  
  setupGrid();
  spawnFruit();
  updateHUD();
  
  DOM.timerEl.textContent = formatTime(CONFIG.SESSION_SECONDS);
  DOM.startGameBtn.disabled = true;
  DOM.stopGameBtn.disabled = false;
  DOM.assistiveMode.disabled = true; // Disable mode change during game
  
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    const remaining = Math.max(0, CONFIG.SESSION_SECONDS - elapsed);
    DOM.timerEl.textContent = formatTime(remaining);
    
    if (remaining <= 0) {
      clearInterval(timerInterval);
      endSession();
    }
  }, 1000);
  
  logs.push({ 
    timestamp: 0, 
    event: 'session_start', 
    mode: assistiveMode ? 'ASSISTIVE' : 'NORMAL',
    hand_function_left: calibration.leftCanOpen && calibration.leftCanClose ? 'full' : 'limited',
    hand_function_right: calibration.rightCanOpen && calibration.rightCanClose ? 'full' : 'limited'
  });
  showStatus('🎮 Session started! Close hand to grab fruit!', 3000);
}

function endSession() {
  if (trialTimeoutId) clearTimeout(trialTimeoutId);
  if (timerInterval) clearInterval(timerInterval);
  
  DOM.stopGameBtn.disabled = true;
  DOM.startGameBtn.disabled = false;
  DOM.assistiveMode.disabled = false; // Re-enable mode change
  DOM.trialTimer.classList.add('hidden');
  
  const successRate = attempts > 0 ? ((successes / attempts) * 100).toFixed(1) : 0;
  alert(`Session Complete!\n\nARAT Score: ${aratTotalScore}\nReps: ${reps}\nSuccess Rate: ${successRate}%\n\nDownload CSV to save your data.`);
}

function stopGame() {
  if (!sessionStart) return;
  
  if (confirm('Stop current session?')) {
    clearInterval(timerInterval);
    if (trialTimeoutId) clearTimeout(trialTimeoutId);
    endSession();
  }
}

// ==================== GAME LOGIC ====================
function gameLogicTick() {
  if (!fruit || !sessionStart) return;

  // Show trial timer with integer seconds
  const elapsedTrial = (Date.now() - trialStartTime) / 1000;
  const remainingTrial = Math.max(0, CONFIG.TRIAL_TIMEOUT_MS / 1000 - elapsedTrial);
  DOM.trialTimer.textContent = `⏱️ ${Math.ceil(remainingTrial)}s`;

  ['Left', 'Right'].forEach(label => {
    const hand = handState[label];
    if (!hand.smoothPos || !hand.visible) return;

    const source = gridHoles[fruit.sourceIdx];
    const basket = gridHoles[basketIdx];
    const handDistToSource = distNorm(hand.smoothPos, source);
    const handDistToBasket = distNorm(hand.smoothPos, basket);

    // Determine if this hand should use assistive mode
    const isAssistive = label === 'Left' ? assistiveModeLeft : assistiveModeRight;

    // PICK logic
    if (!fruit.attachedTo) {
      if (isAssistive) {
        if (handDistToSource < CONFIG.PICK_DISTANCE) {
          hand.assistivePickTimer += 16;
          if (hand.assistivePickTimer >= CONFIG.PICK_DWELL_MS) {
            fruit.attachedTo = label;
            hand.assistivePickTimer = 0;
            
            logs.push({
              timestamp: nowSec(),
              event: 'pick',
              trial_id: trialId,
              mode: 'ASSISTIVE',
              hand: label,
              hand_function_left: calibration.leftCanOpen && calibration.leftCanClose ? 'full' : 'limited',
              hand_function_right: calibration.rightCanOpen && calibration.rightCanClose ? 'full' : 'limited',
              x_norm: hand.smoothPos.x,
              y_norm: hand.smoothPos.y,
              shoulder_x: hand.shoulder?.x || '',
              shoulder_y: hand.shoulder?.y || '',
              elbow_x: hand.elbow?.x || '',
              elbow_y: hand.elbow?.y || '',
              elbow_angle_deg: hand.elbowAngle ?? '',
              shoulder_angle_deg: hand.shoulderAngle ?? '',
              trunk_twist_deg: hand.trunkTwist ?? '',
              fruit_id: fruit.id,
              source_idx: fruit.sourceIdx,
              basket_idx: basketIdx
            });
            
            showStatus(`🤏 ${label} hand auto-grabbed fruit!`, 1000);
          }
        } else {
          hand.assistivePickTimer = 0;
        }
      } else {
        if (hand.closedFrames >= CONFIG.STABLE_FRAMES && handDistToSource < CONFIG.PICK_DISTANCE) {
          fruit.attachedTo = label;
          
          logs.push({
            timestamp: nowSec(),
            event: 'pick',
            trial_id: trialId,
            mode: 'NORMAL',
            hand: label,
            hand_function_left: calibration.leftCanOpen && calibration.leftCanClose ? 'full' : 'limited',
            hand_function_right: calibration.rightCanOpen && calibration.rightCanClose ? 'full' : 'limited',
            x_norm: hand.smoothPos.x,
            y_norm: hand.smoothPos.y,
            shoulder_x: hand.shoulder?.x || '',
            shoulder_y: hand.shoulder?.y || '',
            elbow_x: hand.elbow?.x || '',
            elbow_y: hand.elbow?.y || '',
            elbow_angle_deg: hand.elbowAngle ?? '',
            shoulder_angle_deg: hand.shoulderAngle ?? '',
            trunk_twist_deg: hand.trunkTwist ?? '',
            fruit_id: fruit.id,
            source_idx: fruit.sourceIdx,
            basket_idx: basketIdx
          });
          
          showStatus(`✊ ${label} hand grasped fruit!`, 1000);
        }
      }
    }

    // DROP logic
    if (fruit.attachedTo === label) {
      if (isAssistive) {
        if (handDistToBasket < CONFIG.DROP_DISTANCE) {
          hand.assistiveDropTimer += 16;
          if (hand.assistiveDropTimer >= CONFIG.DROP_DWELL_MS) {
            const trialDuration = Date.now() - trialStartTime;
            const aratScore = calculateAratScore(trialDuration);
            aratTotalScore += aratScore;
            score += CONFIG.SCORE_PER_DROP;
            reps++;
            successes++;
            attempts++;
            
            if (trialTimeoutId) {
              clearTimeout(trialTimeoutId);
              trialTimeoutId = null;
            }
            
            logs.push({
              timestamp: nowSec(),
              event: 'drop_success',
              trial_id: trialId,
              mode: 'ASSISTIVE',
              hand: label,
              hand_function_left: calibration.leftCanOpen && calibration.leftCanClose ? 'full' : 'limited',
              hand_function_right: calibration.rightCanOpen && calibration.rightCanClose ? 'full' : 'limited',
              x_norm: hand.smoothPos.x,
              y_norm: hand.smoothPos.y,
              shoulder_x: hand.shoulder?.x || '',
              shoulder_y: hand.shoulder?.y || '',
              elbow_x: hand.elbow?.x || '',
              elbow_y: hand.elbow?.y || '',
              elbow_angle_deg: hand.elbowAngle ?? '',
              shoulder_angle_deg: hand.shoulderAngle ?? '',
              trunk_twist_deg: hand.trunkTwist ?? '',
              fruit_id: fruit.id,
              source_idx: fruit.sourceIdx,
              basket_idx: basketIdx,
              trial_duration_sec: (trialDuration / 1000).toFixed(2),
              success: true,
              arat_score: aratScore
            });
            
            hand.assistiveDropTimer = 0;
            DOM.trialTimer.classList.add('hidden');
            updateHUD();
            showStatus(`✅ Success! +${CONFIG.SCORE_PER_DROP} points (ARAT: +${aratScore})`, 1500);
            spawnFruit();
          }
        } else {
          hand.assistiveDropTimer = 0;
        }
      } else {
        if (hand.openFrames >= CONFIG.STABLE_FRAMES) {
          if (handDistToBasket >= CONFIG.DROP_DISTANCE) {
            attempts++;
            fruit.attachedTo = null;
            fruit.x = gridHoles[fruit.sourceIdx].x;
            fruit.y = gridHoles[fruit.sourceIdx].y;
            
            const trialDuration = Date.now() - trialStartTime;
            logs.push({
              timestamp: nowSec(),
              event: 'drop_miss',
              trial_id: trialId,
              mode: 'NORMAL',
              hand: label,
              hand_function_left: calibration.leftCanOpen && calibration.leftCanClose ? 'full' : 'limited',
              hand_function_right: calibration.rightCanOpen && calibration.rightCanClose ? 'full' : 'limited',
              x_norm: hand.smoothPos.x,
              y_norm: hand.smoothPos.y,
              shoulder_x: hand.shoulder?.x || '',
              shoulder_y: hand.shoulder?.y || '',
              elbow_x: hand.elbow?.x || '',
              elbow_y: hand.elbow?.y || '',
              elbow_angle_deg: hand.elbowAngle ?? '',
              shoulder_angle_deg: hand.shoulderAngle ?? '',
              trunk_twist_deg: hand.trunkTwist ?? '',
              fruit_id: fruit.id,
              source_idx: fruit.sourceIdx,
              basket_idx: basketIdx,
              trial_duration_sec: (trialDuration / 1000).toFixed(2),
              success: false,
              arat_score: 0
            });
            
            DOM.trialTimer.classList.add('hidden');
            updateHUD();
            showStatus('⚠️ Missed! Release over basket', 1500);
            
            // Reset trial
            setTimeout(() => {
              spawnFruit();
            }, 1500);
          } else {
            const trialDuration = Date.now() - trialStartTime;
            const aratScore = calculateAratScore(trialDuration);
            aratTotalScore += aratScore;
            score += CONFIG.SCORE_PER_DROP;
            reps++;
            successes++;
            attempts++;
            
            if (trialTimeoutId) {
              clearTimeout(trialTimeoutId);
              trialTimeoutId = null;
            }
            
            logs.push({
              timestamp: nowSec(),
              event: 'drop_success',
              trial_id: trialId,
              mode: 'NORMAL',
              hand: label,
              hand_function_left: calibration.leftCanOpen && calibration.leftCanClose ? 'full' : 'limited',
              hand_function_right: calibration.rightCanOpen && calibration.rightCanClose ? 'full' : 'limited',
              x_norm: hand.smoothPos.x,
              y_norm: hand.smoothPos.y,
              shoulder_x: hand.shoulder?.x || '',
              shoulder_y: hand.shoulder?.y || '',
              elbow_x: hand.elbow?.x || '',
              elbow_y: hand.elbow?.y || '',
              elbow_angle_deg: hand.elbowAngle ?? '',
              shoulder_angle_deg: hand.shoulderAngle ?? '',
              trunk_twist_deg: hand.trunkTwist ?? '',
              fruit_id: fruit.id,
              source_idx: fruit.sourceIdx,
              basket_idx: basketIdx,
              trial_duration_sec: (trialDuration / 1000).toFixed(2),
              success: true,
              arat_score: aratScore
            });
            
            DOM.trialTimer.classList.add('hidden');
            updateHUD();
            showStatus(`✅ Success! +${CONFIG.SCORE_PER_DROP} points (ARAT: +${aratScore})`, 1500);
            spawnFruit();
          }
        }
      }
    }

    if (fruit.attachedTo === label) {
      fruit.x = hand.smoothPos.x;
      fruit.y = hand.smoothPos.y;
    }
  });
}

// ==================== DRAWING ====================
function syncCanvasSizes() {
  if (DOM.overlay.width !== DOM.video.videoWidth) {
    DOM.overlay.width = DOM.video.videoWidth || 640;
    DOM.overlay.height = DOM.video.videoHeight || 480;
  }
  
  const targetW = DOM.gameCanvas.clientWidth * devicePixelRatio;
  const targetH = DOM.gameCanvas.clientHeight * devicePixelRatio;
  
  if (DOM.gameCanvas.width !== targetW || DOM.gameCanvas.height !== targetH) {
    DOM.gameCanvas.width = targetW;
    DOM.gameCanvas.height = targetH;
  }
}

function drawOverlay() {
  octx.clearRect(0, 0, DOM.overlay.width, DOM.overlay.height);

  const w = DOM.overlay.width;
  const h = DOM.overlay.height;

  if (lastPoseResults && lastPoseResults.poseLandmarks) {
    const pl = lastPoseResults.poseLandmarks;
    [[11, 'L-Sh'], [12, 'R-Sh'], [13, 'L-El'], [14, 'R-El']].forEach(([idx, labelText]) => {
      if (!pl[idx] || pl[idx].visibility < 0.5) return;
      const x = pl[idx].x * w;
      const y = pl[idx].y * h;
      octx.beginPath();
      octx.arc(x, y, 5, 0, Math.PI * 2);
      octx.fillStyle = 'rgba(255, 200, 0, 0.8)';
      octx.fill();
    });
  }

  // Draw hands
  ['Left', 'Right'].forEach(label => {
    const hand = handState[label];
    if (!hand.landmarks || !hand.visible) return;

    const lm = hand.landmarks;
    const color = hand.closed ? 'rgba(220, 50, 50, 0.9)' : 'rgba(50, 200, 80, 0.9)';
    
    const palmCenter = {
      x: (lm[0].x + lm[5].x + lm[9].x + lm[13].x + lm[17].x) / 5,
      y: (lm[0].y + lm[5].y + lm[9].y + lm[13].y + lm[17].y) / 5
    };

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];
    
    octx.strokeStyle = color;
    octx.lineWidth = 2;
    connections.forEach(([start, end]) => {
      const p1 = lm[start];
      const p2 = lm[end];
      octx.beginPath();
      octx.moveTo(p1.x * w, p1.y * h);
      octx.lineTo(p2.x * w, p2.y * h);
      octx.stroke();
    });
    
    lm.forEach((landmark, i) => {
      const x = landmark.x * w;
      const y = landmark.y * h;
      octx.beginPath();
      
      let radius = 4;
      if (i === 8) radius = 10;
      else if ([4, 12, 16, 20].includes(i)) radius = 7;
      else if (i === 0) radius = 6;
      
      octx.arc(x, y, radius, 0, Math.PI * 2);
      octx.fillStyle = color;
      octx.fill();
      
      if ([0, 4, 8, 12, 16, 20].includes(i)) {
        octx.strokeStyle = '#fff';
        octx.lineWidth = 2;
        octx.stroke();
      }
    });
    
    // Palm center marker
    const pcx = palmCenter.x * w;
    const pcy = palmCenter.y * h;
    octx.beginPath();
    octx.arc(pcx, pcy, 16, 0, Math.PI * 2);
    octx.strokeStyle = hand.closed ? '#ff6b6b' : '#51cf66';
    octx.lineWidth = 3;
    octx.stroke();
    
    octx.beginPath();
    octx.moveTo(pcx - 12, pcy);
    octx.lineTo(pcx + 12, pcy);
    octx.moveTo(pcx, pcy - 12);
    octx.lineTo(pcx, pcy + 12);
    octx.stroke();
    
    octx.beginPath();
    octx.arc(pcx, pcy, 4, 0, Math.PI * 2);
    octx.fillStyle = hand.closed ? '#ff6b6b' : '#51cf66';
    octx.fill();

    // Draw label with state
    const stateText = hand.closed ? 'CLOSED' : 'OPEN';
    const boxWidth = 120;
    octx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    octx.fillRect(pcx + 20, pcy - 16, boxWidth, 26);
    
    octx.fillStyle = hand.closed ? '#ff6b6b' : '#51cf66';
    octx.font = 'bold 14px Arial';
    octx.fillText(`${label} ${stateText}`, pcx + 26, pcy);
  });
}

function drawGame() {
  gctx.clearRect(0, 0, DOM.gameCanvas.width, DOM.gameCanvas.height);

  const w = DOM.gameCanvas.width;
  const h = DOM.gameCanvas.height;
  const scale = devicePixelRatio;

  // Draw holes
  gridHoles.forEach((hole, idx) => {
    const px = hole.x * w;
    const py = hole.y * h;
    const r = Math.max(35 * scale, CONFIG.PICK_DISTANCE * Math.min(w, h));

    gctx.beginPath();
    gctx.fillStyle = idx === basketIdx ? 'rgba(180, 255, 180, 0.9)' : 'rgba(255, 255, 255, 0.7)';
    gctx.arc(px, py, r, 0, Math.PI * 2);
    gctx.fill();
    gctx.strokeStyle = idx === basketIdx ? '#2f7a2f' : '#999';
    gctx.lineWidth = 3 * scale;
    gctx.stroke();

    // Larger basket emoji - increased from 24px to 36px for better visibility
    gctx.fillStyle = '#000';
    gctx.font = `${idx === basketIdx ? 'bold ' : ''}${idx === basketIdx ? '36px' : '13px'} Arial`; // Increased size
    gctx.textAlign = 'center';
    gctx.fillText(idx === basketIdx ? '🧺' : `${idx}`, px, py + 5 * scale);
  });

  // Draw fruit
  if (fruit) {
    let fx, fy;
    if (fruit.attachedTo && handState[fruit.attachedTo].smoothPos) {
      fx = handState[fruit.attachedTo].smoothPos.x * w;
      fy = handState[fruit.attachedTo].smoothPos.y * h;
    } else {
      fx = fruit.x * w;
      fy = fruit.y * h;
    }

    gctx.beginPath();
    gctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    gctx.arc(fx + 2, fy + 2, 20 * scale, 0, Math.PI * 2);
    gctx.fill();

    gctx.beginPath();
    gctx.fillStyle = '#ff6347';
    gctx.arc(fx, fy, 20 * scale, 0, Math.PI * 2);
    gctx.fill();
    
    gctx.fillStyle = '#8b4513';
    gctx.fillRect(fx - 2, fy - 28 * scale, 4, 12 * scale);
  }

  // Draw hand cursors
  ['Left', 'Right'].forEach(label => {
    const hand = handState[label];
    if (!hand.smoothPos || !hand.visible) return;

    const px = hand.smoothPos.x * w;
    const py = hand.smoothPos.y * h;
    
    gctx.beginPath();
    gctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    gctx.arc(px + 2, py + 2, 14 * scale, 0, Math.PI * 2);
    gctx.fill();
    
    gctx.beginPath();
    gctx.fillStyle = hand.closed ? 'rgba(220, 50, 50, 0.95)' : 'rgba(50, 200, 80, 0.95)';
    gctx.arc(px, py, 14 * scale, 0, Math.PI * 2);
    gctx.fill();
    gctx.strokeStyle = '#fff';
    gctx.lineWidth = 3 * scale;
    gctx.stroke();
    
    gctx.fillStyle = '#fff';
    gctx.font = `bold ${12 * scale}px Arial`;
    gctx.textAlign = 'center';
    gctx.textBaseline = 'middle';
    gctx.fillText(label[0], px, py);
  });
}

// ==================== UPDATE & CSV ====================
function updateHUD() {
  DOM.scoreEl.textContent = aratTotalScore;
  DOM.repsEl.textContent = reps;
  DOM.succEl.textContent = attempts > 0 ? `${((successes / attempts) * 100).toFixed(0)}%` : '0%';
}

function downloadCSV() {
  const headers = [
    'timestamp_sec','event','trial_id','mode','hand',
    'hand_function_left','hand_function_right',
    'x_norm','y_norm','shoulder_x','shoulder_y','elbow_x','elbow_y',
    'elbow_angle_deg','shoulder_angle_deg','trunk_twist_deg',
    'fruit_id','source_idx','basket_idx','trial_duration_sec','success','arat_score'
  ];
  const rows = [headers.join(',')];
  
  logs.forEach(log => {
    const row = [
      log.timestamp ?? '',
      log.event ?? '',
      log.trial_id ?? '',
      log.mode ?? '',
      log.hand ?? '',
      log.hand_function_left ?? (calibration.leftCanOpen && calibration.leftCanClose ? 'full' : 'limited'),
      log.hand_function_right ?? (calibration.rightCanOpen && calibration.rightCanClose ? 'full' : 'limited'),
      log.x_norm ?? '',
      log.y_norm ?? '',
      log.shoulder_x ?? '',
      log.shoulder_y ?? '',
      log.elbow_x ?? '',
      log.elbow_y ?? '',
      log.elbow_angle_deg ?? '',
      log.shoulder_angle_deg ?? '',
      log.trunk_twist_deg ?? '',
      log.fruit_id ?? '',
      log.source_idx ?? '',
      log.basket_idx ?? '',
      log.trial_duration_sec ?? '',
      log.success ?? '',
      log.arat_score ?? ''
    ];
    rows.push(row.join(','));
  });

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arm-orchard-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== EVENT BINDINGS ====================
DOM.startCalBtn.addEventListener('click', startCalibration);
DOM.startGameBtn.addEventListener('click', startSession);
DOM.stopGameBtn.addEventListener('click', stopGame);
DOM.downloadCsvBtn.addEventListener('click', downloadCSV);
DOM.resetBtn.addEventListener('click', () => location.reload());
DOM.assistiveMode.addEventListener('change', e => {
  assistiveMode = e.target.checked;
  // If user manually changes mode, apply to both hands
  assistiveModeLeft = assistiveMode;
  assistiveModeRight = assistiveMode;
  console.log('Mode switched to:', assistiveMode ? 'ASSISTIVE' : 'NORMAL');
});

// Error modal controls
DOM.retryCamera.addEventListener('click', () => {
  DOM.errorModal.classList.add('hidden');
  setupMediaPipe();
});
DOM.closeError.addEventListener('click', () => {
  DOM.errorModal.classList.add('hidden');
});

// Keyboard shortcuts for debugging
document.addEventListener('keydown', e => {
  if (e.key === 'd' || e.key === 'D') {
    DOM.debugPanel.classList.toggle('hidden');
  }
});

// ==================== MAIN LOOP ====================
function mainLoop() {
  const now = Date.now();
  
  if (now - lastDrawTime >= drawInterval) {
    syncCanvasSizes();
    drawOverlay();
    drawGame();
    lastDrawTime = now;
  }
  
  gameLogicTick();
  
  requestAnimationFrame(mainLoop);
}

// ==================== INITIALIZATION ====================
setupGrid();
setupMediaPipe();
mainLoop();

console.log('🍎 Arm Orchard initialized. Allow camera permissions to start.');
console.log('🔍 Press "D" key to toggle debug panel');
console.log('👊 Make a fist and watch console/debug panel for detection values');