import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import { Note } from "../types";
import {
  Search,
  Plus,
  Sparkles,
  BookOpen,
  Trash2,
  Download,
  Check,
  Zap,
  Loader2,
} from "lucide-react";
import Markdown from "react-markdown";
import confetti from "canvas-confetti";
import { apiRequest } from "../lib/api";

export const NotesView: React.FC = () => {
  const { notes, activeCourse, activeTopic, saveNote, deleteNote, courses } = useStudy();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id || null);

  // Note editor states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");

  // AI Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [revealedQuizIndex, setRevealedQuizIndex] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: "error" | "success" | "info"; message: string } | null>(null);

  const showNotification = (message: string, type: "error" | "success" | "info" = "info") => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Active selected note
  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0] || null;

  // Filtered notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.topicTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse =
      selectedCourseFilter === "all" || n.courseId === selectedCourseFilter;
    return matchesSearch && matchesCourse;
  });

  // Start new note
  const handleCreateNewNote = () => {
    const newNote: Note = {
      id: "note-" + Date.now(),
      courseId: activeCourse?.id || "general",
      courseName: activeCourse?.name || "General Studies",
      topicId: activeTopic?.id,
      topicTitle: activeTopic?.title || "General Notes",
      title: activeTopic ? `${activeTopic.title} Notes` : "Untitled Study Note",
      content: `# ${activeTopic ? activeTopic.title : "Study Notes"}\n\nWrite or paste your notes here...`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [activeCourse?.code || "Study", "Lecture Notes"],
      aiGenerated: false,
    };
    saveNote(newNote);
    setActiveNoteId(newNote.id);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
    setEditTags(newNote.tags.join(", "));
    setIsEditing(true);
    setAnalysisResult(null);
  };

  // Trigger AI note generator for current topic
  const handleAutoGenerateForTopic = async () => {
    if (!activeTopic) {
      showNotification("Please select a course topic in Syllabus first.", "info");
      return;
    }

    setIsAnalyzing(true);
    try {
      const data = await apiRequest<{ notes: string }>("/api/notes/generate", {
        method: "POST",
        body: JSON.stringify({
          courseName: activeCourse?.name,
          topicTitle: activeTopic.title,
          topicSummary: activeTopic.summary,
          keyTerms: activeTopic.keyTerms,
        }),
      });

      const newNote: Note = {
        id: "note-" + Date.now(),
        courseId: activeCourse?.id || "general",
        courseName: activeCourse?.name || "General Study",
        topicId: activeTopic.id,
        topicTitle: activeTopic.title,
        title: `${activeTopic.title} (Mastery Notes)`,
        content: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [activeCourse?.code || "Study", activeTopic.title, "AI Generated"],
        aiGenerated: true,
      };

      saveNote(newNote);
      setActiveNoteId(newNote.id);
      setIsEditing(false);
      setAnalysisResult(null);
      showNotification("Study notes generated successfully!", "success");

      try {
        confetti({ particleCount: 40, spread: 50 });
      } catch (e) {}
    } catch (err: any) {
      showNotification("Note generation: " + (err.message || "Failed to generate note."), "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyze active note
  const handleAnalyzeNotes = async (action: "all" | "quiz" | "find_gaps" | "cleanup_format") => {
    if (!activeNote) return;

    setIsAnalyzing(true);
    try {
      const data = await apiRequest<any>("/api/notes/analyze", {
        method: "POST",
        body: JSON.stringify({
          userNotes: isEditing ? editContent : activeNote.content,
          courseName: activeNote.courseName,
          topicTitle: activeNote.topicTitle,
          action,
        }),
      });

      setAnalysisResult(data);
      showNotification("AI note analysis complete!", "success");

      if (action === "cleanup_format" && data.cleanedNotes) {
        if (isEditing) {
          setEditContent(data.cleanedNotes);
        } else {
          saveNote({ ...activeNote, content: data.cleanedNotes, updatedAt: new Date().toISOString() });
        }
      }
    } catch (err: any) {
      showNotification("Analysis error: " + (err.message || "Failed to analyze notes."), "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveEdit = () => {
    if (!activeNote) return;
    const updated: Note = {
      ...activeNote,
      title: editTitle.trim() || "Untitled Note",
      content: editContent,
      tags: editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      updatedAt: new Date().toISOString(),
    };
    saveNote(updated);
    setIsEditing(false);
  };

  const handleStartEdit = (note: Note) => {
    setActiveNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags((note.tags || []).join(", "));
    setIsEditing(true);
    setAnalysisResult(null);
  };

  const handleExportMarkdown = (note: Note) => {
    const blob = new Blob([note.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${note.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="notes-view-container" className="flex-1 flex flex-col lg:flex-row h-full w-full max-w-7xl mx-auto p-4 sm:p-8 gap-6 animate-fade-in">
      {/* Left Column: Note List & Search Sidebar */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif text-[#1F1E1D] dark:text-[#ECECEC]">Smart Notes</h1>
            <span className="text-[11px] text-[#73726C] dark:text-[#B4B4B4] font-mono">
              {notes.length} saved document{notes.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-create-note"
              type="button"
              onClick={handleCreateNewNote}
              className="p-2 bg-[#D97757] hover:bg-[#C6613F] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
              title="New blank note"
            >
              <Plus className="w-4 h-4" />
            </button>

            {activeTopic && (
              <button
                id="btn-ai-generate-note"
                type="button"
                onClick={handleAutoGenerateForTopic}
                disabled={isAnalyzing}
                className="p-2 bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] border border-[#D97757]/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-40"
                title={`Auto-generate notes for ${activeTopic.title}`}
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#888888]" />
          <input
            id="input-search-notes"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, terms, topics..."
            className="w-full bg-[#FFFFFF] dark:bg-[#262624] border border-[#DDDDDD] dark:border-[#30302E] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1F1E1D] dark:text-[#ECECEC] placeholder-[#888888] focus:outline-hidden focus:border-[#D97757]"
          />
        </div>

        {/* Course Filter Dropdown */}
        {courses.length > 1 && (
          <select
            id="select-notes-course-filter"
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="bg-[#FFFFFF] dark:bg-[#262624] text-[#3D3D3A] dark:text-[#ECECEC] text-xs rounded-xl px-3 py-2 border border-[#DDDDDD] dark:border-[#30302E] focus:outline-hidden focus:border-[#D97757]"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[70vh]">
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center text-[#888888] text-xs rounded-2xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E]">
              No notes found. Create one or auto-generate from a topic!
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = activeNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  id={`note-card-${note.id}`}
                  onClick={() => {
                    setActiveNoteId(note.id);
                    setIsEditing(false);
                    setAnalysisResult(null);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all text-left group ${
                    isSelected
                      ? "bg-[#FFFFFF] dark:bg-[#262624] border-[#D97757] shadow-xs"
                      : "bg-[#FFFFFF]/70 dark:bg-[#262624]/70 border-[#E5E5E0] dark:border-[#30302E] hover:bg-[#FFFFFF] dark:hover:bg-[#262624]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-[#1F1E1D] dark:text-[#ECECEC] line-clamp-1 group-hover:text-[#D97757]">
                      {note.title}
                    </h3>
                    {note.aiGenerated && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D97757]/10 text-[#D97757] font-mono shrink-0">
                        AI
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#73726C] dark:text-[#B4B4B4] line-clamp-2 mt-1 leading-relaxed">
                    {note.content.replace(/[#*`_>]/g, "").slice(0, 95)}...
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F0EEE6] dark:border-[#30302E] text-[10px] text-[#888888]">
                    <span className="truncate max-w-[140px]">{note.topicTitle}</span>
                    <span className="font-mono">
                      {new Date(note.updatedAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Note Viewer / Editor & AI Analysis Panel */}
      <div className="flex-1 flex flex-col bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] rounded-3xl p-6 shadow-xs overflow-hidden min-h-[600px]">
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Note Header & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EEE6] dark:border-[#30302E]">
              <div>
                {isEditing ? (
                  <input
                    id="input-edit-note-title"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-lg font-serif bg-[#FAF9F5] dark:bg-[#20201F] text-[#1F1E1D] dark:text-[#ECECEC] px-3 py-1.5 rounded-xl border border-[#DDDDDD] dark:border-[#404040] focus:outline-hidden focus:border-[#D97757] w-full sm:w-80"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-serif text-[#1F1E1D] dark:text-[#ECECEC]">{activeNote.title}</h2>
                    {activeNote.aiGenerated && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D97757]/10 text-[#D97757] border border-[#D97757]/20 font-mono">
                        TA Note
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-[#73726C] dark:text-[#B4B4B4]">
                  <span>{activeNote.courseName}</span>
                  <span>•</span>
                  <span className="font-medium text-[#1F1E1D] dark:text-[#ECECEC]">{activeNote.topicTitle}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {isEditing ? (
                  <button
                    id="btn-save-note-edit"
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
                  >
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                ) : (
                  <button
                    id="btn-start-note-edit"
                    type="button"
                    onClick={() => handleStartEdit(activeNote)}
                    className="px-3 py-1.5 bg-[#FAF9F5] dark:bg-[#20201F] hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] border border-[#DDDDDD] dark:border-[#404040] text-[#3D3D3A] dark:text-[#ECECEC] rounded-xl text-xs font-semibold transition-all"
                  >
                    Edit Notes
                  </button>
                )}

                {/* AI Analysis trigger button */}
                <button
                  id="btn-analyze-gaps"
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => handleAnalyzeNotes("all")}
                  className="px-3 py-1.5 bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] border border-[#D97757]/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="AI analyzes your notes for missed exam topics and generates practice quiz"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Gap Finder & Quiz</span>
                </button>

                <button
                  id="btn-cleanup-notes"
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => handleAnalyzeNotes("cleanup_format")}
                  className="px-3 py-1.5 bg-[#FAF9F5] dark:bg-[#20201F] hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] border border-[#DDDDDD] dark:border-[#404040] text-[#3D3D3A] dark:text-[#ECECEC] rounded-xl text-xs font-medium transition-all"
                  title="Clean up formatting and structure"
                >
                  Clean Format
                </button>

                <button
                  id="btn-download-note"
                  type="button"
                  onClick={() => handleExportMarkdown(activeNote)}
                  className="p-2 text-[#888888] hover:text-[#1F1E1D] dark:hover:text-white hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] rounded-xl text-xs transition-all"
                  title="Export Markdown (.md)"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  id="btn-delete-note"
                  type="button"
                  onClick={() => {
                    if (confirm("Delete this note?")) deleteNote(activeNote.id);
                  }}
                  className="p-2 text-[#888888] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] rounded-xl text-xs transition-all"
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification banner */}
            {notification && (
              <div
                className={`my-3 p-3 rounded-xl text-xs flex items-center justify-between gap-2 border ${
                  notification.type === "error"
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300"
                    : notification.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : "bg-[#D97757]/10 border-[#D97757]/20 text-[#D97757]"
                }`}
              >
                <span>{notification.message}</span>
                <button
                  type="button"
                  onClick={() => setNotification(null)}
                  className="opacity-70 hover:opacity-100 text-xs px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* AI Analysis Overlay Card if Generated */}
            {analysisResult && (
              <div
                id="ai-analysis-feedback-card"
                className="my-3 p-4 rounded-2xl bg-[#FAF9F5] dark:bg-[#20201F] border border-[#D97757]/30 text-xs shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#D97757] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Zap className="w-4 h-4" /> Note Intelligence Report
                  </span>
                  <button
                    type="button"
                    onClick={() => setAnalysisResult(null)}
                    className="text-[#888888] hover:text-[#1F1E1D] dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {analysisResult.summary && (
                  <p className="text-[#3D3D3A] dark:text-[#E1E1E0] mb-3 leading-relaxed">
                    <strong>Executive Summary:</strong> {analysisResult.summary}
                  </p>
                )}

                {analysisResult.identifiedGaps && analysisResult.identifiedGaps.length > 0 && (
                  <div className="mb-3">
                    <span className="font-semibold text-rose-600 dark:text-rose-400 block mb-1">
                      ⚠️ Missing Knowledge / Exam Traps You Skipped:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-[#3D3D3A] dark:text-[#B4B4B4]">
                      {analysisResult.identifiedGaps.map((gap: string, i: number) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.quizQuestions && analysisResult.quizQuestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#E5E5E0] dark:border-[#30302E]">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 block mb-2">
                      🎯 Quick Drill Questions:
                    </span>
                    <div className="space-y-2">
                      {analysisResult.quizQuestions.map((q: any, i: number) => {
                        const isRevealed = revealedQuizIndex === i;
                        return (
                          <div key={i} className="p-3 rounded-xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#DDDDDD] dark:border-[#30302E]">
                            <p className="font-semibold text-[#1F1E1D] dark:text-[#ECECEC]">
                              {i + 1}. {q.question}
                            </p>
                            {isRevealed ? (
                              <div className="mt-2 pt-2 border-t border-[#F0EEE6] dark:border-[#30302E] text-emerald-700 dark:text-emerald-400">
                                <strong>Answer:</strong> {q.answer}
                                {q.explanation && (
                                  <p className="text-[11px] text-[#73726C] dark:text-[#B4B4B4] mt-0.5">
                                    {q.explanation}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setRevealedQuizIndex(i)}
                                className="mt-1.5 text-[11px] text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                              >
                                Reveal Answer
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Note Content Viewer or Editor */}
            <div className="flex-1 overflow-y-auto mt-4 pr-2">
              {isEditing ? (
                <div className="flex flex-col h-full gap-3">
                  <textarea
                    id="textarea-edit-note-content"
                    rows={18}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Type markdown notes here..."
                    className="flex-1 bg-[#FAF9F5] dark:bg-[#20201F] text-[#1F1E1D] dark:text-[#ECECEC] font-mono text-xs p-4 rounded-2xl border border-[#DDDDDD] dark:border-[#404040] focus:outline-hidden focus:border-[#D97757] leading-relaxed resize-none"
                  />
                  <div>
                    <label className="text-xs text-[#73726C] dark:text-[#B4B4B4] block mb-1">Tags (comma-separated):</label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="e.g. Python, Week 2, Midterm Prep"
                      className="w-full bg-[#FAF9F5] dark:bg-[#20201F] text-xs text-[#1F1E1D] dark:text-[#ECECEC] px-3 py-2 rounded-xl border border-[#DDDDDD] dark:border-[#404040] focus:outline-hidden focus:border-[#D97757]"
                    />
                  </div>
                </div>
              ) : (
                <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none prose-headings:font-serif prose-h1:text-xl prose-h2:text-base prose-h2:text-[#D97757] prose-pre:bg-[#FAF9F5] dark:prose-pre:bg-[#20201F] prose-pre:border prose-pre:border-[#E5E5E0] dark:prose-pre:border-[#30302E] prose-blockquote:border-l-[#D97757] prose-strong:text-[#D97757]">
                  <Markdown>{activeNote.content}</Markdown>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#888888]">
            <BookOpen className="w-12 h-12 text-[#888888]/60 mb-3" />
            <h3 className="text-base font-serif text-[#1F1E1D] dark:text-[#ECECEC]">Select or Create a Note</h3>
            <p className="text-xs text-[#73726C] dark:text-[#B4B4B4] mt-1 max-w-sm">
              Keep organized notes by course and topic. You can write your own or have the AI generate master notes directly from syllabus topics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
