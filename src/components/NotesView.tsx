import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import { Note } from "../types";
import {
  Search,
  Plus,
  FileText,
  Sparkles,
  BookOpen,
  Trash2,
  Download,
  Check,
  Zap,
  HelpCircle,
  AlertCircle,
  Loader2,
  Tag,
  ArrowRight
} from "lucide-react";
import Markdown from "react-markdown";
import confetti from "canvas-confetti";

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
      const response = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: activeCourse?.name,
          topicTitle: activeTopic.title,
          topicSummary: activeTopic.summary,
          keyTerms: activeTopic.keyTerms,
        }),
      });

      if (!response.ok) throw new Error("Could not generate note.");
      const data = await response.json();

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

  // Analyze active note (find gaps, quiz, format)
  const handleAnalyzeNotes = async (action: "all" | "quiz" | "find_gaps" | "cleanup_format") => {
    if (!activeNote) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/notes/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userNotes: isEditing ? editContent : activeNote.content,
          courseName: activeNote.courseName,
          topicTitle: activeNote.topicTitle,
          action,
        }),
      });

      if (!response.ok) throw new Error("Could not analyze notes.");
      const data = await response.json();
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

  // Save current edit
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

  // Start editing
  const handleStartEdit = (note: Note) => {
    setActiveNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags((note.tags || []).join(", "));
    setIsEditing(true);
    setAnalysisResult(null);
  };

  // Export note to Markdown file
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
    <div id="notes-view-container" className="flex-1 flex flex-col lg:flex-row h-full w-full max-w-7xl mx-auto p-4 sm:p-6 gap-6">
      {/* Left Column: Note List & Search Sidebar (320px) */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-3">
        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Smart Notes</h1>
            <span className="text-[11px] text-zinc-400 font-mono">
              {notes.length} saved document{notes.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-create-note"
              onClick={handleCreateNewNote}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1 transition-all"
              title="New blank note"
            >
              <Plus className="w-4 h-4" />
            </button>

            {activeTopic && (
              <button
                id="btn-ai-generate-note"
                onClick={handleAutoGenerateForTopic}
                disabled={isAnalyzing}
                className="p-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-40"
                title={`Auto-generate notes for ${activeTopic.title}`}
              >
                <Sparkles className="w-4 h-4 text-violet-400" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            id="input-search-notes"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, terms, topics..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Course Filter Dropdown */}
        {courses.length > 1 && (
          <select
            id="select-notes-course-filter"
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="bg-zinc-900 text-zinc-300 text-xs rounded-xl px-3 py-2 border border-zinc-800 focus:outline-none focus:border-indigo-500"
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
            <div className="p-8 text-center text-zinc-500 text-xs rounded-2xl bg-zinc-900/30 border border-zinc-800/40">
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
                      ? "bg-zinc-800/90 border-indigo-500/60 shadow-md shadow-indigo-500/5"
                      : "bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-zinc-100 line-clamp-1 group-hover:text-white">
                      {note.title}
                    </h3>
                    {note.aiGenerated && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-500/10 text-violet-400 font-mono shrink-0">
                        AI TA
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                    {note.content.replace(/[#*`_>]/g, "").slice(0, 95)}...
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500">
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
      <div className="flex-1 flex flex-col bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 shadow-sm overflow-hidden min-h-[600px]">
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Note Header & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div>
                {isEditing ? (
                  <input
                    id="input-edit-note-title"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-lg font-bold bg-zinc-950 text-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-indigo-500 w-full sm:w-80"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-zinc-100">{activeNote.title}</h2>
                    {activeNote.aiGenerated && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-mono">
                        TA Generated
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                  <span>{activeNote.courseName}</span>
                  <span>•</span>
                  <span className="font-medium text-zinc-300">{activeNote.topicTitle}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {isEditing ? (
                  <button
                    id="btn-save-note-edit"
                    onClick={handleSaveEdit}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                ) : (
                  <button
                    id="btn-start-note-edit"
                    onClick={() => handleStartEdit(activeNote)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-all"
                  >
                    Edit Notes
                  </button>
                )}

                {/* AI Analysis trigger dropdown/buttons */}
                <button
                  id="btn-analyze-gaps"
                  disabled={isAnalyzing}
                  onClick={() => handleAnalyzeNotes("all")}
                  className="px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="AI analyzes your notes for missed exam topics and generates practice quiz"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  )}
                  <span>AI Gap Finder & Quiz</span>
                </button>

                <button
                  id="btn-cleanup-notes"
                  disabled={isAnalyzing}
                  onClick={() => handleAnalyzeNotes("cleanup_format")}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-all"
                  title="Clean up formatting and structure"
                >
                  Clean Format
                </button>

                <button
                  id="btn-download-note"
                  onClick={() => handleExportMarkdown(activeNote)}
                  className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl text-xs transition-all"
                  title="Export Markdown (.md)"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  id="btn-delete-note"
                  onClick={() => {
                    if (confirm("Delete this note?")) deleteNote(activeNote.id);
                  }}
                  className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs transition-all"
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* In-app notification toast/banner */}
            {notification && (
              <div
                className={`my-3 p-3 rounded-xl text-xs flex items-center justify-between gap-2 border ${
                  notification.type === "error"
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                    : notification.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
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
                className="my-3 p-4 rounded-2xl bg-gradient-to-r from-violet-950/30 via-zinc-900 to-zinc-900 border border-violet-500/30 text-xs shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-violet-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Zap className="w-4 h-4 text-amber-400" /> TA Note Intelligence
                  </span>
                  <button
                    onClick={() => setAnalysisResult(null)}
                    className="text-zinc-400 hover:text-zinc-200"
                  >
                    ✕
                  </button>
                </div>

                {/* Summary */}
                {analysisResult.summary && (
                  <p className="text-zinc-300 mb-3 leading-relaxed">
                    <strong>Executive Summary:</strong> {analysisResult.summary}
                  </p>
                )}

                {/* Identified Gaps */}
                {analysisResult.identifiedGaps && analysisResult.identifiedGaps.length > 0 && (
                  <div className="mb-3">
                    <span className="font-semibold text-rose-300 block mb-1">
                      ⚠️ Missing Knowledge / Exam Traps You Skipped:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                      {analysisResult.identifiedGaps.map((gap: string, i: number) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quiz Questions */}
                {analysisResult.quizQuestions && analysisResult.quizQuestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <span className="font-semibold text-emerald-300 block mb-2">
                      🎯 Quick Drill Questions:
                    </span>
                    <div className="space-y-2">
                      {analysisResult.quizQuestions.map((q: any, i: number) => {
                        const isRevealed = revealedQuizIndex === i;
                        return (
                          <div key={i} className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800">
                            <p className="font-semibold text-zinc-200">
                              {i + 1}. {q.question}
                            </p>
                            {isRevealed ? (
                              <div className="mt-2 pt-2 border-t border-zinc-800 text-emerald-300">
                                <strong>Answer:</strong> {q.answer}
                                {q.explanation && (
                                  <p className="text-[11px] text-zinc-400 mt-0.5">
                                    {q.explanation}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => setRevealedQuizIndex(i)}
                                className="mt-1.5 text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
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
                    className="flex-1 bg-zinc-950 text-zinc-100 font-mono text-xs p-4 rounded-2xl border border-zinc-800 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                  />
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Tags (comma-separated):</label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="e.g. Python, Week 2, Midterm Prep"
                      className="w-full bg-zinc-950 text-xs text-zinc-200 px-3 py-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-base prose-h2:text-indigo-300 prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-blockquote:border-l-indigo-500 prose-blockquote:text-zinc-300 prose-strong:text-indigo-200">
                  <Markdown>{activeNote.content}</Markdown>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
            <BookOpen className="w-12 h-12 text-zinc-600 mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">Select or Create a Note</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Keep organized notes by course and topic. You can write your own or have the AI TA generate master notes directly from syllabus topics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
