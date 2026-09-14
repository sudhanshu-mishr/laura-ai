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
  Clock,
  Sparkles,
  Sliders,
  CheckCircle2
} from "lucide-react";

export const FocusToolsView: React.FC = () => {
  const {
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
      description: "Soothing pink noise and soft droplet resonance to block distractions.",
      emoji: "🌧️",
    },
    {
      id: "lofi",
      label: "Warm Lo-Fi Chords",
      description: "Analog vinyl texture with slow, gentle pentatonic harmonic chords.",
      emoji: "☕",
    },
    {
      id: "cafe",
      label: "Cozy Campus Cafe",
      description: "Soft acoustic crowd chatter and distant warm coffee shop murmur.",
      emoji: "🥐",
    },
    {
      id: "whitenoise",
      label: "Pure Pink Noise",
      description: "Frequency-balanced smooth ambient noise for ultra-deep concentration.",
      emoji: "🌊",
    },
  ];

  // Timer circle calculation
  const progressPercent =
    timerTotalDuration > 0
      ? ((timerTotalDuration - timerSecondsRemaining) / timerTotalDuration) * 100
      : 0;

  return (
    <div id="focus-tools-view-container" className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
      <div className="pb-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Focus Command Center</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Lock in with custom Pomodoro intervals, session stopwatch, and procedural ambient focus sounds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left: Pomodoro Timer Suite */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm flex flex-col items-center justify-between">
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 text-xs font-semibold w-full max-w-sm justify-center">
            <button
              id="btn-mode-pomodoro"
              onClick={() => setTimerMode("pomodoro")}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                timerMode === "pomodoro"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              25m Focus
            </button>
            <button
              id="btn-mode-shortbreak"
              onClick={() => setTimerMode("short_break")}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                timerMode === "short_break"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              5m Break
            </button>
            <button
              id="btn-mode-longbreak"
              onClick={() => setTimerMode("long_break")}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                timerMode === "long_break"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              15m Long
            </button>
          </div>

          {/* Big Timer Display */}
          <div className="my-8 flex flex-col items-center">
            <div className="font-mono text-6xl sm:text-7xl font-black text-zinc-100 tracking-tighter drop-shadow-sm">
              {formatTime(timerSecondsRemaining)}
            </div>

            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs uppercase tracking-widest font-mono text-zinc-500 font-bold">
                {timerMode.replace("_", " ")}
              </span>
              {pomodorosCompleted > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs">
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
                onClick={pauseTimer}
                className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
            ) : (
              <button
                id="btn-main-timer-start"
                onClick={startTimer}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
              >
                <Play className="w-4 h-4 fill-current" /> Start Focus
              </button>
            )}

            <button
              id="btn-main-timer-reset"
              onClick={resetTimer}
              className="p-3 text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm transition-all"
              title="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Custom Duration Input */}
          <div className="mt-6 pt-4 border-t border-zinc-800/80 w-full flex items-center justify-between text-xs text-zinc-400">
            <span>Custom Minutes:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="120"
                value={customMinutesInput}
                onChange={(e) => setCustomMinutesInput(e.target.value)}
                className="w-16 bg-zinc-950 text-zinc-200 text-xs px-2 py-1 rounded-lg border border-zinc-800 focus:outline-none focus:border-indigo-500 text-center font-mono"
              />
              <button
                id="btn-set-custom-duration"
                onClick={() => setTimerDuration(parseInt(customMinutesInput) || 25)}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold"
              >
                Set
              </button>
            </div>
          </div>
        </div>

        {/* Right: Stopwatch & Session Tracker */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm flex flex-col items-center justify-between">
          <div className="w-full text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Session Stopwatch
            </span>
            <p className="text-xs text-zinc-500">Track total active study or problem-set solving time.</p>
          </div>

          {/* Big Stopwatch Display */}
          <div className="my-8 flex flex-col items-center">
            <div className="font-mono text-6xl sm:text-7xl font-black text-zinc-100 tracking-tighter drop-shadow-sm">
              {formatTime(stopwatchElapsedSeconds)}
            </div>
            <span className="text-xs uppercase tracking-widest font-mono text-zinc-500 mt-2 font-semibold">
              Elapsed Time
            </span>
          </div>

          {/* Stopwatch Controls */}
          <div className="flex items-center gap-3 w-full justify-center">
            {isStopwatchRunning ? (
              <button
                id="btn-main-stopwatch-pause"
                onClick={pauseStopwatch}
                className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
            ) : (
              <button
                id="btn-main-stopwatch-start"
                onClick={startStopwatch}
                className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl shadow-cyan-600/30 transition-all hover:scale-105"
              >
                <Play className="w-4 h-4 fill-current" /> Start Stopwatch
              </button>
            )}

            <button
              id="btn-main-stopwatch-lap"
              disabled={!isStopwatchRunning}
              onClick={lapStopwatch}
              className="p-3 text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-sm transition-all disabled:opacity-40"
              title="Record Lap / Problem"
            >
              <Flag className="w-4 h-4" />
            </button>

            <button
              id="btn-main-stopwatch-reset"
              onClick={resetStopwatch}
              className="p-3 text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm transition-all"
              title="Reset stopwatch"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Recorded Laps */}
          <div className="mt-6 pt-4 border-t border-zinc-800/80 w-full">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span className="font-semibold">Recorded Milestones / Laps:</span>
              <span className="font-mono">{stopwatchLaps.length} logged</span>
            </div>
            {stopwatchLaps.length > 0 ? (
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                {stopwatchLaps.map((lap, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between py-1 px-2.5 rounded-lg bg-zinc-950/70 text-zinc-300 border border-zinc-800/60"
                  >
                    <span>Lap {stopwatchLaps.length - idx}</span>
                    <span className="font-bold text-cyan-400">{formatTime(lap)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-zinc-500 italic block">
                Hit the flag icon during your study session to mark questions or sections.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ambient Focus Soundscapes Section */}
      <div className="mt-8 p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <span>Focus Soundscapes & White Noise</span>
              {isSoundPlaying && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Playing {soundTrack}
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Procedurally synthesized audio in your browser. Zero downloads, zero ads, zero external streaming lag.
            </p>
          </div>

          {/* Master Volume Slider */}
          <div className="flex items-center gap-3 bg-zinc-950 px-3.5 py-2 rounded-2xl border border-zinc-800">
            <button
              onClick={() => (isSoundPlaying ? stopSound() : toggleSound(soundTrack || "rain"))}
              className="text-zinc-400 hover:text-zinc-200"
            >
              {isSoundPlaying ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundVolume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 sm:w-32 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="font-mono text-xs text-zinc-400 w-8 text-right">
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
                    ? "bg-indigo-600/15 border-indigo-500/60 shadow-lg shadow-indigo-600/10"
                    : "bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900/60 hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{track.emoji}</span>
                    {isActive ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold animate-pulse">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-500">Offline</span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-zinc-100">{track.label}</h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    {track.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">
                    {isActive ? "Tap to pause" : "Tap to play"}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isActive ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400"
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
