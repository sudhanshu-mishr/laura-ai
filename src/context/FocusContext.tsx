import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { focusAudio, SoundType } from "../utils/audioEngine";
import confetti from "canvas-confetti";

export type TimerMode = "pomodoro" | "short_break" | "long_break" | "custom";

interface FocusContextType {
  // Timer
  timerMode: TimerMode;
  timerSecondsRemaining: number;
  timerTotalDuration: number;
  isTimerRunning: boolean;
  pomodorosCompleted: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setTimerDuration: (minutes: number) => void;
  setTimerMode: (mode: TimerMode) => void;

  // Stopwatch
  stopwatchElapsedSeconds: number;
  isStopwatchRunning: boolean;
  stopwatchLaps: number[];
  startStopwatch: () => void;
  pauseStopwatch: () => void;
  resetStopwatch: () => void;
  lapStopwatch: () => void;

  // White Noise / Focus Audio
  soundTrack: SoundType | null;
  isSoundPlaying: boolean;
  soundVolume: number;
  toggleSound: (track: SoundType) => void;
  stopSound: () => void;
  setVolume: (val: number) => void;

  // Docked Widget
  isWidgetOpen: boolean;
  activeWidgetTab: "timer" | "stopwatch" | "sounds";
  setIsWidgetOpen: (open: boolean) => void;
  setActiveWidgetTab: (tab: "timer" | "stopwatch" | "sounds") => void;
}

const FocusContext = createContext<FocusContextType | null>(null);

const DEFAULT_DURATIONS: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
  custom: 30 * 60,
};

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Timer State
  const [timerMode, setTimerModeState] = useState<TimerMode>("pomodoro");
  const [timerTotalDuration, setTimerTotalDuration] = useState<number>(25 * 60);
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState<number>(0);

  // Stopwatch State
  const [stopwatchElapsedSeconds, setStopwatchElapsedSeconds] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
  const [stopwatchLaps, setStopwatchLaps] = useState<number[]>([]);

  // Sound State
  const [soundTrack, setSoundTrack] = useState<SoundType | null>(null);
  const [isSoundPlaying, setIsSoundPlaying] = useState<boolean>(false);
  const [soundVolume, setSoundVolume] = useState<number>(0.6);

  // Docked widget
  const [isWidgetOpen, setIsWidgetOpen] = useState<boolean>(false);
  const [activeWidgetTab, setActiveWidgetTab] = useState<"timer" | "stopwatch" | "sounds">("timer");

  // Timer Tick
  const timerIntervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerMode === "pomodoro") {
              setPomodorosCompleted((c) => c + 1);
              try {
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.8 },
                });
              } catch (e) {}
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerMode]);

  // Stopwatch Tick
  const stopwatchIntervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = window.setInterval(() => {
        setStopwatchElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
        stopwatchIntervalRef.current = null;
      }
    }
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isStopwatchRunning]);

  // Timer Actions
  const startTimer = () => {
    if (timerSecondsRemaining === 0) {
      setTimerSecondsRemaining(timerTotalDuration);
    }
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSecondsRemaining(timerTotalDuration);
  };

  const setTimerDuration = (minutes: number) => {
    const sec = Math.max(1, minutes) * 60;
    setTimerTotalDuration(sec);
    setTimerSecondsRemaining(sec);
    setTimerModeState("custom");
  };

  const setTimerMode = (mode: TimerMode) => {
    setTimerModeState(mode);
    const duration = DEFAULT_DURATIONS[mode];
    setTimerTotalDuration(duration);
    setTimerSecondsRemaining(duration);
    setIsTimerRunning(false);
  };

  // Stopwatch Actions
  const startStopwatch = () => {
    setIsStopwatchRunning(true);
  };

  const pauseStopwatch = () => {
    setIsStopwatchRunning(false);
  };

  const resetStopwatch = () => {
    setIsStopwatchRunning(false);
    setStopwatchElapsedSeconds(0);
    setStopwatchLaps([]);
  };

  const lapStopwatch = () => {
    setStopwatchLaps((prev) => [stopwatchElapsedSeconds, ...prev]);
  };

  // Sound Actions
  const toggleSound = (track: SoundType) => {
    if (isSoundPlaying && soundTrack === track) {
      focusAudio.stop();
      setIsSoundPlaying(false);
      setSoundTrack(null);
    } else {
      focusAudio.setVolume(soundVolume);
      focusAudio.play(track);
      setIsSoundPlaying(true);
      setSoundTrack(track);
    }
  };

  const stopSound = () => {
    focusAudio.stop();
    setIsSoundPlaying(false);
    setSoundTrack(null);
  };

  const setVolume = (val: number) => {
    setSoundVolume(val);
    focusAudio.setVolume(val);
  };

  return (
    <FocusContext.Provider
      value={{
        timerMode,
        timerSecondsRemaining,
        timerTotalDuration,
        isTimerRunning,
        pomodorosCompleted,
        startTimer,
        pauseTimer,
        resetTimer,
        setTimerDuration,
        setTimerMode,

        stopwatchElapsedSeconds,
        isStopwatchRunning,
        stopwatchLaps,
        startStopwatch,
        pauseStopwatch,
        resetStopwatch,
        lapStopwatch,

        soundTrack,
        isSoundPlaying,
        soundVolume,
        toggleSound,
        stopSound,
        setVolume,

        isWidgetOpen,
        activeWidgetTab,
        setIsWidgetOpen,
        setActiveWidgetTab,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error("useFocus must be used within a FocusProvider");
  }
  return context;
};
