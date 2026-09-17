import React, { useState, useRef, useEffect } from "react";
import { useStudy } from "../context/StudyContext";
import {
  Send,
  Sparkles,
  Bot,
  User,
  HelpCircle,
  Brain,
  Zap,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FilePlus,
  RotateCcw,
  Loader2,
} from "lucide-react";
import Markdown from "react-markdown";
import confetti from "canvas-confetti";
import { NavTab } from "./Sidebar";
import { apiRequest } from "../lib/api";

interface TutorViewProps {
  setCurrentTab: (tab: NavTab) => void;
}

export const TutorView: React.FC<TutorViewProps> = ({ setCurrentTab }) => {
  const {
    activeCourse,
    activeTopic,
    setActiveTopicId,
    chatHistory,
    addChatMessage,
    clearChatHistory,
    toggleTopicComplete,
    saveNote,
  } = useStudy();

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [teachingMode, setTeachingMode] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  const allTopics = activeCourse?.modules.flatMap((m) => m.topics) || [];
  const currentTopicIndex = allTopics.findIndex((t) => t.id === activeTopic?.id);
  const prevTopic = currentTopicIndex > 0 ? allTopics[currentTopicIndex - 1] : null;
  const nextTopic =
    currentTopicIndex >= 0 && currentTopicIndex < allTopics.length - 1
      ? allTopics[currentTopicIndex + 1]
      : null;

  const handleSendMessage = async (customPrompt?: string, mode?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend && !mode) return;

    const userText = textToSend || (mode === "teach_next" ? `Let's start teaching "${activeTopic?.title || "this topic"}"!` : "Explain this concept!");

    addChatMessage({
      role: "user",
      content: userText,
      topicId: activeTopic?.id,
      topicTitle: activeTopic?.title,
    });

    if (!customPrompt) {
      setInputMessage("");
    }

    setIsLoading(true);

    try {
      const data = await apiRequest<{ reply?: string }>("/api/tutor/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            ...chatHistory.slice(-8).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userText },
          ],
          courseContext: activeCourse
            ? {
                courseName: activeCourse.name,
                currentTopic: activeTopic,
                completedTopics: allTopics.filter((t) => t.isCompleted).map((t) => t.title),
              }
            : null,
          teachingMode: mode || teachingMode || undefined,
        }),
      });

      addChatMessage({
        role: "model",
        content: data.reply || "Got it. What would you like to explore next?",
        topicId: activeTopic?.id,
        topicTitle: activeTopic?.title,
      });
    } catch (err: any) {
      addChatMessage({
        role: "model",
        content: `Notice: ${err.message || "Network issue"}. Let's try that question once more!`,
      });
    } finally {
      setIsLoading(false);
      setTeachingMode(null);
    }
  };

  const handleQuickAction = (mode: string, label: string) => {
    setTeachingMode(mode);
    let prompt = "";
    if (mode === "teach_next") {
      prompt = `Walk me through "${activeTopic?.title || "this topic"}" from scratch like a clear, friendly TA. Break it down with an intuitive analogy and check my understanding.`;
    } else if (mode === "analogy") {
      prompt = `Give me a memorable real-world analogy for "${activeTopic?.title || "this topic"}".`;
    } else if (mode === "quiz_me") {
      prompt = `Hit me with a high-yield quiz question on "${activeTopic?.title || "this topic"}". Don't give away the answer yet!`;
    } else if (mode === "eli5") {
      prompt = `ELI5 "${activeTopic?.title || "this topic"}". Zero jargon, pure intuition.`;
    } else if (mode === "deep_dive") {
      prompt = `What are the exam traps, misconceptions, and tricky edge cases on "${activeTopic?.title || "this topic"}"?`;
    }
    handleSendMessage(prompt, mode);
  };

  const handleSaveTopicNote = async () => {
    if (!activeTopic) return;
    setIsLoading(true);

    try {
      const data = await apiRequest<{ notes: string }>("/api/notes/generate", {
        method: "POST",
        body: JSON.stringify({
          courseName: activeCourse?.name,
          topicTitle: activeTopic.title,
          topicSummary: activeTopic.summary,
          keyTerms: activeTopic.keyTerms,
          chatExcerpts: chatHistory.slice(-4).map((m) => `${m.role}: ${m.content}`).join("\n"),
        }),
      });

      saveNote({
        id: "note-" + Date.now(),
        courseId: activeCourse?.id || "general",
        courseName: activeCourse?.name || "General Study",
        topicId: activeTopic.id,
        topicTitle: activeTopic.title,
        title: `${activeTopic.title} — Key Takeaways`,
        content: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [activeCourse?.code || "Study", activeTopic.title],
        aiGenerated: true,
      });

      try {
        confetti({ particleCount: 40, spread: 50 });
      } catch (e) {}

      setCurrentTab("notes");
    } catch (err: any) {
      alert("Failed to create note: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="tutor-view-container" className="flex-1 flex flex-col h-full max-w-5xl mx-auto w-full p-4 sm:p-8 animate-fade-in">
      {/* Top Topic Navigation & Active Status Bar */}
      <div className="bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] rounded-3xl p-4 sm:p-5 mb-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Topic Stepper & Selector */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#D97757]/10 text-[#D97757] flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97757]">
                  Active Tutoring Session
                </span>
                {allTopics.length > 0 && (
                  <span className="text-[10px] font-mono text-[#888888]">
                    Topic {currentTopicIndex + 1} of {allTopics.length}
                  </span>
                )}
              </div>

              {allTopics.length > 0 ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <select
                    id="select-tutor-topic"
                    value={activeTopic?.id || ""}
                    onChange={(e) => setActiveTopicId(e.target.value)}
                    className="bg-[#FAF9F5] dark:bg-[#20201F] text-[#1F1E1D] dark:text-[#ECECEC] text-xs font-semibold rounded-xl px-2.5 py-1 border border-[#DDDDDD] dark:border-[#404040] focus:outline-hidden focus:border-[#D97757] cursor-pointer max-w-xs sm:max-w-sm truncate"
                  >
                    {allTopics.map((t, idx) => (
                      <option key={t.id} value={t.id}>
                        {idx + 1}. {t.title} {t.isCompleted ? "✓" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-xs font-semibold text-[#1F1E1D] dark:text-[#ECECEC]">General Study Q&A</span>
              )}
            </div>
          </div>

          {/* Stepper buttons & actions */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {allTopics.length > 0 && (
              <div className="flex items-center bg-[#FAF9F5] dark:bg-[#20201F] rounded-xl p-1 border border-[#DDDDDD] dark:border-[#404040]">
                <button
                  id="btn-prev-topic"
                  type="button"
                  disabled={!prevTopic}
                  onClick={() => prevTopic && setActiveTopicId(prevTopic.id)}
                  className="p-1 text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white disabled:opacity-30 rounded-lg"
                  title={prevTopic ? `Previous: ${prevTopic.title}` : "First topic"}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono text-[#73726C] dark:text-[#B4B4B4] px-2">
                  {currentTopicIndex + 1}/{allTopics.length}
                </span>
                <button
                  id="btn-next-topic"
                  type="button"
                  disabled={!nextTopic}
                  onClick={() => nextTopic && setActiveTopicId(nextTopic.id)}
                  className="p-1 text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white disabled:opacity-30 rounded-lg"
                  title={nextTopic ? `Next: ${nextTopic.title}` : "Last topic"}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeTopic && (
              <button
                id="btn-toggle-mastery"
                type="button"
                onClick={() => {
                  if (activeCourse) {
                    toggleTopicComplete(activeCourse.id, activeTopic.id);
                    if (!activeTopic.isCompleted) {
                      try {
                        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                      } catch (e) {}
                    }
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  activeTopic.isCompleted
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-[#FAF9F5] dark:bg-[#20201F] text-[#3D3D3A] dark:text-[#ECECEC] hover:bg-[#F0EEE6] border-[#DDDDDD] dark:border-[#404040]"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{activeTopic.isCompleted ? "Mastered" : "Mark Mastered"}</span>
              </button>
            )}

            <button
              id="btn-clear-chat"
              type="button"
              onClick={clearChatHistory}
              className="p-2 text-[#888888] hover:text-[#1F1E1D] dark:hover:text-white hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] rounded-xl text-xs transition-all"
              title="Reset Chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active topic summary pill */}
        {activeTopic && (
          <div className="mt-3 pt-3 border-t border-[#F0EEE6] dark:border-[#30302E] flex flex-wrap items-center justify-between gap-2 text-xs text-[#73726C] dark:text-[#B4B4B4]">
            <p className="line-clamp-1 italic max-w-xl">
              "{activeTopic.summary}"
            </p>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-[#888888]">{activeTopic.difficulty}</span>
              <span className="text-[#D97757]">~{activeTopic.estimatedMinutes}m est</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        <button
          id="chip-teach-topic"
          type="button"
          onClick={() => handleQuickAction("teach_next", "Start Teaching")}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#D97757] hover:bg-[#C6613F] text-white font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Teach This Topic</span>
        </button>

        <button
          id="chip-analogy"
          type="button"
          onClick={() => handleQuickAction("analogy", "Analogy")}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#262624] hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] border border-[#DDDDDD] dark:border-[#404040] text-[#3D3D3A] dark:text-[#ECECEC] rounded-xl transition-all font-medium shadow-2xs"
        >
          <Brain className="w-3.5 h-3.5 text-[#D97757]" />
          <span>Intuitive Analogy</span>
        </button>

        <button
          id="chip-quiz-me"
          type="button"
          onClick={() => handleQuickAction("quiz_me", "Quiz Me")}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#262624] hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] border border-[#DDDDDD] dark:border-[#404040] text-[#3D3D3A] dark:text-[#ECECEC] rounded-xl transition-all font-medium shadow-2xs"
        >
          <Zap className="w-3.5 h-3.5 text-[#D97757]" />
          <span>Quick Quiz Drill</span>
        </button>

        <button
          id="chip-eli5"
          type="button"
          onClick={() => handleQuickAction("eli5", "ELI5")}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#262624] hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] border border-[#DDDDDD] dark:border-[#404040] text-[#3D3D3A] dark:text-[#ECECEC] rounded-xl transition-all font-medium shadow-2xs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#D97757]" />
          <span>ELI5 / Simplify</span>
        </button>

        <button
          id="chip-deep-dive"
          type="button"
          onClick={() => handleQuickAction("deep_dive", "Exam Traps")}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#262624] hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] border border-[#DDDDDD] dark:border-[#404040] text-[#3D3D3A] dark:text-[#ECECEC] rounded-xl transition-all font-medium shadow-2xs"
        >
          <span>🎯 Common Exam Traps</span>
        </button>

        {activeTopic && (
          <button
            id="chip-save-notes"
            type="button"
            onClick={handleSaveTopicNote}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#D97757]/10 hover:bg-[#D97757]/20 border border-[#D97757]/30 text-[#D97757] rounded-xl transition-all font-medium shadow-2xs"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Generate Notes</span>
          </button>
        )}
      </div>

      {/* Chat Messages Feed */}
      <div
        id="chat-messages-scroll-area"
        className="flex-1 overflow-y-auto pr-2 space-y-4 my-3"
      >
        {chatHistory.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#D97757]/10 border border-[#D97757]/20 text-[#D97757] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? "bg-[#D97757] text-white shadow-xs rounded-tr-xs"
                    : "bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] text-[#1F1E1D] dark:text-[#ECECEC] rounded-tl-xs shadow-2xs"
                }`}
              >
                {msg.topicTitle && (
                  <div className="text-[10px] font-mono text-[#888888] mb-1 opacity-85">
                    Topic: {msg.topicTitle}
                  </div>
                )}

                <div className="prose prose-neutral dark:prose-invert prose-xs sm:prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-[#D97757]">
                  <Markdown>{msg.content}</Markdown>
                </div>

                <div
                  className={`text-[10px] mt-2 font-mono ${
                    isUser ? "text-white/70" : "text-[#888888]"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#F0EEE6] dark:bg-[#30302E] text-[#3D3D3A] dark:text-[#ECECEC] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-[#D97757]/10 border border-[#D97757]/20 text-[#D97757] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] rounded-2xl rounded-tl-xs p-4 flex items-center gap-2 text-xs text-[#73726C] dark:text-[#B4B4B4]">
              <Loader2 className="w-4 h-4 animate-spin text-[#D97757]" />
              <span>Analyzing problem with Gemini...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="mt-2 relative"
      >
        <div className="flex items-center gap-2 bg-[#FFFFFF] dark:bg-[#262624] border border-[#DDDDDD] dark:border-[#30302E] rounded-2xl p-2 focus-within:border-[#D97757] shadow-xs">
          <input
            id="input-tutor-message"
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              activeTopic
                ? `Ask anything about "${activeTopic.title}"...`
                : "Ask anything about your courses or paste a concept..."
            }
            className="flex-1 bg-transparent text-xs sm:text-sm text-[#1F1E1D] dark:text-[#ECECEC] placeholder-[#888888] px-3 focus:outline-hidden font-sans"
          />

          <button
            id="btn-send-tutor-message"
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="p-2.5 bg-[#D97757] hover:bg-[#C6613F] disabled:opacity-40 text-white rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
