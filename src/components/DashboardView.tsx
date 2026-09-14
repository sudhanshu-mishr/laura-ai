import React from "react";
import { useStudy } from "../context/StudyContext";
import { useFocus } from "../context/FocusContext";
import { NavTab } from "./Sidebar";
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Flame,
  FileText,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Youtube,
  BookOpen,
  UploadCloud
} from "lucide-react";

interface DashboardViewProps {
  setCurrentTab: (tab: NavTab) => void;
  onOpenUploadModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setCurrentTab,
  onOpenUploadModal,
}) => {
  const {
    activeCourse,
    activeTopic,
    setActiveTopicId,
    toggleDeadlineComplete,
    toggleTopicComplete,
    notes,
    courses,
  } = useStudy();

  const {
    timerSecondsRemaining,
    isTimerRunning,
    startTimer,
    pauseTimer,
    pomodorosCompleted,
    stopwatchElapsedSeconds,
    isStopwatchRunning,
    startStopwatch,
    pauseStopwatch,
  } = useFocus();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Stats
  const allTopics = activeCourse?.modules.flatMap((m) => m.topics) || [];
  const completedTopics = allTopics.filter((t) => t.isCompleted);
  const totalTopicsCount = allTopics.length;
  const progressPercent =
    totalTopicsCount > 0
      ? Math.round((completedTopics.length / totalTopicsCount) * 100)
      : 0;

  // Next upcoming topic to study
  const nextIncompleteTopic = allTopics.find((t) => !t.isCompleted) || allTopics[0] || null;

  // Upcoming deadlines (uncompleted first)
  const sortedDeadlines = (activeCourse?.deadlines || []).slice(0, 5);

  return (
    <div id="dashboard-view-container" className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Study Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-mono font-semibold">
              Lock In Mode
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            {activeCourse
              ? `Currently crushing ${activeCourse.name} (${activeCourse.code || "Active"}). Let's get through these modules.`
              : "Welcome to StudyHQ. Upload a syllabus or pick a sample course to generate your study command center."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-dash-upload-syllabus"
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Syllabus</span>
          </button>
        </div>
      </div>

      {/* Top 4 Quick Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Topics Mastered
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-mono font-bold text-zinc-100">
              {completedTopics.length}
            </span>
            <span className="text-xs text-zinc-500">/ {totalTopicsCount}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Pomodoro Focus
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-mono font-bold text-amber-400">
              {pomodorosCompleted}
            </span>
            <span className="text-xs text-zinc-500">done</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Active Session
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-mono font-bold text-cyan-400">
              {formatTime(stopwatchElapsedSeconds)}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Notes Vault
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-mono font-bold text-violet-400">
              {notes.length}
            </span>
            <span className="text-xs text-zinc-500">docs</span>
          </div>
        </div>
      </div>

      {/* Hero "Continue Where You Left Off" & Quick Timer (2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Where Left Off (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950 border border-zinc-800/90 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Continue Where You Left Off
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Course Progress: {progressPercent}%
              </span>
            </div>

            {nextIncompleteTopic ? (
              <div>
                <h2 className="text-lg font-bold text-zinc-100">{nextIncompleteTopic.title}</h2>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed max-w-xl">
                  {nextIncompleteTopic.summary}
                </p>

                {nextIncompleteTopic.keyTerms && nextIncompleteTopic.keyTerms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {nextIncompleteTopic.keyTerms.map((term, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-950/80 border border-zinc-800 text-zinc-400"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4">
                <h3 className="text-base font-bold text-emerald-400">
                  🎉 All modules currently mastered!
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Upload another syllabus or use the AI Tutor for comprehensive exam drills.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {nextIncompleteTopic && (
                <button
                  id="btn-dash-jump-tutor"
                  onClick={() => {
                    setActiveTopicId(nextIncompleteTopic.id);
                    setCurrentTab("tutor");
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all"
                >
                  <span>Start Teaching With AI TA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                id="btn-dash-view-roadmap"
                onClick={() => setCurrentTab("syllabus")}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Full Roadmap</span>
              </button>
            </div>

            {nextIncompleteTopic && (
              <button
                id="btn-dash-mark-mastered"
                onClick={() => {
                  if (activeCourse) {
                    toggleTopicComplete(activeCourse.id, nextIncompleteTopic.id);
                  }
                }}
                className="text-xs text-zinc-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Mastered</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Focus Card (1 Col) */}
        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Quick Focus Timer
              </span>
              <button
                onClick={() => setCurrentTab("focus")}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 underline"
              >
                Full Studio
              </button>
            </div>

            <div className="my-4 text-center">
              <div className="font-mono text-4xl font-extrabold text-zinc-100 tracking-tight">
                {formatTime(timerSecondsRemaining)}
              </div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-1 block">
                25 Min Pomodoro
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-3 border-t border-zinc-800/80">
            {isTimerRunning ? (
              <button
                id="btn-dash-timer-pause"
                onClick={pauseTimer}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all"
              >
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
            ) : (
              <button
                id="btn-dash-timer-start"
                onClick={startTimer}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Focus
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom 2 Columns: Deadlines & Quick Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadlines Card */}
        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Upcoming Deadlines & Exams</span>
            </h3>
            <button
              onClick={() => setCurrentTab("syllabus")}
              className="text-[11px] text-indigo-400 hover:text-indigo-300"
            >
              View all
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {sortedDeadlines.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No upcoming deadlines.</p>
            ) : (
              sortedDeadlines.map((dl) => {
                const isDone = dl.isCompleted;
                const isExam = dl.type === "exam";
                return (
                  <div
                    key={dl.id}
                    id={`dash-deadline-${dl.id}`}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isDone
                        ? "bg-zinc-950/40 border-zinc-800/40 opacity-70"
                        : isExam
                        ? "bg-rose-950/20 border-rose-500/30"
                        : "bg-zinc-950/70 border-zinc-800/70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() =>
                          activeCourse && toggleDeadlineComplete(activeCourse.id, dl.id)
                        }
                        className="text-zinc-500 hover:text-emerald-400 transition-colors"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <span
                          className={`text-xs font-semibold block ${
                            isDone ? "line-through text-zinc-500" : "text-zinc-200"
                          }`}
                        >
                          {dl.title}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-300">
                          {dl.dueDate}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        isExam ? "bg-rose-500/20 text-rose-300" : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {dl.type}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modules & Progress Quickview */}
        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Active Course Roadmap</span>
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">
              {completedTopics.length}/{totalTopicsCount} topics done
            </span>
          </div>

          <div className="mt-3 space-y-2.5">
            {activeCourse?.modules.slice(0, 4).map((mod, idx) => {
              const modCompleted = mod.topics.filter((t) => t.isCompleted).length;
              const modTotal = mod.topics.length;
              const isModComplete = modCompleted === modTotal && modTotal > 0;
              return (
                <div
                  key={mod.id}
                  onClick={() => setCurrentTab("syllabus")}
                  className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-indigo-400 border border-zinc-800">
                      W{mod.weekNumber || idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-zinc-200 line-clamp-1">
                      {mod.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-400">
                      {modCompleted}/{modTotal}
                    </span>
                    {isModComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
