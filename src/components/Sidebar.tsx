import React from "react";
import { useStudy } from "../context/StudyContext";
import {
  LayoutDashboard,
  Compass,
  Bot,
  FileText,
  Youtube,
  Timer,
  PlusCircle,
  Sparkles,
  ChevronRight,
  BookOpen,
  Sun,
  Moon,
} from "lucide-react";

export type NavTab = "dashboard" | "syllabus" | "tutor" | "notes" | "youtube" | "focus";

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  onOpenUploadModal: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenUploadModal,
  isDarkMode,
  onToggleTheme,
}) => {
  const { courses, activeCourse, activeCourseId, setActiveCourseId, activeTopic } = useStudy();

  const navItems = [
    { id: "dashboard" as NavTab, label: "Dashboard", icon: LayoutDashboard, badge: null },
    { id: "syllabus" as NavTab, label: "Syllabus Roadmap", icon: Compass, badge: null },
    { id: "tutor" as NavTab, label: "AI Tutor", icon: Bot, badge: null },
    { id: "notes" as NavTab, label: "Notes", icon: FileText, badge: null },
    { id: "youtube" as NavTab, label: "Video Recs", icon: Youtube, badge: null },
    { id: "focus" as NavTab, label: "Focus Studio", icon: Timer, badge: null },
  ];

  // Calculate course completion percentage
  const totalTopics = activeCourse?.modules.flatMap((m) => m.topics).length || 0;
  const completedTopics =
    activeCourse?.modules.flatMap((m) => m.topics).filter((t) => t.isCompleted).length || 0;
  const completionPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <aside
      id="main-sidebar"
      className="w-64 bg-[#FAF9F5] dark:bg-[#212121] border-r border-[#E5E5E0] dark:border-[#30302E] flex flex-col justify-between h-screen sticky top-0 select-none z-30 transition-colors duration-200"
    >
      {/* Top Header & Brand */}
      <div className="p-4 flex flex-col gap-4">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D97757] flex items-center justify-center text-white shadow-xs">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-white">
                <defs>
                  <ellipse id="petal-pair-sb" cx="100" cy="100" rx="88" ry="22" />
                </defs>
                <g fill="currentColor" fillRule="evenodd">
                  <use href="#petal-pair-sb" transform="rotate(0 100 100)" />
                  <use href="#petal-pair-sb" transform="rotate(45 100 100)" />
                  <use href="#petal-pair-sb" transform="rotate(90 100 100)" />
                  <use href="#petal-pair-sb" transform="rotate(135 100 100)" />
                </g>
              </svg>
            </div>
            <div>
              <span className="font-serif font-semibold text-base tracking-tight text-[#1F1E1D] dark:text-[#ECECEC] block">
                StudyHQ
              </span>
              <p className="text-[11px] text-[#73726C] dark:text-[#B4B4B4] font-medium">Study Workspace</p>
            </div>
          </div>
        </div>

        {/* Course Switcher Selector */}
        <div className="bg-[#FFFFFF] dark:bg-[#262624] rounded-2xl p-3 border border-[#E5E5E0] dark:border-[#30302E] shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#73726C] dark:text-[#B4B4B4] uppercase tracking-wider mb-1.5 px-0.5">
            <span>Current Course</span>
            <button
              id="btn-sidebar-add-course"
              type="button"
              onClick={onOpenUploadModal}
              className="text-[#D97757] hover:underline flex items-center gap-1 lowercase"
            >
              <PlusCircle className="w-3 h-3" /> +new
            </button>
          </div>

          {courses.length > 0 ? (
            <select
              id="select-active-course"
              value={activeCourseId}
              onChange={(e) => setActiveCourseId(e.target.value)}
              className="w-full bg-[#FAF9F5] dark:bg-[#20201F] text-[#1F1E1D] dark:text-[#ECECEC] text-xs font-semibold rounded-lg px-2.5 py-2 border border-[#DDDDDD] dark:border-[#404040] focus:outline-hidden focus:border-[#D97757] truncate cursor-pointer"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code ? `[${course.code}] ` : ""}
                  {course.name}
                </option>
              ))}
            </select>
          ) : (
            <button
              id="btn-sidebar-empty-upload"
              type="button"
              onClick={onOpenUploadModal}
              className="w-full py-2 px-3 text-xs bg-[#D97757]/10 text-[#D97757] hover:bg-[#D97757]/20 border border-[#D97757]/30 rounded-lg font-medium text-center transition-colors"
            >
              + Upload First Syllabus
            </button>
          )}

          {/* Active Course Progress Bar */}
          {activeCourse && totalTopics > 0 && (
            <div className="mt-2.5 px-0.5">
              <div className="flex items-center justify-between text-[10px] text-[#73726C] dark:text-[#B4B4B4] mb-1">
                <span>Progress</span>
                <span className="font-mono text-[#1F1E1D] dark:text-[#ECECEC] font-bold">{completionPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#F0EEE6] dark:bg-[#30302E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D97757] to-[#E5AA7F] rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav aria-label="Main Navigation" className="flex flex-col gap-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                type="button"
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#FFFFFF] dark:bg-[#262624] text-[#1F1E1D] dark:text-[#ECECEC] border border-[#DDDDDD] dark:border-[#30302E] shadow-2xs font-semibold"
                    : "text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-[#ECECEC] hover:bg-[#F0EEE6] dark:hover:bg-[#30302E]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#D97757]" : "text-[#888888] group-hover:text-[#1F1E1D]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                      item.badge === "Flash TA"
                        ? "bg-[#D97757]/15 text-[#D97757] font-semibold"
                        : "bg-[#F0EEE6] dark:bg-[#30302E] text-[#73726C] dark:text-[#B4B4B4]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom active topic / quick context banner & Theme Switcher */}
      <div className="p-4 border-t border-[#E5E5E0] dark:border-[#30302E] flex flex-col gap-3">
        {activeTopic ? (
          <div
            id="sidebar-active-topic-card"
            onClick={() => setCurrentTab("tutor")}
            className="p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] hover:border-[#D97757]/40 cursor-pointer group transition-all shadow-2xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[#D97757] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Target Topic
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#888888] group-hover:text-[#D97757] group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs font-semibold text-[#1F1E1D] dark:text-[#ECECEC] line-clamp-1 group-hover:text-[#D97757]">
              {activeTopic.title}
            </p>
            <span className="text-[10px] text-[#73726C] dark:text-[#B4B4B4] block mt-0.5">
              Click to drill with AI
            </span>
          </div>
        ) : (
          <div className="p-2.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] text-center shadow-2xs">
            <BookOpen className="w-4 h-4 text-[#888888] mx-auto mb-1" />
            <span className="text-[11px] text-[#73726C] dark:text-[#B4B4B4] block font-medium">Pick a topic in Syllabus</span>
          </div>
        )}

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#73726C] dark:text-[#B4B4B4] bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] rounded-xl hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] hover:text-[#1F1E1D] dark:hover:text-[#ECECEC] transition-colors"
          >
            <span className="flex items-center gap-2">
              {isDarkMode ? <Moon className="w-3.5 h-3.5 text-[#D97757]" /> : <Sun className="w-3.5 h-3.5 text-[#D97757]" />}
              <span>{isDarkMode ? "Dark Theme" : "Paper Theme"}</span>
            </span>
            <span className="text-[10px] font-mono text-[#888888]">{isDarkMode ? "Obsidian" : "Warm"}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
