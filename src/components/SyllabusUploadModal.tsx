import React, { useState, useRef } from "react";
import { useStudy } from "../context/StudyContext";
import { Course } from "../types";
import { SAMPLE_SYLLABI_TEXT } from "../data/sampleSyllabi";
import { UploadCloud, BookOpen, AlertCircle, Loader2, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";
import { apiRequest } from "../lib/api";

interface SyllabusUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNavigate?: () => void;
}

export const SyllabusUploadModal: React.FC<SyllabusUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccessNavigate,
}) => {
  const { addCourse } = useStudy();

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [syllabusText, setSyllabusText] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

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
      setUploadError("Please paste syllabus text or upload a document/image.");
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
      onClose();
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      onSuccessNavigate?.();
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

  return (
    <div
      id="modal-upload-syllabus-global"
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-[#FAF9F5] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E0] dark:border-[#30302E]">
          <div>
            <h3 className="text-xl font-serif text-[#1F1E1D] dark:text-[#ECECEC]">
              Upload Course Syllabus
            </h3>
            <p className="text-xs text-[#73726C] dark:text-[#B4B4B4] mt-0.5">
              Gemini AI extracts weekly modules, concepts, exam milestones, and builds your interactive roadmap.
            </p>
          </div>
          <button
            id="btn-close-global-modal"
            type="button"
            onClick={onClose}
            className="text-[#888888] hover:text-[#1F1E1D] dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Samples */}
        <div>
          <span className="text-xs font-semibold text-[#73726C] dark:text-[#B4B4B4] block mb-2">
            ⚡ Quick test with a sample syllabus:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_SYLLABI_TEXT.map((sample) => (
              <button
                key={sample.id}
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
            Supports PDF documents, Text (.txt, .md), or syllabus screenshots
          </p>
        </div>

        {/* Text Paste Area */}
        <div>
          <label className="text-xs font-semibold text-[#73726C] dark:text-[#B4B4B4] block mb-1">
            Or paste syllabus text directly:
          </label>
          <textarea
            id="textarea-syllabus-paste-global"
            rows={6}
            value={syllabusText}
            onChange={(e) => {
              setSyllabusText(e.target.value);
              setUploadError(null);
            }}
            placeholder="Paste syllabus text here..."
            className="w-full bg-[#FFFFFF] dark:bg-[#20201F] border border-[#DDDDDD] dark:border-[#404040] rounded-xl p-3 text-xs text-[#1F1E1D] dark:text-[#ECECEC] font-mono focus:outline-hidden focus:border-[#D97757]"
          />
        </div>

        {uploadError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{uploadError}</span>
            </div>
            <button
              type="button"
              onClick={handleParseSyllabus}
              disabled={isUploading}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-200 rounded-lg text-[11px] font-semibold transition-all shrink-0"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={handleParseSyllabus}
            className="px-5 py-2.5 bg-[#D97757] hover:bg-[#C6613F] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
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
  );
};
