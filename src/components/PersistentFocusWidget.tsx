import React, { useState } from "react";
import { useFocus } from "../context/FocusContext";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Flame, Clock, Radio, Maximize2, Minimize2, ChevronUp, ChevronDown } from "lucide-react";
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
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-[#FFFFFF]/95 dark:bg-[#262624]/95 hover:bg-[#FAF9F5] dark:hover:bg-[#20201F] text-[#1F1E1D] dark:text-[#ECECEC] border border-[#DDDDDD] dark:border-[#30302E] rounded-full shadow-lg backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs font-semibold">
            {activeWidgetTab === "timer"
              ? formatTime(timerSecondsRemaining)
              : formatTime(stopwatchElapsedSeconds)}
          </span>
          {isSoundPlaying && (
            <span className="text-xs text-[#D97757] font-medium">🎵 Playing</span>
          )}
          <ChevronUp className="w-3.5 h-3.5 text-[#888888]" />
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
          className="mb-3 w-80 sm:w-96 bg-[#FFFFFF]/95 dark:bg-[#262624]/95 border border-[#E5E5E0] dark:border-[#30302E] rounded-3xl p-5 shadow-2xl backdrop-blur-xl transition-all"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#F0EEE6] dark:border-[#30302E] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#D97757]/10 text-[#D97757]">
                <Clock className="w-4 h-4" />
              </span>
              <span className="text-sm font-serif font-semibold text-[#1F1E1D] dark:text-[#ECECEC]">Focus Tools</span>
            </div>
            <div className="flex items-center gap-1.5">
              {onOpenFullFocus && (
                <button
                  id="btn-open-full-focus-studio"
                  type="button"
                  onClick={() => {
                    setIsWidgetOpen(false);
                    onOpenFullFocus();
                  }}
                  className="p-1 text-[#888888] hover:text-[#D97757] rounded-md hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] text-xs cursor-pointer"
                  title="Open Full Focus Studio"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
              <button
                id="btn-minimize-focus-widget"
                type="button"
                onClick={() => setIsWidgetOpen(false)}
                className="p-1 text-[#888888] hover:text-[#1F1E1D] dark:hover:text-white rounded-md hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] text-xs cursor-pointer"
                title="Minimize panel"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="grid grid-cols-3 gap-1 bg-[#FAF9F5] dark:bg-[#20201F] p-1 rounded-xl mb-4 border border-[#DDDDDD] dark:border-[#404040] text-xs font-medium">
            <button
              id="tab-widget-timer"
              type="button"
              onClick={() => setActiveWidgetTab("timer")}
              className={`py-1.5 rounded-lg transition-all ${
                activeWidgetTab === "timer"
                  ? "bg-[#FFFFFF] dark:bg-[#262624] text-[#1F1E1D] dark:text-[#ECECEC] shadow-2xs font-semibold"
                  : "text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D]"
              }`}
            >
              Pomodoro
            </button>
            <button
              id="tab-widget-stopwatch"
              type="button"
              onClick={() => setActiveWidgetTab("stopwatch")}
              className={`py-1.5 rounded-lg transition-all ${
                activeWidgetTab === "stopwatch"
                  ? "bg-[#FFFFFF] dark:bg-[#262624] text-[#1F1E1D] dark:text-[#ECECEC] shadow-2xs font-semibold"
                  : "text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D]"
              }`}
            >
              Stopwatch
            </button>
            <button
              id="tab-widget-sounds"
              type="button"
              onClick={() => setActiveWidgetTab("sounds")}
              className={`py-1.5 rounded-lg transition-all ${
                activeWidgetTab === "sounds"
                  ? "bg-[#FFFFFF] dark:bg-[#262624] text-[#1F1E1D] dark:text-[#ECECEC] shadow-2xs font-semibold"
                  : "text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D]"
              }`}
            >
              Sounds
            </button>
          </div>

          {/* Tab Content: Timer */}
          {activeWidgetTab === "timer" && (
            <div className="flex flex-col items-center py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider text-[#888888] font-semibold">
                  {timerMode.replace("_", " ")}
                </span>
                {pomodorosCompleted > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#D97757] font-mono bg-[#D97757]/10 px-2 py-0.5 rounded-full">
                    <Flame className="w-3 h-3" /> {pomodorosCompleted} done
                  </span>
                )}
              </div>
              <div className="font-mono text-4xl font-bold text-[#1F1E1D] dark:text-[#ECECEC] my-2 tracking-tight">
                {formatTime(timerSecondsRemaining)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {isTimerRunning ? (
                  <button
                    id="btn-widget-timer-pause"
                    type="button"
                    onClick={pauseTimer}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-semibold transition-all border border-amber-500/30 cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </button>
                ) : (
                  <button
                    id="btn-widget-timer-start"
                    type="button"
                    onClick={startTimer}
                    className="flex items-center gap-2 px-4 py-2 bg-[#D97757] hover:bg-[#C6613F] text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Start
                  </button>
                )}
                <button
                  id="btn-widget-timer-reset"
                  type="button"
                  onClick={resetTimer}
                  className="p-2 text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white bg-[#FAF9F5] dark:bg-[#20201F] border border-[#DDDDDD] dark:border-[#404040] rounded-xl text-xs transition-all cursor-pointer"
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
              <span className="text-xs uppercase tracking-wider text-[#888888] font-semibold mb-1">
                Study Session
              </span>
              <div className="font-mono text-4xl font-bold text-[#1F1E1D] dark:text-[#ECECEC] my-2 tracking-tight">
                {formatTime(stopwatchElapsedSeconds)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {isStopwatchRunning ? (
                  <button
                    id="btn-widget-stopwatch-pause"
                    type="button"
                    onClick={pauseStopwatch}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-semibold transition-all border border-amber-500/30 cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </button>
                ) : (
                  <button
                    id="btn-widget-stopwatch-start"
                    type="button"
                    onClick={startStopwatch}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3D3D3A] hover:bg-[#20201F] text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Track
                  </button>
                )}
                <button
                  id="btn-widget-stopwatch-reset"
                  type="button"
                  onClick={resetStopwatch}
                  className="p-2 text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white bg-[#FAF9F5] dark:bg-[#20201F] border border-[#DDDDDD] dark:border-[#404040] rounded-xl text-xs transition-all cursor-pointer"
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
                      type="button"
                      onClick={() => toggleSound(track.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#D97757]/15 border-[#D97757] text-[#D97757]"
                          : "bg-[#FAF9F5] dark:bg-[#20201F] border-[#E5E5E0] dark:border-[#30302E] text-[#73726C] dark:text-[#B4B4B4] hover:border-[#D97757]/50"
                      }`}
                    >
                      <span className="text-base">{track.icon}</span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#1F1E1D] dark:text-[#ECECEC]">{track.label}</span>
                        <span className="text-[10px] text-[#888888]">
                          {isActive ? "Playing" : "Offline"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2.5 px-3 py-2 bg-[#FAF9F5] dark:bg-[#20201F] rounded-xl border border-[#E5E5E0] dark:border-[#30302E]">
                <button
                  id="btn-widget-sound-mute"
                  type="button"
                  onClick={() => (isSoundPlaying ? stopSound() : toggleSound(soundTrack || "rain"))}
                  className="text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white cursor-pointer"
                >
                  {isSoundPlaying ? <Volume2 className="w-4 h-4 text-[#D97757]" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <input
                  id="slider-widget-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#DDDDDD] dark:bg-[#404040] rounded-lg appearance-none cursor-pointer accent-[#D97757]"
                />
                <span className="font-mono text-[10px] text-[#888888] w-8 text-right">
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
        className="flex items-center gap-2.5 px-3.5 py-2 bg-[#FFFFFF]/95 dark:bg-[#262624]/95 border border-[#E5E5E0] dark:border-[#30302E] rounded-2xl shadow-xl backdrop-blur-md hover:border-[#D97757]/40 transition-all"
      >
        {/* Timer status */}
        <button
          id="btn-dock-open-timer"
          type="button"
          onClick={() => {
            setActiveWidgetTab("timer");
            setIsWidgetOpen(!isWidgetOpen);
          }}
          className="flex items-center gap-2 group text-left cursor-pointer"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isTimerRunning ? "bg-emerald-500 animate-pulse" : "bg-[#888888]"
            }`}
          />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-[#888888] group-hover:text-[#D97757] font-semibold">
              Timer
            </span>
            <span className="font-mono text-sm font-bold text-[#1F1E1D] dark:text-[#ECECEC]">
              {formatTime(timerSecondsRemaining)}
            </span>
          </div>
        </button>

        <div className="h-6 w-px bg-[#E5E5E0] dark:bg-[#30302E]" />

        {/* Stopwatch status */}
        <button
          id="btn-dock-open-stopwatch"
          type="button"
          onClick={() => {
            setActiveWidgetTab("stopwatch");
            setIsWidgetOpen(!isWidgetOpen);
          }}
          className="flex items-center gap-2 group text-left cursor-pointer"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isStopwatchRunning ? "bg-cyan-500 animate-pulse" : "bg-[#888888]"
            }`}
          />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-[#888888] group-hover:text-[#D97757] font-semibold">
              Session
            </span>
            <span className="font-mono text-sm font-bold text-[#1F1E1D] dark:text-[#ECECEC]">
              {formatTime(stopwatchElapsedSeconds)}
            </span>
          </div>
        </button>

        <div className="h-6 w-px bg-[#E5E5E0] dark:bg-[#30302E]" />

        {/* White noise toggle */}
        <button
          id="btn-dock-open-sound"
          type="button"
          onClick={() => {
            setActiveWidgetTab("sounds");
            setIsWidgetOpen(!isWidgetOpen);
          }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            isSoundPlaying
              ? "bg-[#D97757]/15 text-[#D97757] border border-[#D97757]/30"
              : "text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] hover:bg-[#F0EEE6] dark:hover:bg-[#30302E]"
          }`}
          title={isSoundPlaying ? `Playing ${soundTrack}` : "Focus Ambience"}
        >
          {isSoundPlaying ? (
            <>
              <Radio className="w-3.5 h-3.5 text-[#D97757] animate-pulse" />
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
          type="button"
          onClick={() => setIsWidgetOpen(!isWidgetOpen)}
          className="p-1.5 text-[#888888] hover:text-[#1F1E1D] dark:hover:text-white hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] rounded-xl text-xs cursor-pointer"
          title="Toggle Full Focus Panel"
        >
          {isWidgetOpen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Minimize to subtle pill */}
        <button
          id="btn-dock-minimize"
          type="button"
          onClick={() => {
            setIsWidgetOpen(false);
            setIsMinimized(true);
          }}
          className="p-1.5 text-[#888888] hover:text-[#1F1E1D] dark:hover:text-white hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] rounded-xl text-xs cursor-pointer"
          title="Minimize Widget"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
