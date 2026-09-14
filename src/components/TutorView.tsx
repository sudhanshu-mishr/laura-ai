import React, { useState, useRef, useEffect } from "react";
import { useStudy } from "../context/StudyContext";
import { Topic } from "../types";
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
  BookOpen,
  FilePlus,
  RotateCcw,
  Loader2,
  ArrowRight
} from "lucide-react";
import Markdown from "react-markdown";
import confetti from "canvas-confetti";
import { NavTab } from "./Sidebar";

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

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  // All topics in order
  const allTopics = activeCourse?.modules.flatMap((m) => m.topics) || [];
  const currentTopicIndex = allTopics.findIndex((t) => t.id === activeTopic?.id);
  const prevTopic = currentTopicIndex > 0 ? allTopics[currentTopicIndex - 1] : null;
  const nextTopic =
    currentTopicIndex >= 0 && currentTopicIndex < allTopics.length - 1
      ? allTopics[currentTopicIndex + 1]
      : null;

  // Send message to Tutor API
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
      const response = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      if (!response.ok) {
        throw new Error("Tutor was temporarily busy. Try asking again!");
      }

      const data = await response.json();
      addChatMessage({
        role: "model",
        content: data.reply || "My bad, lost train of thought. Hit me again!",
        topicId: activeTopic?.id,
        topicTitle: activeTopic?.title,
      });
    } catch (err: any) {
      addChatMessage({
        role: "model",
        content: `⚠️ Whoops, hit a snag: ${err.message || "Network issue"}. Let's try that question once more!`,
      });
    } finally {
      setIsLoading(false);
      setTeachingMode(null);
    }
  };

  // Quick Action triggers
  const handleQuickAction = (mode: string, label: string) => {
    setTeachingMode(mode);
    let prompt = "";
    if (mode === "teach_next") {
      prompt = `Walk me through "${activeTopic?.title || "this topic"}" from scratch like a good TA. Break it down with an analogy and check my understanding.`;
    } else if (mode === "analogy") {
      prompt = `Give me a memorable real-world analogy for "${activeTopic?.title || "this topic"}".`;
    } else if (mode === "quiz_me") {
      prompt = `Hit me with a high-yield quiz question on "${activeTopic?.title || "this topic"}". Don't give away the answer yet!`;
    } else if (mode === "eli5") {
      prompt = `ELI5 "${activeTopic?.title || "this topic"}". Zero jargon, pure intuition.`;
    } else if (mode === "deep_dive") {
      prompt = `What are the exam traps and edge cases professors love testing on "${activeTopic?.title || "this topic"}"?`;
    }
    handleSendMessage(prompt, mode);
  };

  // Auto-generate note from this topic
  const handleSaveTopicNote = async () => {
    if (!activeTopic) return;
    setIsLoading(true);

    try {
      const response = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: activeCourse?.name,
          topicTitle: activeTopic.title,
          topicSummary: activeTopic.summary,
          keyTerms: activeTopic.keyTerms,
          chatExcerpts: chatHistory.slice(-4).map((m) => `${m.role}: ${m.content}`).join("\n"),
        }),
      });

      if (!response.ok) throw new Error("Could not generate note.");
      const data = await response.json();

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
    <div id="tutor-view-container" className="flex-1 flex flex-col h-full max-w-5xl mx-auto w-full p-4 sm:p-6">
      {/* Top Topic Navigation & Active Status Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-3.5 mb-4 backdrop-blur-md shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Topic Stepper & Selector */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  AI Teaching Session
                </span>
                {allTopics.length > 0 && (
                  <span className="text-[10px] font-mono text-zinc-500">
                    Topic {currentTopicIndex + 1} of {allTopics.length}
                  </span>
                )}
              </div>

              {allTopics.length > 0 ? (
                <div className="flex items-center gap-2">
                  <select
                    id="select-tutor-topic"
                    value={activeTopic?.id || ""}
                    onChange={(e) => setActiveTopicId(e.target.value)}
                    className="bg-zinc-950 text-zinc-200 text-xs font-semibold rounded-lg px-2 py-1 border border-zinc-800 focus:outline-none focus:border-violet-500 cursor-pointer max-w-xs truncate"
                  >
                    {allTopics.map((t, idx) => (
                      <option key={t.id} value={t.id}>
                        {idx + 1}. {t.title} {t.isCompleted ? "✓" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-xs font-semibold text-zinc-300">General Tutoring Q&A</span>
              )}
            </div>
          </div>

          {/* Stepper buttons & actions */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {allTopics.length > 0 && (
              <div className="flex items-center bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                <button
                  id="btn-prev-topic"
                  disabled={!prevTopic}
                  onClick={() => prevTopic && setActiveTopicId(prevTopic.id)}
                  className="p-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-400 rounded-lg"
                  title={prevTopic ? `Previous: ${prevTopic.title}` : "First topic"}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono text-zinc-400 px-2">
                  {currentTopicIndex + 1}/{allTopics.length}
                </span>
                <button
                  id="btn-next-topic"
                  disabled={!nextTopic}
                  onClick={() => nextTopic && setActiveTopicId(nextTopic.id)}
                  className="p-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-400 rounded-lg"
                  title={nextTopic ? `Next: ${nextTopic.title}` : "Last topic"}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeTopic && (
              <button
                id="btn-toggle-mastery"
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
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{activeTopic.isCompleted ? "Mastered" : "Mark Mastered"}</span>
              </button>
            )}

            <button
              id="btn-clear-chat"
              onClick={clearChatHistory}
              className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 rounded-xl text-xs transition-all"
              title="Reset Chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active topic summary pill */}
        {activeTopic && (
          <div className="mt-2.5 pt-2.5 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <p className="line-clamp-1 italic max-w-xl">
              "{activeTopic.summary}"
            </p>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-zinc-500">{activeTopic.difficulty}</span>
              <span className="text-indigo-400">~{activeTopic.estimatedMinutes}m est</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        <button
          id="chip-teach-topic"
          onClick={() => handleQuickAction("teach_next", "Start Teaching")}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Start Teaching This</span>
        </button>

        <button
          id="chip-analogy"
          onClick={() => handleQuickAction("analogy", "Analogy")}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl transition-all font-medium"
        >
          <Brain className="w-3.5 h-3.5 text-amber-400" />
          <span>Explain with Analogy</span>
        </button>

        <button
          id="chip-quiz-me"
          onClick={() => handleQuickAction("quiz_me", "Quiz Me")}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl transition-all font-medium"
        >
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>Quick Quiz Drill</span>
        </button>

        <button
          id="chip-eli5"
          onClick={() => handleQuickAction("eli5", "ELI5")}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl transition-all font-medium"
        >
          <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
          <span>ELI5 / Simplify</span>
        </button>

        <button
          id="chip-deep-dive"
          onClick={() => handleQuickAction("deep_dive", "Exam Traps")}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl transition-all font-medium"
        >
          <span>🎯 Exam Traps</span>
        </button>

        {activeTopic && (
          <button
            id="chip-save-notes"
            onClick={handleSaveTopicNote}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-indigo-500/30 text-indigo-300 rounded-xl transition-all font-medium"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Save Clean Notes</span>
          </button>
        )}
      </div>

      {/* Chat Messages Feed */}
      <div
        id="chat-messages-scroll-area"
        className="flex-1 overflow-y-auto pr-2 space-y-4 my-2"
      >
        {chatHistory.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 rounded-tr-sm"
                    : "bg-zinc-900/90 border border-zinc-800/90 text-zinc-200 rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.topicTitle && (
                  <div className="text-[10px] font-mono text-zinc-400 mb-1 opacity-80">
                    Topic: {msg.topicTitle}
                  </div>
                )}

                <div className="prose prose-invert prose-xs sm:prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-indigo-300">
                  <Markdown>{msg.content}</Markdown>
                </div>

                <div
                  className={`text-[10px] mt-2 font-mono ${
                    isUser ? "text-indigo-200/80" : "text-zinc-500"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Thinking like your TA...</span>
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
        <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2 focus-within:border-indigo-500/80 shadow-lg backdrop-blur-md">
          <input
            id="input-tutor-message"
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              activeTopic
                ? `Ask anything about "${activeTopic.title}" or take a guess...`
                : "Ask your AI TA anything or paste a problem..."
            }
            className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 px-3 focus:outline-none"
          />

          <button
            id="btn-send-tutor-message"
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md shadow-indigo-600/25 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
