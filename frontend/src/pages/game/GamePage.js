import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { gameService } from "../../services/gameService";
import {
  Play,
  Pause,
  RotateCcw,
  Home,
  Settings,
  ArrowRight,
} from "lucide-react";
import GameImage1 from "./1.png";
import GameImage2 from "./2.png";
import GameImage3 from "./3.png";

const PRIMARY_BLUE = "#3B82F6";
const LIGHT_BLUE = "#93C5FD";

// --- Onboarding Screen ---
const OnboardingScreen = ({ onNext, currentLevelSpan, isDarkMode }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  const instructionText = `
    Welcome! This is how to play the Piano Reaction Game. 
    Step 1: WATCH. A piano key section will turn black. Your goal is to identify the active key.
    Step 2: TAP QUICKLY. Quickly tap the corresponding black section or press the matching key on your keyboard. Tapping the wrong key gives an Incorrect response.
    Step 3: BE FAST. You have ${currentLevelSpan} seconds to respond. Being too slow results in a Not Done status. 
    Tap Start Game Setup when you are ready.
  `;

  const initializeTTS = () => {
    utteranceRef.current = new SpeechSynthesisUtterance(instructionText);
    utteranceRef.current.rate = 1;
    utteranceRef.current.pitch = 1.5;

    const voices = synthRef.current.getVoices();
    const desiredVoice =
      voices.find((voice) => voice.lang.startsWith("en")) || voices[0];
    if (desiredVoice) {
      utteranceRef.current.voice = desiredVoice;
    }

    utteranceRef.current.onend = () => {
      if (isSpeaking) {
        startSpeaking();
      } else {
        setIsSpeaking(false);
      }
    };
  };

  const startSpeaking = () => {
    if (!utteranceRef.current) initializeTTS();
    if (synthRef.current.paused) {
      synthRef.current.resume();
    } else if (!synthRef.current.speaking) {
      synthRef.current.speak(utteranceRef.current);
    }
    setIsSpeaking(true);
    setIsMuted(false);
  };

  const pauseSpeaking = () => {
    synthRef.current.pause();
    setIsSpeaking(false);
  };

  const toggleMute = () => {
    if (isSpeaking) {
      pauseSpeaking();
      setIsMuted(true);
    } else if (isMuted) {
      startSpeaking();
      setIsMuted(false);
    } else {
      startSpeaking();
    }
  };

  const handleNext = () => {
    synthRef.current.cancel();
    onNext();
  };

  useEffect(() => {
    initializeTTS();
    const timer = setTimeout(startSpeaking, 500);
    const synth = synthRef.current;

    return () => {
      synth.cancel();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remove the broken useDarkMode hook call

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center p-4 md:p-10 z-50 overflow-auto transition-colors duration-300 ${isDarkMode ? "bg-black" : "bg-gray-50"}`}
    >
      <div
        className={`max-w-4xl w-full rounded-[2.5rem] shadow-2xl p-6 md:p-10 border-4 relative flex flex-col transition-all duration-300 ${isDarkMode ? "bg-gray-900 border-primary-500/30" : "bg-white border-primary-500"}`}
        style={{ maxHeight: "90vh" }}
      >
        {/* TTS Control Button */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
          <button
            onClick={toggleMute}
            className="p-3 rounded-full transition text-white shadow-lg"
            style={{ backgroundColor: PRIMARY_BLUE }}
            aria-label={
              isSpeaking ? "Pause Instructions" : "Listen to Instructions"
            }
          >
            {isSpeaking ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>
          <p
            className="text-xs text-center mt-1"
            style={{ color: PRIMARY_BLUE }}
          >
            {isSpeaking ? "Listening" : "Tap to Listen"}
          </p>
        </div>

        <div className="overflow-y-auto pr-2 mb-24">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-6 tracking-tight dark:text-white">
            👋 Welcome! <span className="text-primary-500">How to Play</span>
          </h2>

          <div className="space-y-6 md:space-y-8 text-lg text-gray-700 dark:text-gray-300">
            <p className="text-xl md:text-2xl font-bold text-center">
              Follow these{" "}
              <span className="text-primary-500 underline decoration-primary-500/30 underline-offset-8">
                three simple steps
              </span>{" "}
              to excel.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="flex flex-col items-center p-6 rounded-[2rem] border-2 bg-green-50/30 dark:bg-green-900/10 border-green-500/20 dark:border-green-500/30 transition-transform hover:scale-[1.02]">
                <h3 className="text-xl font-black mb-2 text-green-600 dark:text-green-400 uppercase tracking-widest">
                  Step 1: WATCH
                </h3>
                <p className="text-center mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  A piano key section will turn black.
                </p>
                <div className="w-full h-32 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-700 overflow-hidden shadow-inner">
                  <img
                    src={GameImage1}
                    alt="Game"
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-green-700 dark:text-green-500">
                  Goal: Identify the active key.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center p-6 rounded-[2rem] border-2 bg-red-50/30 dark:bg-red-900/10 border-red-500/20 dark:border-red-500/30 transition-transform hover:scale-[1.02]">
                <h3 className="text-xl font-black mb-2 text-red-600 dark:text-red-400 uppercase tracking-widest">
                  Step 2: TAP
                </h3>
                <p className="text-center mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Quickly tap the corresponding black.
                </p>
                <div className="w-full h-32 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-700 overflow-hidden shadow-inner">
                  <img
                    src={GameImage2}
                    alt="Game"
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-red-700 dark:text-red-500">
                  Caution: Avoid mistakes!
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center p-6 rounded-[2rem] border-2 bg-yellow-50/30 dark:bg-yellow-900/10 border-yellow-500/20 dark:border-yellow-500/30 transition-transform hover:scale-[1.02]">
                <h3 className="text-xl font-black mb-2 text-yellow-600 dark:text-yellow-400 uppercase tracking-widest">
                  Step 3: SPEED
                </h3>
                <p className="text-center mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Respond within {currentLevelSpan} seconds.
                </p>
                <div className="w-full h-32 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-700 overflow-hidden shadow-inner">
                  <img
                    src={GameImage3}
                    alt="Game"
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-yellow-700 dark:text-yellow-500">
                  Warning: Don't be too slow.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Button - fixed at bottom */}
        <div className="absolute bottom-10 left-0 w-full flex justify-center">
          <button
            onClick={handleNext}
            className="flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:shadow-2xl hover:shadow-primary-500/20 transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl"
          >
            Start Game Setup <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

const PlayingGame = ({
  currentLevelSpan,
  currentNumSections,
  isPaused,
  onPause,
  onResume,
  onEnd,
  onReset,
  currentSection,
  feedbackSection,
  feedbackType,
  attemptCount,
  correctCount,
  incorrectCount,
  notDoneCount,
  accuracy,
  activeKeys,
  noteNames,
  keys,
  handleSectionClick,
  handleKeyPress,
  isMobile,
  isDarkMode,
}) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const PRIMARY_BLUE = "#3B82F6";
  const LIGHT_BLUE = "#93C5FD";

  // Remove the broken useDarkMode hook call

  return (
    <div
      className={`fixed inset-0 flex flex-col overflow-hidden z-50 transition-colors duration-300 ${isDarkMode ? "bg-black" : "bg-white"}`}
    >
      {/* Header */}
      <div
        className="shadow-lg p-3 flex items-center justify-between"
        style={{ backgroundColor: PRIMARY_BLUE, color: "white" }}
      >
        <h1 className="text-xl font-bold">Piano Reaction Game</h1>
        <div className="flex gap-2">
          <button
            onClick={isPaused ? onResume : onPause}
            className={`p-2 rounded-lg transition ${isPaused ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-400 hover:bg-red-500 text-white"}`}
          >
            {isPaused ? (
              <Play className="w-5 h-5" />
            ) : (
              <Pause className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onEnd}
            className="p-2 bg-white hover:bg-gray-200 text-gray-800 rounded-lg transition font-semibold"
          >
            💾 Save
          </button>
          <button
            onClick={onReset}
            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 p-3 bg-white border-b">
        <div className="text-center">
          <p className="text-xs text-gray-600">Attempts</p>
          <p className="text-lg font-bold text-gray-800">{attemptCount}</p>
        </div>
        <div className="text-center">
          <p className="text-xs" style={{ color: "green" }}>
            Correct
          </p>
          <p className="text-lg font-bold" style={{ color: "green" }}>
            {correctCount}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs" style={{ color: "red" }}>
            Incorrect
          </p>
          <p className="text-lg font-bold" style={{ color: "red" }}>
            {incorrectCount}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs" style={{ color: "#CCB000" }}>
            Not Done
          </p>
          <p className="text-lg font-bold" style={{ color: "#CCB000" }}>
            {notDoneCount}
          </p>
        </div>
      </div>

      {/* Piano Sections */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex-1 relative mb-6 border-4 border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50 overflow-hidden">
          <div className="h-full flex flex-col-reverse md:flex-row">
            {activeKeys.map((key, index) => {
              const isActive = currentSection === index;
              const isFeedback = index === feedbackSection;
              const resultClass = isFeedback
                ? feedbackType === "correct"
                  ? "ring-4 ring-green-500/50 scale-105"
                  : feedbackType === "incorrect"
                    ? "ring-4 ring-red-500/50 scale-105"
                    : feedbackType === "notdone"
                      ? "ring-4 ring-yellow-500/50"
                      : ""
                : "";
              const bgClass = isActive ? "bg-black" : "bg-white";
              const textClass = isActive ? "text-white" : "text-gray-400";

              // Highlight "J" and "B" columns on mobile bigger and blue
              const isJB =
                (key === "J" || noteNames[index] === "B") && isMobile;
              const fontSize = isJB
                ? "text-6xl"
                : currentNumSections <= 3
                  ? "text-5xl md:text-8xl"
                  : currentNumSections <= 6
                    ? "text-4xl md:text-7xl"
                    : "text-2xl md:text-5xl";
              const extraMobileStyleClass = isJB
                ? "bg-blue-300/40 scale-105 shadow-lg"
                : "";

              return (
                <div
                  key={index}
                  className={`w-full md:flex-1 flex flex-col items-center justify-center border-b md:border-r border-gray-200 last:border-b-0 md:last:border-r-0 md:last:border-b-0 transition-all duration-200 ${isActive ? "hover:bg-gray-800" : "hover:bg-gray-100"} hover:bg-gray-300 cursor-pointer ${bgClass} ${resultClass} flex-1 ${extraMobileStyleClass}`}
                  onClick={() => handleSectionClick(index)}
                  style={isJB ? { minHeight: "110px", minWidth: "90px" } : {}}
                >
                  <div
                    className={`${fontSize} font-bold ${textClass} transition-colors duration-200 mb-1`}
                  >
                    {key}
                  </div>
                  <span
                    className={`text-xs md:text-sm font-mono ${isActive ? "text-white/80" : "text-gray-500"} transition-colors duration-200`}
                  >
                    {noteNames[index]}
                  </span>
                  {isJB && (
                    <span className="block text-sm text-blue-900 font-bold mt-2">
                      Tap J / B
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
              <div className="text-3xl md:text-4xl text-yellow-500 font-bold">
                ⏸️ PAUSED
              </div>
            </div>
          )}
        </div>

        {/* Mobile-Friendly Keyboard Hint */}
        <div className="flex justify-center flex-wrap gap-2">
          {activeKeys.map((key, index) => {
            const isJB = (key === "J" || noteNames[index] === "B") && isMobile;
            return (
              <div
                key={key}
                className={`px-2 py-3 rounded-lg shadow-lg border-2 text-center touch-manipulation ${isJB ? "bg-blue-500 scale-105" : ""}`}
                style={{
                  backgroundColor: isJB ? "#baf5fe" : LIGHT_BLUE,
                  borderColor: PRIMARY_BLUE,
                }}
              >
                <p className="text-xs text-white font-semibold">Tap</p>
                <p className="text-2xl font-bold text-white">{key}</p>
                <p className="text-xs text-white/80">{noteNames[index]}</p>
                {isJB && (
                  <span className="block text-sm text-blue-900 font-bold mt-2">
                    J / B big!
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Handle key presses - invisible focus */}
      {isPaused ? null : (
        <div
          tabIndex={-1}
          className="invisible fixed inset-0"
          onKeyDown={(e) => {
            const userKey = e.key.toLowerCase();
            if (
              ["a", "s", "d", "f", "g", "h", "j", "k", "l"].includes(userKey)
            ) {
              e.preventDefault();
              handleKeyPress(e.key);
            }
          }}
          ref={(el) => el && el.focus()}
        />
      )}
    </div>
  );
};

// --- Main Game Page Component ---
const GamePage = () => {
  const { user, isDarkMode } = useAuth();
  const navigate = useNavigate();

  // Detect if mobile screen for responsive keys
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
  useEffect(() => {
    const resizeListener = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", resizeListener);
    return () => window.removeEventListener("resize", resizeListener);
  }, []);

  // State variables
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [currentLevelSpan, setCurrentLevelSpan] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNumSections, setCurrentNumSections] = useState(2);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [playData, setPlayData] = useState([]);
  const [sectionStartTime, setSectionStartTime] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [feedbackSection, setFeedbackSection] = useState(null);
  const [feedbackType, setFeedbackType] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tempLevelSpan, setTempLevelSpan] = useState(5);
  const [tempNumSections, setTempNumSections] = useState(2);

  const keysAll = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
  // const noteNamesAll = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D'];
  const noteNamesAll = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];

  const frequencies = [
    261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33,
  ];

  const sectionTimerRef = useRef(null);
  const audioContextRef = useRef(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await gameService.getSettings();
        setCurrentLevelSpan(response.currentlevelspan || 5);
        setCurrentNumSections(response.currentnumsections || 7);
        setTempLevelSpan(response.currentlevelspan || 5);
        setTempNumSections(response.currentnumsections || 7);
      } catch (error) {
        console.error("Failed to load settings:", error);
        setCurrentLevelSpan(5);
        setCurrentNumSections(7);
        setTempLevelSpan(5);
        setTempNumSections(7);
      }
    };
    loadSettings();
    return () => {
      if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
    };
  }, []);

  // Active keys limited by mobile for fewer keys on phone
  const activeKeys = isMobile
    ? keysAll.slice(0, Math.min(currentNumSections, 4)) // max 6 keys on mobile
    : keysAll.slice(0, currentNumSections);
  const noteNames = isMobile
    ? noteNamesAll.slice(0, Math.min(currentNumSections, 4))
    : noteNamesAll.slice(0, currentNumSections);

  // --- Audio helpers ---
  const playPianoSound = (keyIndex) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }
    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = frequencies[keyIndex];
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 1.5,
    );
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1.5);
  };

  const playFeedbackSound = (type) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }
    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    if (type === "correct") {
      if (currentSection !== null) {
        playPianoSound(currentSection);
        return;
      }
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2,
      );
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === "incorrect") {
      oscillator.frequency.value = 200;
      oscillator.type = "sawtooth";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3,
      );
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === "notdone") {
      oscillator.frequency.value = 400;
      oscillator.type = "triangle";
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.15,
      );
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    }
  };

  // Start game core
  const startGame = () => {
    setIsPlaying(true);
    setIsPaused(false);
    setPlayData([]);
    setAttemptCount(0);
    setCurrentSection(null);
    setFeedbackSection(null);
    setFeedbackType(null);
    setSectionStartTime(Date.now());
    showNextSection();
  };

  // Show next piano section randomly
  const showNextSection = () => {
    const randomSection = Math.floor(Math.random() * activeKeys.length);
    setCurrentSection(randomSection);
    setSectionStartTime(Date.now());
    setAttemptCount((old) => old + 1);
    if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
    sectionTimerRef.current = setTimeout(() => {
      if (isPlaying && !isPaused) {
        recordResponse("none", -1, 0, keysAll[randomSection]);
        setFeedbackSection(randomSection);
        setFeedbackType("notdone");
        playFeedbackSound("notdone");
        setTimeout(() => {
          setFeedbackSection(null);
          setFeedbackType(null);
          showNextSection();
        }, 300);
      }
    }, currentLevelSpan * 1000);
  };

  // Key press handler (keyboard or click)
  const handleKeyPress = (key) => {
    if (!isPlaying || isPaused || currentSection === null) return;
    const responseTime = (Date.now() - sectionStartTime) / 1000;
    const userKey = key.toUpperCase();
    const expectedKey = keysAll[currentSection];
    const userIndex = keysAll.indexOf(userKey);
    let correct;
    if (userKey === expectedKey) {
      correct = 1;
    } else if (
      activeKeys.map((k) => k.toLowerCase()).includes(key.toLowerCase())
    ) {
      correct = -1;
    } else {
      return; // ignore keys outside range
    }
    if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
    const roundedTime = Math.round(responseTime * 10) / 10;
    recordResponse(userKey, roundedTime, correct, expectedKey);
    playFeedbackSound(correct === 1 ? "correct" : "incorrect");
    setFeedbackSection(userIndex);
    setFeedbackType(correct === 1 ? "correct" : "incorrect");
    setTimeout(() => {
      setFeedbackSection(null);
      setFeedbackType(null);
      showNextSection();
    }, 300);
  };

  const handleSectionClick = (clickedIndex) => {
    if (!isPlaying || isPaused || currentSection === null) return;
    const responseTime = (Date.now() - sectionStartTime) / 1000;
    const userKey = keysAll[clickedIndex];
    let correct;
    if (clickedIndex === currentSection) {
      correct = 1;
    } else if (clickedIndex < activeKeys.length) {
      correct = -1;
    } else {
      return;
    }
    if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
    const roundedTime = Math.round(responseTime * 10) / 10;
    recordResponse(userKey, roundedTime, correct, keysAll[currentSection]);
    playFeedbackSound(correct === 1 ? "correct" : "incorrect");
    setFeedbackSection(clickedIndex);
    setFeedbackType(correct === 1 ? "correct" : "incorrect");
    setTimeout(() => {
      setFeedbackSection(null);
      setFeedbackType(null);
      showNextSection();
    }, 300);
  };

  const recordResponse = (userResponse, responsetime, correct, shownKey) => {
    const entry = {
      responsetime,
      correct,
    };
    setPlayData((prev) => [...prev, entry]);
    console.log(
      `Key: ${shownKey}, User: ${userResponse}, Time: ${responsetime}s, Correct: ${correct}`,
    );
  };

  // Keydown listener for full window keyboard control
  useEffect(() => {
    const onKeyDown = (e) => {
      const userKey = e.key.toLowerCase();
      if (["a", "s", "d", "f", "g", "h", "j", "k", "l"].includes(userKey)) {
        e.preventDefault();
        handleKeyPress(e.key);
      }
    };
    if (isPlaying && !isPaused) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // End game and save session
  const endGame = async () => {
    setIsPlaying(false);
    setCurrentSection(null);
    if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
    if (playData.length === 0) {
      alert("No data to save. Play at least one round!");
      return;
    }
    try {
      const response = await gameService.saveGameSession({
        levelspan: currentLevelSpan,
        numsections: currentNumSections,
        playData,
      });
      alert(
        `Game session saved!\nScore: ${response.sessionScore}\nTotal Score: ${response.totalScore}\nLevel: ${response.level}`,
      );
      const playAgain = window.confirm("Play another round?");
      if (playAgain) {
        startGame();
      } else {
        navigate(-1);
      }
    } catch (error) {
      console.error("Failed to save session:", error);
      alert("Failed to save game session. Please try again.");
    }
  };

  const pauseGame = () => {
    setIsPaused(true);
    if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
  };

  const resumeGame = () => {
    setIsPaused(false);
    setSectionStartTime(Date.now());
    sectionTimerRef.current = setTimeout(() => {
      if (isPlaying && !isPaused) {
        recordResponse("none", -1, 0, keysAll[currentSection]);
        setFeedbackSection(currentSection);
        setFeedbackType("notdone");
        playFeedbackSound("notdone");
        setTimeout(() => {
          setFeedbackSection(null);
          setFeedbackType(null);
          showNextSection();
        }, 300);
      }
    }, currentLevelSpan * 1000);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSection(null);
    setPlayData([]);
    setAttemptCount(0);
    if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
  };

  // Save settings function
  const saveSettings = async () => {
    try {
      await gameService.updateSettings(user.id, tempLevelSpan, tempNumSections);
      setCurrentLevelSpan(tempLevelSpan);
      setCurrentNumSections(tempNumSections);
      setShowSettings(false);
      alert("Settings updated successfully!");
    } catch (error) {
      alert("Failed to update settings");
    }
  };

  // Stats calculation
  const correctCount = playData.filter((p) => p.correct === 1).length;
  const incorrectCount = playData.filter((p) => p.correct === -1).length;
  const notDoneCount = playData.filter((p) => p.correct === 0).length;
  const accuracy =
    correctCount + incorrectCount > 0
      ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
      : 0;

  // --- Rendering ---
  // Remove redundant declaration

  if (isOnboarding) {
    return (
      <OnboardingScreen
        onNext={() => setIsOnboarding(false)}
        currentLevelSpan={currentLevelSpan}
        isDarkMode={isDarkMode}
      />
    );
  }

  if (isPlaying) {
    return (
      <PlayingGame
        currentLevelSpan={currentLevelSpan}
        currentNumSections={activeKeys.length}
        isPaused={isPaused}
        onPause={pauseGame}
        onResume={resumeGame}
        onEnd={endGame}
        onReset={resetGame}
        currentSection={currentSection}
        feedbackSection={feedbackSection}
        feedbackType={feedbackType}
        attemptCount={attemptCount}
        correctCount={correctCount}
        incorrectCount={incorrectCount}
        notDoneCount={notDoneCount}
        accuracy={accuracy}
        activeKeys={activeKeys}
        noteNames={noteNames}
        keys={keysAll}
        handleSectionClick={handleSectionClick}
        handleKeyPress={handleKeyPress}
        isMobile={isMobile}
        isDarkMode={isDarkMode}
      />
    );
  }

  // Main setup screen after onboarding, before playing
  return (
    <div
      className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${isDarkMode ? "bg-black text-white" : "bg-gray-50 text-gray-900"}`}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div
          className="rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-6 flex items-center justify-between text-white"
          style={{
            background: `linear-gradient(90deg, ${PRIMARY_BLUE}, ${LIGHT_BLUE})`,
          }}
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Piano Reaction Game
            </h1>
            <p className="text-white/90">
              Tap the highlighted (black) piano key section
            </p>
            <p className="text-sm text-white/70 mt-1">
              Level Span: {currentLevelSpan} seconds | Keys:{" "}
              {currentNumSections}
            </p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 md:p-3 bg-white/30 hover:bg-white/50 rounded-lg transition text-white"
            >
              <Settings className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={() => navigate(-1)}
              className="p-2 md:p-3 bg-white/30 hover:bg-white/50 rounded-lg transition text-white"
            >
              <Home className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="premium-card p-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Attempts
            </p>
            <p className="text-3xl font-black dark:text-white">
              {attemptCount}
            </p>
          </div>
          <div className="premium-card p-6 text-center border-l-4 border-l-green-500">
            <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-2">
              Correct
            </p>
            <p className="text-3xl font-black text-green-600 dark:text-green-400">
              {correctCount}
            </p>
          </div>
          <div className="premium-card p-6 text-center border-l-4 border-l-red-500">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">
              Incorrect
            </p>
            <p className="text-3xl font-black text-red-600 dark:text-red-400">
              {incorrectCount}
            </p>
          </div>
          <div className="premium-card p-6 text-center border-l-4 border-l-yellow-500">
            <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-2">
              Not Done
            </p>
            <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400">
              {notDoneCount}
            </p>
          </div>
          <div className="premium-card p-6 text-center border-l-4 border-l-primary-500">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-2">
              Accuracy
            </p>
            <p className="text-3xl font-black text-primary-600 dark:text-primary-400">
              {accuracy}%
            </p>
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-4 md:p-8 mb-4 md:mb-6 border dark:border-gray-800">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 dark:text-white">
            Let's Warm Up!
          </h2>
          <div className="relative h-[60vh] md:h-64 mb-6 md:mb-8 border-4 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 overflow-hidden">
            <div className="h-full flex flex-col-reverse md:flex-row">
              {activeKeys.map((key, index) => {
                const bgClass = "bg-white";
                const textClass = "text-gray-400";
                const fontSize =
                  currentNumSections <= 3
                    ? "text-6xl md:text-9xl"
                    : currentNumSections <= 6
                      ? "text-4xl md:text-7xl"
                      : "text-3xl md:text-5xl";

                return (
                  <div
                    key={index}
                    className={`w-full md:flex-1 flex flex-col items-center justify-center border-b md:border-r border-gray-200 last:border-b-0 md:last:border-r-0 md:last:border-b-0 ${bgClass} flex-1`}
                  >
                    <div className={`${fontSize} font-bold ${textClass} mb-1`}>
                      {key}
                    </div>
                    <span className="text-xs md:text-sm font-mono text-gray-500">
                      {noteNames[index]}
                    </span>
                  </div>
                );
              })}
            </div>
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-black/90">
                <div className="text-center p-4">
                  <p className="text-2xl md:text-3xl text-gray-400 mb-4 font-bold">
                    Ready to Play?
                  </p>
                  <div className="space-y-2 text-base md:text-lg text-gray-600">
                    <p>🎹 Tap the highlighted (black) piano key</p>
                    <p className="text-sm text-gray-500 mt-4">
                      You have {currentLevelSpan} seconds to respond
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2 md:gap-4 justify-center flex-wrap">
            {!isPlaying ? (
              <button
                onClick={startGame}
                className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 text-white rounded-lg font-semibold hover:shadow-lg transition shadow-md text-base md:text-lg min-w-[120px]"
                style={{
                  background: `linear-gradient(90deg, ${PRIMARY_BLUE}, ${LIGHT_BLUE})`,
                }}
              >
                <Play className="w-5 h-5 md:w-6 md:h-6" />
                Start Game
              </button>
            ) : null}
          </div>

          {/* Keyboard Hint - Responsive */}
          <div className="mt-4 md:mt-8 flex justify-center flex-col md:flex-row gap-2">
            {activeKeys.map((key, index) => {
              const isJB =
                (key === "J" || noteNames[index] === "B") && isMobile;
              return (
                <div
                  key={key}
                  className={`px-3 md:px-4 py-2 md:py-3 rounded-lg shadow-lg border-2 min-w-[50px] md:min-w-[60px] text-center ${isJB ? "bg-blue-500 scale-105" : ""}`}
                  style={{
                    backgroundColor: isJB ? "#baf5fe" : LIGHT_BLUE,
                    borderColor: PRIMARY_BLUE,
                  }}
                >
                  <p className="text-xs text-white font-semibold">Tap</p>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {key}
                  </p>
                  <p className="text-xs text-white/80">{noteNames[index]}</p>
                  {isJB && (
                    <span className="block text-sm text-blue-900 font-bold mt-2">
                      J / B big!
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Session Data Preview */}
        {playData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-t">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
              Current Session Data
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 px-3">Attempt</th>
                    <th className="text-left py-2 px-3">Response Time</th>
                    <th className="text-left py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {playData.slice(-10).map((entry, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3">
                        #
                        {playData.length -
                          playData.slice(-10).length +
                          index +
                          1}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`font-semibold ${entry.responsetime === -1 ? "text-yellow-600" : PRIMARY_BLUE}`}
                        >
                          {entry.responsetime === -1
                            ? "Exceeded"
                            : `${entry.responsetime}s`}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {entry.correct === 1 && (
                          <span
                            className="px-2 py-1 bg-green-100 rounded font-semibold"
                            style={{ color: "green" }}
                          >
                            ✓ Correct
                          </span>
                        )}
                        {entry.correct === -1 && (
                          <span
                            className="px-2 py-1 bg-red-100 rounded font-semibold"
                            style={{ color: "red" }}
                          >
                            ✗ Incorrect
                          </span>
                        )}
                        {entry.correct === 0 && (
                          <span
                            className="px-2 py-1 bg-yellow-100 rounded font-semibold"
                            style={{ color: "#CCB000" }}
                          >
                            ⊘ Not Done
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {playData.length > 10 && (
              <p className="text-xs md:text-sm text-gray-500 mt-2 text-center">
                Showing last 10 of {playData.length} attempts
              </p>
            )}
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 max-w-md w-full shadow-2xl border dark:border-gray-800">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">
                Game Settings
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Level Span (seconds):{" "}
                    <span
                      className="text-xl md:text-2xl"
                      style={{ color: PRIMARY_BLUE }}
                    >
                      {tempLevelSpan}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={tempLevelSpan}
                    onChange={(e) => setTempLevelSpan(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: PRIMARY_BLUE }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1s (Harder)</span>
                    <span>10s (Easier)</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    This is how many seconds you'll have to respond to each key.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Number of Keys:{" "}
                    <span
                      className="text-xl md:text-2xl"
                      style={{ color: PRIMARY_BLUE }}
                    >
                      {tempNumSections}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="9"
                    step="1"
                    value={tempNumSections}
                    onChange={(e) =>
                      setTempNumSections(parseInt(e.target.value))
                    }
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: PRIMARY_BLUE }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2 (Easier)</span>
                    <span>9 (Harder)</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    Number of piano keys to use (A= C, S= D, etc.).
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={saveSettings}
                  className="flex-1 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition shadow-md"
                  style={{
                    background: `linear-gradient(90deg, ${PRIMARY_BLUE}, ${LIGHT_BLUE})`,
                  }}
                >
                  💾 Save Settings
                </button>
                <button
                  onClick={() => {
                    setTempLevelSpan(currentLevelSpan);
                    setTempNumSections(currentNumSections);
                    setShowSettings(false);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePage;
