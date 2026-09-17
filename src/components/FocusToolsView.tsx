import React, { useState } from "react";
import { useFocus, TimerMode } from "../context/FocusContext";
import { SoundType } from "../utils/audioEngine";
import {
  Play,
  Pause,
  RotateCcw,
  Flag,
  Flame,
  Volume2,
  VolumeX,
} from "lucide-react";

export const FocusToolsView: React.FC = () => {
  const {
    timerMode,
    timerSecondsRemaining,
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
  } = useFocus();

  const [customMinutesInput, setCustomMinutesInput] = useState<string>("30");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const soundList: {
    id: SoundType;
    label: string;
    description: string;
    emoji: string;
  }[] = [
    {
      id: "rain",
      label: "Gentle Rainstorm",
      description: "Soothing pink noise and soft droplet resonance to block ambient distractions.",
      emoji: "🌧️",
    },
    {
      id: "lofi",
      label: "Warm Lo-Fi Chords",
      description: "Analog vinyl warmth with slow, gentle pentatonic harmonic chords.",
      emoji: "☕",
    },
    {
      id: "cafe",
      label: "Cozy Campus Library",
      description: "Quiet page turns, soft acoustic presence, and subtle academic ambience.",
      emoji: "🥐",
    },
    {
      id: "whitenoise",
      label: "Pure Pink Noise",
      description: "Frequency-balanced smooth ambient noise for ultra-deep problem solving.",
      emoji: "🌊",
    },
  ];

  return (
    <div id="focus-tools-view-container" className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full animate-fade-in">
      <div className="pb-6 border-b border-[#E5E5E0] dark:border-[#30302E]">
        <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1E1D] dark:text-[#ECECEC]">Focus Studio</h1>
        <p className="text-xs text-[#73726C] dark:text-[#B4B4B4] mt-1">
          Lock in with custom Pomodoro intervals, session stopwatch, and procedural ambient focus sounds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left: Pomodoro Timer Suite */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] shadow-xs flex flex-col items-center justify-between">
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-[#FAF9F5] dark:bg-[#20201F] p-1.5 rounded-2xl border border-[#DDDDDD] dark:border-[#404040] text-xs font-semibold w-full max-w-sm justify-center">
            <button
              id="btn-mode-pomodoro"
              type="button"
              onClick={() => setTimerMode("pomodoro")}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                timerMode === "pomodoro"
                  ? "bg-[#D97757] text-white shadow-xs"
                  : "text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white"
              }`}
            >
              25m Focus
            </button>
            <button
              id="btn-mode-shortbreak"
              type="button"
              onClick={() => setTimerMode("short_break")}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                timerMode === "short_break"
                  ? "bg-[#D97757] text-white shadow-xs"
                  : "text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white"
              }`}
            >
              5m Break
            </button>
            <button
              id="btn-mode-longbreak"
              type="button"
              onClick={() => setTimerMode("long_break")}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                timerMode === "long_break"
                  ? "bg-[#D97757] text-white shadow-xs"
                  : "text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white"
              }`}
            >
              15m Long
            </button>
          </div>

          {/* Big Timer Display */}
          <div className="my-8 flex flex-col items-center">
            <div className="font-mono text-6xl sm:text-7xl font-bold text-[#1F1E1D] dark:text-[#ECECEC] tracking-tight">
              {formatTime(timerSecondsRemaining)}
            </div>

            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs uppercase tracking-widest font-mono text-[#888888] font-bold">
                {timerMode.replace("_", " ")}
              </span>
              {pomodorosCompleted > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D97757]/10 border border-[#D97757]/20 text-[#D97757] font-mono text-xs">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{pomodorosCompleted} completed</span>
                </div>
              )}
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-3 w-full justify-center">
            {isTimerRunning ? (
              <button
                id="btn-main-timer-pause"
                type="button"
                onClick={pauseTimer}
                className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
            ) : (
              <button
                id="btn-main-timer-start"
                type="button"
                onClick={startTimer}
                className="px-8 py-3 bg-[#D97757] hover:bg-[#C6613F] text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" /> Start Focus
              </button>
            )}

            <button
              id="btn-main-timer-reset"
              type="button"
              onClick={resetTimer}
              className="p-3 text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white bg-[#FAF9F5] dark:bg-[#20201F] border border-[#DDDDDD] dark:border-[#404040] rounded-2xl text-sm transition-all cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Custom Duration Input */}
          <div className="mt-6 pt-4 border-t border-[#F0EEE6] dark:border-[#30302E] w-full flex items-center justify-between text-xs text-[#73726C] dark:text-[#B4B4B4]">
            <span>Custom Minutes:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="120"
                value={customMinutesInput}
                onChange={(e) => setCustomMinutesInput(e.target.value)}
                className="w-16 bg-[#FAF9F5] dark:bg-[#20201F] text-[#1F1E1D] dark:text-[#ECECEC] text-xs px-2 py-1 rounded-lg border border-[#DDDDDD] dark:border-[#404040] focus:outline-hidden focus:border-[#D97757] text-center font-mono"
              />
              <button
                id="btn-set-custom-duration"
                type="button"
                onClick={() => setTimerDuration(parseInt(customMinutesInput) || 25)}
                className="px-3 py-1 bg-[#FAF9F5] dark:bg-[#20201F] hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] border border-[#DDDDDD] dark:border-[#404040] text-[#3D3D3A] dark:text-[#ECECEC] rounded-lg text-xs font-semibold cursor-pointer"
              >
                Set
              </button>
            </div>
          </div>
        </div>

        {/* Right: Stopwatch & Session Tracker */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] shadow-xs flex flex-col items-center justify-between">
          <div className="w-full text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D97757]">
              Session Stopwatch
            </span>
            <p className="text-xs text-[#888888] mt-0.5">Track total active study or problem-set solving time.</p>
          </div>

          {/* Big Stopwatch Display */}
          <div className="my-8 flex flex-col items-center">
            <div className="font-mono text-6xl sm:text-7xl font-bold text-[#1F1E1D] dark:text-[#ECECEC] tracking-tight">
              {formatTime(stopwatchElapsedSeconds)}
            </div>
            <span className="text-xs uppercase tracking-widest font-mono text-[#888888] mt-2 font-semibold">
              Elapsed Time
            </span>
          </div>

          {/* Stopwatch Controls */}
          <div className="flex items-center gap-3 w-full justify-center">
            {isStopwatchRunning ? (
              <button
                id="btn-main-stopwatch-pause"
                type="button"
                onClick={pauseStopwatch}
                className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
            ) : (
              <button
                id="btn-main-stopwatch-start"
                type="button"
                onClick={startStopwatch}
                className="px-8 py-3 bg-[#3D3D3A] hover:bg-[#20201F] text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" /> Start Stopwatch
              </button>
            )}

            <button
              id="btn-main-stopwatch-lap"
              type="button"
              disabled={!isStopwatchRunning}
              onClick={lapStopwatch}
              className="p-3 text-[#D97757] hover:text-[#C6613F] bg-[#D97757]/10 border border-[#D97757]/30 rounded-2xl text-sm transition-all disabled:opacity-40 cursor-pointer"
              title="Record Lap / Problem"
            >
              <Flag className="w-4 h-4" />
            </button>

            <button
              id="btn-main-stopwatch-reset"
              type="button"
              onClick={resetStopwatch}
              className="p-3 text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white bg-[#FAF9F5] dark:bg-[#20201F] border border-[#DDDDDD] dark:border-[#404040] rounded-2xl text-sm transition-all cursor-pointer"
              title="Reset stopwatch"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Recorded Laps */}
          <div className="mt-6 pt-4 border-t border-[#F0EEE6] dark:border-[#30302E] w-full">
            <div className="flex items-center justify-between text-xs text-[#73726C] dark:text-[#B4B4B4] mb-2">
              <span className="font-semibold">Recorded Milestones / Laps:</span>
              <span className="font-mono text-[#888888]">{stopwatchLaps.length} logged</span>
            </div>
            {stopwatchLaps.length > 0 ? (
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                {stopwatchLaps.map((lap, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between py-1 px-2.5 rounded-lg bg-[#FAF9F5] dark:bg-[#20201F] text-[#1F1E1D] dark:text-[#ECECEC] border border-[#E5E5E0] dark:border-[#30302E]"
                  >
                    <span>Lap {stopwatchLaps.length - idx}</span>
                    <span className="font-bold text-[#D97757]">{formatTime(lap)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-[#888888] italic block">
                Hit the flag icon during your study session to mark questions or sections.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ambient Focus Soundscapes Section */}
      <div className="mt-8 p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0EEE6] dark:border-[#30302E]">
          <div>
            <h2 className="text-base font-serif text-[#1F1E1D] dark:text-[#ECECEC] flex items-center gap-2">
              <span>Focus Soundscapes & White Noise</span>
              {isSoundPlaying && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D97757]/15 text-[#D97757] border border-[#D97757]/30 font-mono">
                  Playing {soundTrack}
                </span>
              )}
            </h2>
            <p className="text-xs text-[#73726C] dark:text-[#B4B4B4] mt-0.5">
              Synthesized audio generated right in your browser. Zero external streaming lag.
            </p>
          </div>

          {/* Master Volume Slider */}
          <div className="flex items-center gap-3 bg-[#FAF9F5] dark:bg-[#20201F] px-3.5 py-2 rounded-2xl border border-[#DDDDDD] dark:border-[#404040]">
            <button
              type="button"
              onClick={() => (isSoundPlaying ? stopSound() : toggleSound(soundTrack || "rain"))}
              className="text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white cursor-pointer"
            >
              {isSoundPlaying ? <Volume2 className="w-4 h-4 text-[#D97757]" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundVolume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 sm:w-32 h-1.5 bg-[#DDDDDD] dark:bg-[#404040] rounded-lg appearance-none cursor-pointer accent-[#D97757]"
            />
            <span className="font-mono text-xs text-[#73726C] dark:text-[#B4B4B4] w-8 text-right">
              {Math.round(soundVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Soundscape Track Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {soundList.map((track) => {
            const isActive = isSoundPlaying && soundTrack === track.id;
            return (
              <div
                key={track.id}
                id={`card-sound-${track.id}`}
                onClick={() => toggleSound(track.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isActive
                    ? "bg-[#D97757]/10 border-[#D97757] shadow-xs"
                    : "bg-[#FAF9F5] dark:bg-[#20201F] border-[#E5E5E0] dark:border-[#30302E] hover:border-[#D97757]/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{track.emoji}</span>
                    {isActive ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D97757]/20 text-[#D97757] font-bold animate-pulse">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#888888]">Offline</span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-[#1F1E1D] dark:text-[#ECECEC]">{track.label}</h3>
                  <p className="text-[11px] text-[#73726C] dark:text-[#B4B4B4] mt-1 leading-relaxed">
                    {track.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0EEE6] dark:border-[#30302E] flex items-center justify-between">
                  <span className="text-[11px] text-[#888888]">
                    {isActive ? "Tap to pause" : "Tap to play"}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isActive ? "bg-[#D97757] text-white" : "bg-[#DDDDDD] dark:bg-[#30302E] text-[#73726C] dark:text-[#B4B4B4]"
                    }`}
                  >
                    {isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
