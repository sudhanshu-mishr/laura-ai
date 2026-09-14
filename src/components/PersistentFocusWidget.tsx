import React, { useState } from "react";
import { useFocus } from "../context/FocusContext";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Flame, Clock, Radio, Maximize2, Minimize2, ChevronUp } from "lucide-react";
import { SoundType } from "../utils/audioEngine";

export interface PersistentFocusWidgetProps {
  onOpenFullFocus?: () => void;
}

export const PersistentFocusWidget: React.FC<PersistentFocusWidgetProps> = ({ onOpenFullFocus }) => {
  const {
    timerSecondsRemaining,
    isTimerRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    timerMode,
    pomodorosCompleted,

    stopwatchElapsedSeconds,
    isStopwatchRunning,
    startStopwatch,
    pauseStopwatch,
    resetStopwatch,

    soundTrack,
    isSoundPlaying,
    soundVolume,
    toggleSound,
    stopSound,
    setVolume,

    isWidgetOpen,
    setIsWidgetOpen,
    activeWidgetTab,
    setActiveWidgetTab,
  } = useFocus();

  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const soundTracks: { id: SoundType; label: string; icon: string }[] = [
    { id: "rain", label: "Rainstorm", icon: "🌧️" },
    { id: "lofi", label: "Lo-Fi Beats", icon: "☕" },
    { id: "cafe", label: "Cafe Murmur", icon: "🥐" },
    { id: "whitenoise", label: "Pink Noise", icon: "🌊" },
  ];

  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <button
          id="btn-expand-focus-widget"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 rounded-full shadow-2xl backdrop-blur-md transition-all hover:scale-105"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs font-semibold">
            {activeWidgetTab === "timer"
              ? formatTime(timerSecondsRemaining)
              : formatTime(stopwatchElapsedSeconds)}
          </span>
          {isSoundPlaying && (
            <span className="text-xs text-indigo-400 font-medium">🎵 Playing</span>
          )}
          <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>
    );
  }

  return (
    <aside aria-label="Focus Tools Widget" className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Expanded Popover Panel */}
      {isWidgetOpen && (
        <div
          id="focus-widget-expanded-panel"
          className="mb-3 w-80 sm:w-96 bg-zinc-900/95 border border-zinc-800/90 rounded-2xl p-4 shadow-2xl backdrop-blur-xl transition-all"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Clock className="w-4 h-4" />
              </span>
              <span className="text-sm font-semibold text-zinc-200">StudyHQ Focus Bar</span>
            </div>
            <div className="flex items-center gap-1.5">
              {onOpenFullFocus && (
                <button
                  id="btn-open-full-focus-studio"
                  onClick={() => {
                    setIsWidgetOpen(false);
                    onOpenFullFocus();
                  }}
                  className="p-1 text-zinc-400 hover:text-indigo-300 rounded-md hover:bg-zinc-800 text-xs"
                  title="Open Full Focus Studio"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
              <button
                id="btn-minimize-focus-widget"
                onClick={() => setIsWidgetOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-800 text-xs"
                title="Minimize panel"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="grid grid-cols-3 gap-1 bg-zinc-950/60 p-1 rounded-xl mb-4 border border-zinc-800/50 text-xs font-medium">
            <button
              id="tab-widget-timer"
              onClick={() => setActiveWidgetTab("timer")}
              className={`py-1.5 rounded-lg transition-all ${
                activeWidgetTab === "timer"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Pomodoro
            </button>
            <button
              id="tab-widget-stopwatch"
              onClick={() => setActiveWidgetTab("stopwatch")}
              className={`py-1.5 rounded-lg transition-all ${
                activeWidgetTab === "stopwatch"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Stopwatch
            </button>
            <button
              id="tab-widget-sounds"
              onClick={() => setActiveWidgetTab("sounds")}
              className={`py-1.5 rounded-lg transition-all ${
                activeWidgetTab === "sounds"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sounds
            </button>
          </div>

          {/* Tab Content: Timer */}
          {activeWidgetTab === "timer" && (
            <div className="flex flex-col items-center py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                  {timerMode.replace("_", " ")}
                </span>
                {pomodorosCompleted > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-mono bg-amber-400/10 px-2 py-0.5 rounded-full">
                    <Flame className="w-3 h-3" /> {pomodorosCompleted} done
                  </span>
                )}
              </div>
              <div className="font-mono text-4xl font-extrabold text-zinc-100 my-2 tracking-tight">
                {formatTime(timerSecondsRemaining)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {isTimerRunning ? (
                  <button
                    id="btn-widget-timer-pause"
                    onClick={pauseTimer}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold transition-all border border-amber-500/30"
                  >
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </button>
                ) : (
                  <button
                    id="btn-widget-timer-start"
                    onClick={startTimer}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Start
                  </button>
                )}
                <button
                  id="btn-widget-timer-reset"
                  onClick={resetTimer}
                  className="p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-800 rounded-xl text-xs transition-all"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab Content: Stopwatch */}
          {activeWidgetTab === "stopwatch" && (
            <div className="flex flex-col items-center py-2">
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                Study Session Tracker
              </span>
              <div className="font-mono text-4xl font-extrabold text-zinc-100 my-2 tracking-tight">
                {formatTime(stopwatchElapsedSeconds)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {isStopwatchRunning ? (
                  <button
                    id="btn-widget-stopwatch-pause"
                    onClick={pauseStopwatch}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold transition-all border border-amber-500/30"
                  >
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </button>
                ) : (
                  <button
                    id="btn-widget-stopwatch-start"
                    onClick={startStopwatch}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/30"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Track
                  </button>
                )}
                <button
                  id="btn-widget-stopwatch-reset"
                  onClick={resetStopwatch}
                  className="p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-800 rounded-xl text-xs transition-all"
                  title="Reset Stopwatch"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab Content: White Noise */}
          {activeWidgetTab === "sounds" && (
            <div className="flex flex-col py-1">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {soundTracks.map((track) => {
                  const isActive = isSoundPlaying && soundTrack === track.id;
                  return (
                    <button
                      key={track.id}
                      id={`btn-widget-sound-${track.id}`}
                      onClick={() => toggleSound(track.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all ${
                        isActive
                          ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-200"
                          : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <span className="text-base">{track.icon}</span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-200">{track.label}</span>
                        <span className="text-[10px] text-zinc-500">
                          {isActive ? "Playing" : "Offline"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2.5 px-2 py-1.5 bg-zinc-950/50 rounded-xl border border-zinc-800/60">
                <button
                  id="btn-widget-sound-mute"
                  onClick={() => (isSoundPlaying ? stopSound() : toggleSound(soundTrack || "rain"))}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  {isSoundPlaying ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <input
                  id="slider-widget-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="font-mono text-[10px] text-zinc-400 w-8 text-right">
                  {Math.round(soundVolume * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Persistent Dock Bar */}
      <div
        id="persistent-focus-bar"
        className="flex items-center gap-2.5 px-3.5 py-2 bg-zinc-900/90 border border-zinc-800/90 rounded-2xl shadow-2xl backdrop-blur-md hover:border-zinc-700 transition-all"
      >
        {/* Timer status */}
        <button
          id="btn-dock-open-timer"
          onClick={() => {
            setActiveWidgetTab("timer");
            setIsWidgetOpen(!isWidgetOpen);
          }}
          className="flex items-center gap-2 group text-left"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isTimerRunning ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
            }`}
          />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 group-hover:text-zinc-300 font-semibold">
              Timer
            </span>
            <span className="font-mono text-sm font-bold text-zinc-100">
              {formatTime(timerSecondsRemaining)}
            </span>
          </div>
        </button>

        <div className="h-6 w-px bg-zinc-800" />

        {/* Stopwatch status */}
        <button
          id="btn-dock-open-stopwatch"
          onClick={() => {
            setActiveWidgetTab("stopwatch");
            setIsWidgetOpen(!isWidgetOpen);
          }}
          className="flex items-center gap-2 group text-left"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isStopwatchRunning ? "bg-cyan-400 animate-pulse" : "bg-zinc-600"
            }`}
          />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 group-hover:text-zinc-300 font-semibold">
              Session
            </span>
            <span className="font-mono text-sm font-bold text-zinc-100">
              {formatTime(stopwatchElapsedSeconds)}
            </span>
          </div>
        </button>

        <div className="h-6 w-px bg-zinc-800" />

        {/* White noise toggle */}
        <button
          id="btn-dock-open-sound"
          onClick={() => {
            setActiveWidgetTab("sounds");
            setIsWidgetOpen(!isWidgetOpen);
          }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-medium transition-all ${
            isSoundPlaying
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
          }`}
          title={isSoundPlaying ? `Playing ${soundTrack}` : "Focus Ambience"}
        >
          {isSoundPlaying ? (
            <>
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="capitalize hidden sm:inline">{soundTrack}</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ambience</span>
            </>
          )}
        </button>

        {/* Expand / Collapse toggle */}
        <button
          id="btn-dock-toggle-popover"
          onClick={() => setIsWidgetOpen(!isWidgetOpen)}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl text-xs"
          title="Toggle Full Focus Panel"
        >
          {isWidgetOpen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
