import React, { useState, useRef } from "react";
import { useStudy } from "../context/StudyContext";
import { Course, Topic } from "../types";
import { SAMPLE_SYLLABI_TEXT } from "../data/sampleSyllabi";
import {
  UploadCloud,
  FileText,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  BookOpen,
  Trash2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { NavTab } from "./Sidebar";
import confetti from "canvas-confetti";
import { apiRequest } from "../lib/api";

interface SyllabusViewProps {
  setCurrentTab: (tab: NavTab) => void;
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({ setCurrentTab }) => {
  const {
    activeCourse,
    courses,
    addCourse,
    deleteCourse,
    toggleTopicComplete,
    toggleDeadlineComplete,
    setActiveTopicId,
  } = useStudy();

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [syllabusText, setSyllabusText] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setUploadError(null);

    const reader = new FileReader();
    if (file.type.startsWith("image/") || file.type === "application/pdf") {
      reader.onload = () => {
        const result = reader.result as string;
        const commaIdx = result.indexOf(",");
        const base64 = commaIdx >= 0 ? result.substring(commaIdx + 1) : result;
        setFileBase64(base64);
        setFileMimeType(file.type);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        setSyllabusText(reader.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleParseSyllabus = async () => {
    if (!syllabusText.trim() && !fileBase64) {
      setUploadError("Please paste syllabus text or choose a document/image.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const parsed: Course = await apiRequest<Course>("/api/syllabus/parse", {
        method: "POST",
        body: JSON.stringify({
          text: syllabusText,
          fileBase64: fileBase64,
          mimeType: fileMimeType,
          fileName: selectedFileName,
        }),
      });

      const newCourse: Course = {
        ...parsed,
        id: "course-" + Date.now(),
        createdAt: new Date().toISOString(),
        modules: (parsed.modules || []).map((m, mIdx) => ({
          ...m,
          id: m.id || `mod-${mIdx + 1}`,
          topics: (m.topics || []).map((t, tIdx) => ({
            ...t,
            id: t.id || `top-${mIdx + 1}-${tIdx + 1}`,
            isCompleted: false,
          })),
        })),
        deadlines: (parsed.deadlines || []).map((d, dIdx) => ({
          ...d,
          id: d.id || `dl-${dIdx + 1}`,
          isCompleted: false,
        })),
      };

      addCourse(newCourse);
      setShowUploadModal(false);
      setSyllabusText("");
      setFileBase64(null);
      setSelectedFileName(null);

      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Failed to parse syllabus. Please verify formatting.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_SYLLABI_TEXT.find((s) => s.id === sampleId);
    if (sample) {
      setSyllabusText(sample.rawText);
      setSelectedFileName(null);
      setFileBase64(null);
      setUploadError(null);
    }
  };

  const handleTeachTopic = (topic: Topic) => {
    setActiveTopicId(topic.id);
    setCurrentTab("tutor");
  };

  const totalTopics = activeCourse?.modules.flatMap((m) => m.topics).length || 0;
  const completedTopics =
    activeCourse?.modules.flatMap((m) => m.topics).filter((t) => t.isCompleted).length || 0;

  return (
    <div id="syllabus-view-container" className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full animate-fade-in">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E0] dark:border-[#30302E]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1E1D] dark:text-[#ECECEC]">
              {activeCourse ? activeCourse.name : "Syllabus Roadmap"}
            </h1>
            {activeCourse?.code && (
              <span className="px-2 py-0.5 rounded-full bg-[#D97757]/10 border border-[#D97757]/20 text-[#D97757] font-mono text-xs font-semibold">
                {activeCourse.code}
              </span>
            )}
          </div>
          <p className="text-xs text-[#73726C] dark:text-[#B4B4B4] max-w-2xl">
            {activeCourse?.description ||
              "Upload any course syllabus to auto-extract structured topics, weekly schedules, exam dates, and a strategic study order."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-open-syllabus-modal"
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D97757] hover:bg-[#C6613F] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Syllabus</span>
          </button>

          {activeCourse && courses.length > 1 && (
            <button
              id="btn-delete-active-course"
              type="button"
              onClick={() => {
                if (confirm(`Delete course roadmap for "${activeCourse.name}"?`)) {
                  deleteCourse(activeCourse.id);
                }
              }}
              className="p-2 text-[#888888] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] rounded-xl transition-all"
              title="Delete this course"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* No active course state */}
      {!activeCourse ? (
        <div className="my-12 py-16 px-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] text-center flex flex-col items-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#D97757]/10 text-[#D97757] flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-serif text-[#1F1E1D] dark:text-[#ECECEC] mb-2">No Course Loaded Yet</h2>
          <p className="text-xs text-[#73726C] dark:text-[#B4B4B4] max-w-md mb-6 leading-relaxed">
            Upload your syllabus document (PDF, text, image) or pick one of our sample courses to watch the AI build a complete roadmap with deadlines and teaching modules.
          </p>
          <button
            id="btn-empty-state-upload"
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 bg-[#D97757] hover:bg-[#C6613F] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Upload Course Syllabus
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Roadmap Timeline (Left 2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* AI Strategic Study Order Card */}
            {activeCourse.suggestedStudyOrderExplanation && (
              <div
                id="strategic-study-order-card"
                className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#D97757]/30 shadow-xs"
              >
                <div className="flex items-center gap-2 text-[#D97757] text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Strategic Study Order</span>
                </div>
                <p className="text-xs text-[#3D3D3A] dark:text-[#E1E1E0] leading-relaxed font-normal">
                  {activeCourse.suggestedStudyOrderExplanation}
                </p>
              </div>
            )}

            {/* Modules List */}
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#73726C] dark:text-[#B4B4B4]">
                Course Modules & Roadmap
              </h2>
              <span className="text-xs font-mono text-[#888888]">
                {completedTopics} of {totalTopics} topics mastered
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {activeCourse.modules.map((module, mIdx) => (
                <div
                  key={module.id}
                  id={`module-card-${module.id}`}
                  className="rounded-3xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] p-5 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#F0EEE6] dark:border-[#30302E]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#F0EEE6] dark:bg-[#30302E] text-[#D97757]">
                          Week {module.weekNumber || mIdx + 1}
                        </span>
                        <h3 className="text-base font-serif text-[#1F1E1D] dark:text-[#ECECEC]">{module.title}</h3>
                      </div>
                      {module.description && (
                        <p className="text-xs text-[#73726C] dark:text-[#B4B4B4] mt-1 leading-relaxed">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Topics in this module */}
                  <div className="mt-3.5 flex flex-col gap-2.5">
                    {module.topics.map((topic) => {
                      const isDone = topic.isCompleted;
                      return (
                        <div
                          key={topic.id}
                          id={`topic-row-${topic.id}`}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isDone
                              ? "bg-[#FAF9F5]/50 dark:bg-[#20201F]/50 border-[#E5E5E0]/50 opacity-70"
                              : "bg-[#FAF9F5] dark:bg-[#20201F] border-[#E5E5E0] dark:border-[#30302E] hover:border-[#D97757]/40"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              id={`check-topic-${topic.id}`}
                              type="button"
                              onClick={() => toggleTopicComplete(activeCourse.id, topic.id)}
                              className="mt-0.5 text-[#888888] hover:text-emerald-600 transition-colors cursor-pointer"
                              title={isDone ? "Mark Incomplete" : "Mark Complete"}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-xs font-semibold ${
                                    isDone ? "line-through text-[#888888]" : "text-[#1F1E1D] dark:text-[#ECECEC]"
                                  }`}
                                >
                                  {topic.title}
                                </span>

                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                    topic.difficulty === "Beginner"
                                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                      : topic.difficulty === "Intermediate"
                                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                                  }`}
                                >
                                  {topic.difficulty}
                                </span>

                                <span className="text-[10px] text-[#888888] flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3" />
                                  {topic.estimatedMinutes}m
                                </span>
                              </div>

                              <p className="text-xs text-[#73726C] dark:text-[#B4B4B4] mt-1 leading-relaxed">
                                {topic.summary}
                              </p>

                              {/* Key Terms */}
                              {topic.keyTerms && topic.keyTerms.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {topic.keyTerms.map((term, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FFFFFF] dark:bg-[#262624] border border-[#DDDDDD] dark:border-[#404040] text-[#73726C] dark:text-[#B4B4B4]"
                                    >
                                      {term}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                            <button
                              id={`btn-teach-topic-${topic.id}`}
                              type="button"
                              onClick={() => handleTeachTopic(topic)}
                              className="px-3 py-1.5 bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] border border-[#D97757]/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Teach Me</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar: Deadlines, Exams & Course Details */}
          <div className="flex flex-col gap-6">
            {/* Course Meta Info */}
            <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#73726C] dark:text-[#B4B4B4] mb-3">
                Course Logistics
              </h3>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#F0EEE6] dark:border-[#30302E]">
                  <span className="text-[#888888]">Instructor:</span>
                  <span className="text-[#1F1E1D] dark:text-[#ECECEC] font-medium">{activeCourse.instructor || "Prof. TBA"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0EEE6] dark:border-[#30302E]">
                  <span className="text-[#888888]">Term:</span>
                  <span className="text-[#1F1E1D] dark:text-[#ECECEC] font-medium">{activeCourse.term || "Current Term"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0EEE6] dark:border-[#30302E]">
                  <span className="text-[#888888]">Total Modules:</span>
                  <span className="text-[#1F1E1D] dark:text-[#ECECEC] font-medium">{activeCourse.modules.length}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#888888]">Total Deadlines:</span>
                  <span className="text-[#1F1E1D] dark:text-[#ECECEC] font-medium">{activeCourse.deadlines.length}</span>
                </div>
              </div>
            </div>

            {/* Deadlines & Exam Countdown List */}
            <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#73726C] dark:text-[#B4B4B4] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D97757]" />
                  <span>Exams & Deadlines</span>
                </h3>
                <span className="text-[10px] font-mono text-[#888888]">
                  {activeCourse.deadlines.filter((d) => d.isCompleted).length}/{activeCourse.deadlines.length} done
                </span>
              </div>

              {activeCourse.deadlines.length === 0 ? (
                <p className="text-xs text-[#888888] py-4 text-center">No deadlines parsed.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {activeCourse.deadlines.map((dl) => {
                    const isDone = dl.isCompleted;
                    const isExam = dl.type === "exam";
                    return (
                      <div
                        key={dl.id}
                        id={`deadline-item-${dl.id}`}
                        className={`p-3 rounded-xl border transition-all ${
                          isDone
                            ? "bg-[#FAF9F5]/50 dark:bg-[#20201F]/50 border-[#E5E5E0]/50 opacity-60"
                            : isExam
                            ? "bg-[#D97757]/5 border-[#D97757]/20"
                            : "bg-[#FAF9F5] dark:bg-[#20201F] border-[#E5E5E0] dark:border-[#30302E]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <button
                              id={`check-deadline-${dl.id}`}
                              type="button"
                              onClick={() => toggleDeadlineComplete(activeCourse.id, dl.id)}
                              className="mt-0.5 text-[#888888] hover:text-emerald-600 transition-colors"
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Circle className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <div>
                              <span
                                className={`text-xs font-semibold block ${
                                  isDone ? "line-through text-[#888888]" : "text-[#1F1E1D] dark:text-[#ECECEC]"
                                }`}
                              >
                                {dl.title}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono text-[#D97757] font-medium">
                                  {dl.dueDate}
                                </span>
                                {dl.weightPercent && (
                                  <span className="text-[10px] font-mono px-1 rounded bg-[#F0EEE6] dark:bg-[#30302E] text-[#73726C] dark:text-[#B4B4B4]">
                                    {dl.weightPercent}% weight
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              isExam
                                ? "bg-[#D97757]/20 text-[#D97757]"
                                : "bg-[#F0EEE6] dark:bg-[#30302E] text-[#73726C] dark:text-[#B4B4B4]"
                            }`}
                          >
                            {dl.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Syllabus Modal */}
      {showUploadModal && (
        <div
          id="modal-upload-syllabus"
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-[#FAF9F5] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E0] dark:border-[#30302E]">
              <div>
                <h3 className="text-xl font-serif text-[#1F1E1D] dark:text-[#ECECEC]">
                  Upload Course Syllabus
                </h3>
                <p className="text-xs text-[#73726C] dark:text-[#B4B4B4] mt-0.5">
                  Our Gemini engine will extract modules, topics, deadlines, and build your study roadmap.
                </p>
              </div>
              <button
                id="btn-close-syllabus-modal"
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-[#888888] hover:text-[#1F1E1D] dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets for instant testing */}
            <div>
              <span className="text-xs font-semibold text-[#73726C] dark:text-[#B4B4B4] block mb-2">
                ⚡ Or try a sample syllabus:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_SYLLABI_TEXT.map((sample) => (
                  <button
                    key={sample.id}
                    id={`btn-sample-syllabus-${sample.id}`}
                    type="button"
                    onClick={() => handleLoadSample(sample.id)}
                    className="px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#20201F] hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] text-[#3D3D3A] dark:text-[#ECECEC] rounded-xl text-xs font-medium border border-[#DDDDDD] dark:border-[#404040] transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#D97757]" />
                    <span>{sample.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* File Drag-Drop & Input */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#DDDDDD] dark:border-[#404040] hover:border-[#D97757] rounded-2xl p-6 text-center cursor-pointer transition-all bg-[#FFFFFF] dark:bg-[#20201F]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-[#D97757] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#1F1E1D] dark:text-[#ECECEC]">
                {selectedFileName ? selectedFileName : "Click or drag syllabus file here"}
              </p>
              <p className="text-[11px] text-[#888888] mt-1">
                Supports PDF, Text (.txt, .md), or photo / screenshot of syllabus
              </p>
            </div>

            {/* Text Paste Area */}
            <div>
              <label className="text-xs font-semibold text-[#73726C] dark:text-[#B4B4B4] block mb-1">
                Or paste syllabus text directly:
              </label>
              <textarea
                id="textarea-syllabus-paste"
                rows={6}
                value={syllabusText}
                onChange={(e) => {
                  setSyllabusText(e.target.value);
                  setUploadError(null);
                }}
                placeholder="Paste course syllabus schedule, topics, reading assignments, grading weights, and exam dates here..."
                className="w-full bg-[#FFFFFF] dark:bg-[#20201F] border border-[#DDDDDD] dark:border-[#404040] rounded-xl p-3 text-xs text-[#1F1E1D] dark:text-[#ECECEC] font-mono focus:outline-hidden focus:border-[#D97757]"
              />
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="btn-cancel-syllabus-upload"
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                id="btn-submit-parse-syllabus"
                type="button"
                disabled={isUploading}
                onClick={handleParseSyllabus}
                className="px-5 py-2.5 bg-[#D97757] hover:bg-[#C6613F] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting Curriculum...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Parse & Build Roadmap</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
