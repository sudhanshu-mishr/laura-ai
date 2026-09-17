import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import { useFocus } from "../context/FocusContext";
import { NavTab } from "./Sidebar";
import { ClaudeChatInput, ClaudeChatInputSendMessagePayload } from "./ui/claude-style-chat-input";
import { LocationMap } from "@/components/ui/expand-map";
import { apiRequest } from "../lib/api";
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  UploadCloud,
  Compass,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Bot,
  FileText,
  Youtube,
  GraduationCap,
  Lightbulb,
  Check,
  Send,
  Loader2,
  X,
  MapPin,
  Flame,
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
    addChatMessage,
    addCourse,
  } = useStudy();

  const {
    timerSecondsRemaining,
    isTimerRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    pomodorosCompleted,
    stopwatchElapsedSeconds,
  } = useFocus();

  const [heroPromptResponse, setHeroPromptResponse] = useState<string | null>(null);
  const [isHeroLoading, setIsHeroLoading] = useState<boolean>(false);
  const [heroStatusMessage, setHeroStatusMessage] = useState<string | null>(null);

  // Study Location Presets for LocationMap
  const studySpotPresets = [
    { name: "Campus Library, Silent Wing", coordinates: "37.7749° N, 122.4194° W", label: "Library" },
    { name: "Campus Cafe & Commons", coordinates: "37.7833° N, 122.4167° W", label: "Cafe" },
    { name: "Dorm Study Desk", coordinates: "37.7690° N, 122.4467° W", label: "Desk" },
  ];
  const [selectedSpot, setSelectedSpot] = useState(studySpotPresets[0]);

  // Time-based greeting
  const currentHour = new Date().getHours();
  let greeting = "Good morning";
  if (currentHour >= 12 && currentHour < 18) {
    greeting = "Good afternoon";
  } else if (currentHour >= 18) {
    greeting = "Good evening";
  }

  const userName = "Scholar";

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Topics & progress
  const allTopics = activeCourse?.modules.flatMap((m) => m.topics) || [];
  const completedTopics = allTopics.filter((t) => t.isCompleted);
  const totalTopicsCount = allTopics.length;
  const progressPercent =
    totalTopicsCount > 0
      ? Math.round((completedTopics.length / totalTopicsCount) * 100)
      : 0;

  const nextIncompleteTopic = allTopics.find((t) => !t.isCompleted) || allTopics[0] || null;
  const sortedDeadlines = (activeCourse?.deadlines || []).slice(0, 4);

  // Handle send from hero Claude-style chat input
  const handleHeroSendMessage = async (payload: ClaudeChatInputSendMessagePayload) => {
    const userText = payload.message.trim();

    // Check if user attached or pasted a syllabus to parse
    if (
      payload.pastedContent.length > 0 ||
      (payload.files.length > 0 &&
        /syllabus|schedule|curriculum/i.test(payload.files[0].file.name))
    ) {
      setHeroStatusMessage("Analyzing and parsing curriculum into study roadmap...");
      setIsHeroLoading(true);

      try {
        let requestBody: any = {};
        if (payload.pastedContent.length > 0) {
          requestBody.text = payload.pastedContent[0].content;
        } else if (payload.files.length > 0) {
          const file = payload.files[0].file;
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => {
              const res = reader.result as string;
              resolve(res.split(",")[1]);
            };
            reader.readAsDataURL(file);
          });
          requestBody.fileBase64 = await base64Promise;
          requestBody.mimeType = file.type || "application/pdf";
          requestBody.fileName = file.name;
        }

        const parsed = await apiRequest<any>("/api/syllabus/parse", {
          method: "POST",
          body: JSON.stringify(requestBody),
        });

        if (parsed && parsed.courseName && parsed.modules) {
          const newCourse = {
            id: `course-${Date.now()}`,
            name: parsed.courseName,
            code: parsed.code || "COURSE 101",
            instructor: parsed.instructor || "Instructor",
            term: parsed.term || "Current Term",
            description: parsed.description || "",
            suggestedStudyOrderExplanation: parsed.suggestedStudyOrderExplanation,
            modules: parsed.modules || [],
            deadlines: parsed.deadlines || [],
            createdAt: new Date().toISOString(),
          };
          addCourse(newCourse);
          setHeroStatusMessage(null);
          setIsHeroLoading(false);
          setCurrentTab("syllabus");
          return;
        }
      } catch (err: any) {
        console.warn("Hero syllabus parse error:", err?.message || err);
        setHeroStatusMessage(null);
      }
    }

    if (!userText && payload.files.length === 0 && payload.pastedContent.length === 0) return;

    // Send query to AI tutor
    setIsHeroLoading(true);
    setHeroPromptResponse(null);
    setHeroStatusMessage(null);

    // Record in chat history
    addChatMessage({
      role: "user",
      content: userText || `[Attached ${payload.files.length} file(s)]`,
    });

    try {
      const data = await apiRequest<{ reply?: string }>("/api/tutor/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `${userText}${
                payload.isThinkingEnabled
                  ? " (Please use deep step-by-step reasoning & break this down thoroughly)"
                  : ""
              }`,
            },
          ],
          courseContext: activeCourse
            ? {
                courseName: activeCourse.name,
                code: activeCourse.code,
                activeTopic: activeTopic?.title,
                keyTerms: activeTopic?.keyTerms,
              }
            : undefined,
          teachingMode: payload.isThinkingEnabled ? "deep_dive" : "socratic",
        }),
      });

      const reply =
        data?.reply || "I've processed your study request! Jump into the AI Tutor to drill further.";
      setHeroPromptResponse(reply);
      addChatMessage({
        role: "model",
        content: reply,
      });
    } catch (err: any) {
      setHeroPromptResponse(
        err?.message ||
          "Couldn't reach the AI tutor right now. Check your connection or try again in a moment."
      );
    } finally {
      setIsHeroLoading(false);
    }
  };

  const handleQuickAction = (promptText: string) => {
    handleHeroSendMessage({
      message: promptText,
      files: [],
      pastedContent: [],
      model: "gemini-flash",
    });
  };

  return (
    <div
      id="dashboard-view-container"
      className="flex-1 w-full min-h-screen px-4 sm:px-8 py-8 max-w-5xl mx-auto space-y-8 animate-fade-in"
    >
      {/* 1. Header & AI Assistant Bar */}
      <div className="w-full text-center pt-2">
        {/* Emblem & Warm Greeting */}
        <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 text-[#D97757]"
          >
            <defs>
              <ellipse id="petal-pair-hero" cx="100" cy="100" rx="88" ry="22" />
            </defs>
            <g fill="#D97757" fillRule="evenodd">
              <use href="#petal-pair-hero" transform="rotate(0 100 100)" />
              <use href="#petal-pair-hero" transform="rotate(45 100 100)" />
              <use href="#petal-pair-hero" transform="rotate(90 100 100)" />
              <use href="#petal-pair-hero" transform="rotate(135 100 100)" />
            </g>
          </svg>
        </div>

        <h1 className="text-2xl sm:text-4xl font-serif font-light text-[#3D3D3A] dark:text-[#E1E1E0] mb-2 tracking-tight">
          {greeting},{" "}
          <span className="relative inline-block pb-1">
            {userName}
            <svg
              className="absolute w-[130%] h-[16px] -bottom-1 -left-[5%] text-[#D97757]"
              viewBox="0 0 140 24"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M6 16 Q 70 24, 134 14"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-[#73726C] dark:text-[#B4B4B4] max-w-md mx-auto mb-6">
          {activeCourse
            ? `${activeCourse.name} • ${progressPercent}% completed`
            : "Upload your course syllabus or ask anything to start learning."}
        </p>

        {/* Central Chat Input */}
        <div className="w-full max-w-2xl mx-auto">
          <ClaudeChatInput
            onSendMessage={handleHeroSendMessage}
            placeholder={
              activeTopic
                ? `Ask about ${activeTopic.title}, paste syllabus, or drop notes...`
                : "Ask a question, paste a syllabus, or drill an exam concept..."
            }
            disabled={isHeroLoading}
          />
        </div>

        {/* 3 Clear Action Pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-3 max-w-2xl mx-auto px-2">
          <button
            type="button"
            onClick={() =>
              handleQuickAction(
                activeTopic
                  ? `Explain core intuition, mental models, and pitfalls for: ${activeTopic.title}`
                  : "Explain this week's key topic simply with intuitive mental models"
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#73726C] dark:text-[#B4B4B4] bg-[#FFFFFF] dark:bg-[#262624] border border-[#DDDDDD] dark:border-[#30302E] rounded-full hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] hover:text-[#1F1E1D] dark:hover:text-[#ECECEC] transition-colors shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97757]" />
            Explain Concept
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickAction(
                activeTopic
                  ? `Write an exam-ready summary sheet with key formulas and terms for: ${activeTopic.title}`
                  : "Create an exam-ready summary sheet for my upcoming midterm"
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#73726C] dark:text-[#B4B4B4] bg-[#FFFFFF] dark:bg-[#262624] border border-[#DDDDDD] dark:border-[#30302E] rounded-full hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] hover:text-[#1F1E1D] dark:hover:text-[#ECECEC] transition-colors shadow-2xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#D97757]" />
            Summary Sheet
          </button>

          <button
            type="button"
            onClick={onOpenUploadModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#D97757] bg-[#D97757]/10 border border-[#D97757]/30 rounded-full hover:bg-[#D97757]/20 transition-colors font-medium shadow-2xs cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload Syllabus
          </button>
        </div>

        {/* Loading Indicator */}
        {isHeroLoading && (
          <div className="max-w-2xl mx-auto mt-4 p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#DDDDDD] dark:border-[#30302E] flex items-center justify-center gap-3 text-xs text-[#73726C] dark:text-[#B4B4B4] shadow-sm animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-[#D97757]" />
            <span>{heroStatusMessage || "StudyHQ is thinking..."}</span>
          </div>
        )}

        {/* Response Card */}
        {heroPromptResponse && !isHeroLoading && (
          <div className="max-w-2xl mx-auto mt-5 text-left p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#DDDDDD] dark:border-[#30302E] shadow-sm animate-fade-in relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EEE6] dark:border-[#30302E] mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D97757]" />
                <span className="text-xs font-semibold text-[#1F1E1D] dark:text-[#ECECEC]">
                  AI Tutor Response
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentTab("tutor")}
                  className="text-xs font-medium text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Continue in Tutor</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setHeroPromptResponse(null)}
                  className="p-1 text-[#888888] hover:text-[#1F1E1D] dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-[#3D3D3A] dark:text-[#E1E1E0] leading-relaxed whitespace-pre-wrap font-sans">
              {heroPromptResponse}
            </div>
          </div>
        )}
      </div>

      {/* 2. Primary Study Focus Card */}
      <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97757] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Next Study Target
            </span>
            {activeCourse?.code && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D97757]/10 text-[#D97757] font-semibold">
                {activeCourse.code}
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-[#888888]">
            Estimated: {nextIncompleteTopic?.estimatedMinutes || 30} min
          </span>
        </div>

        {nextIncompleteTopic ? (
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#1F1E1D] dark:text-[#ECECEC] mb-2">
              {nextIncompleteTopic.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#73726C] dark:text-[#B4B4B4] leading-relaxed max-w-2xl mb-4">
              {nextIncompleteTopic.summary}
            </p>

            {nextIncompleteTopic.keyTerms && nextIncompleteTopic.keyTerms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {nextIncompleteTopic.keyTerms.map((term, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-[#FAF9F5] dark:bg-[#20201F] border border-[#DDDDDD] dark:border-[#404040] text-[#73726C] dark:text-[#B4B4B4]"
                  >
                    {term}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#F0EEE6] dark:border-[#30302E]">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTopicId(nextIncompleteTopic.id);
                    setCurrentTab("tutor");
                  }}
                  className="px-4 py-2 bg-[#D97757] hover:bg-[#C6613F] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <span>Study with AI Tutor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab("syllabus")}
                  className="px-3.5 py-2 bg-[#FAF9F5] dark:bg-[#20201F] hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] text-[#3D3D3A] dark:text-[#E1E1E0] border border-[#DDDDDD] dark:border-[#404040] rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-[#D97757]" />
                  <span>View Syllabus</span>
                </button>
              </div>

              {activeCourse && (
                <button
                  type="button"
                  onClick={() => toggleTopicComplete(activeCourse.id, nextIncompleteTopic.id)}
                  className="text-xs text-[#73726C] dark:text-[#B4B4B4] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Mastered</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <h3 className="text-base font-serif text-emerald-600 dark:text-emerald-400 mb-1">
              🎉 All course topics completed!
            </h3>
            <p className="text-xs text-[#73726C] dark:text-[#B4B4B4]">
              Upload another syllabus or review your saved notes.
            </p>
          </div>
        )}
      </div>

      {/* 3. Study Workspace & Environment Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upcoming Deadlines */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EEE6] dark:border-[#30302E] mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#73726C] dark:text-[#B4B4B4] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#D97757]" />
                <span>Upcoming Deadlines</span>
              </h3>
              <button
                type="button"
                onClick={() => setCurrentTab("syllabus")}
                className="text-[11px] text-[#D97757] hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-2">
              {sortedDeadlines.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#888888]">
                  No upcoming deadlines found.
                </div>
              ) : (
                sortedDeadlines.map((dl) => {
                  const isDone = dl.isCompleted;
                  const isExam = dl.type === "exam";
                  return (
                    <div
                      key={dl.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isDone
                          ? "bg-[#FAF9F5]/40 dark:bg-[#20201F]/40 border-[#E5E5E0]/40 opacity-60"
                          : isExam
                          ? "bg-[#D97757]/5 border-[#D97757]/20"
                          : "bg-[#FAF9F5] dark:bg-[#20201F] border-[#E5E5E0] dark:border-[#30302E]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            activeCourse && toggleDeadlineComplete(activeCourse.id, dl.id)
                          }
                          className="text-[#888888] hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <span
                            className={`text-xs font-semibold block ${
                              isDone
                                ? "line-through text-[#888888]"
                                : "text-[#1F1E1D] dark:text-[#ECECEC]"
                            }`}
                          >
                            {dl.title}
                          </span>
                          <span className="text-[10px] font-mono text-[#D97757]">
                            {dl.dueDate}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                          isExam
                            ? "bg-[#D97757]/20 text-[#D97757]"
                            : "bg-[#F0EEE6] dark:bg-[#30302E] text-[#73726C] dark:text-[#B4B4B4]"
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

          <div className="pt-3 mt-3 border-t border-[#F0EEE6] dark:border-[#30302E] flex items-center justify-between text-xs text-[#888888]">
            <span>Course completion</span>
            <span className="font-mono font-semibold text-[#1F1E1D] dark:text-[#ECECEC]">
              {completedTopics.length}/{totalTopicsCount} topics done ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Right: Study Location Map & Focus Sprint */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EEE6] dark:border-[#30302E] mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#73726C] dark:text-[#B4B4B4] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Study Spot & Focus Zone</span>
              </h3>

              {/* Location Presets */}
              <div className="flex items-center gap-1">
                {studySpotPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSelectedSpot(preset)}
                    className={`px-2 py-0.5 text-[10px] rounded-md transition-all cursor-pointer ${
                      selectedSpot.label === preset.label
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
                        : "text-[#888888] hover:text-[#1F1E1D] dark:hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive LocationMap Component */}
            <div className="flex justify-center py-2">
              <LocationMap
                location={selectedSpot.name}
                coordinates={selectedSpot.coordinates}
                className="my-1"
              />
            </div>
          </div>

          {/* Quick Focus Sprint Section */}
          <div className="pt-4 mt-3 border-t border-[#F0EEE6] dark:border-[#30302E] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D97757]" />
              <div className="flex flex-col">
                <span className="font-mono text-lg font-bold text-[#1F1E1D] dark:text-[#ECECEC] leading-tight">
                  {formatTime(timerSecondsRemaining)}
                </span>
                <span className="text-[10px] text-[#888888]">
                  {isTimerRunning ? "Focus Sprint Active" : "Pomodoro Timer"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isTimerRunning ? (
                <button
                  type="button"
                  onClick={pauseTimer}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F0EEE6] dark:bg-[#30302E] text-[#3D3D3A] dark:text-[#ECECEC] border border-[#DDDDDD] dark:border-[#454540] rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startTimer}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#D97757] hover:bg-[#C6613F] text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Start Focus
                </button>
              )}

              <button
                type="button"
                onClick={() => setCurrentTab("focus")}
                className="px-2.5 py-1.5 text-xs text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-[#ECECEC] rounded-xl transition-all hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] cursor-pointer"
              >
                Studio →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
