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
  GraduationCap,
  Sparkles,
  ChevronRight,
  BookOpen
} from "lucide-react";

export type NavTab = "dashboard" | "syllabus" | "tutor" | "notes" | "youtube" | "focus";

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  onOpenUploadModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenUploadModal,
}) => {
  const { courses, activeCourse, activeCourseId, setActiveCourseId, activeTopic } = useStudy();

  const navItems = [
    { id: "dashboard" as NavTab, label: "Dashboard", icon: LayoutDashboard, badge: null },
    { id: "syllabus" as NavTab, label: "Syllabus Roadmap", icon: Compass, badge: activeCourse ? `${activeCourse.modules.length} modules` : null },
    { id: "tutor" as NavTab, label: "AI Tutor (TA)", icon: Bot, badge: "Chill TA" },
    { id: "notes" as NavTab, label: "Smart Notes", icon: FileText, badge: null },
    { id: "youtube" as NavTab, label: "YouTube Recs", icon: Youtube, badge: null },
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
      className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between h-screen sticky top-0 select-none z-30"
    >
      {/* Top Header & Brand */}
      <div className="p-4 flex flex-col gap-4">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 font-black text-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-zinc-100">StudyHQ</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI TA
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Study Command Center</p>
            </div>
          </div>
        </div>

        {/* Course Switcher Selector */}
        <div className="bg-zinc-900/80 rounded-xl p-2.5 border border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 px-1">
            <span>Active Course</span>
            <button
              id="btn-sidebar-add-course"
              onClick={onOpenUploadModal}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline lowercase"
            >
              <PlusCircle className="w-3 h-3" /> +new
            </button>
          </div>

          {courses.length > 0 ? (
            <select
              id="select-active-course"
              value={activeCourseId}
              onChange={(e) => setActiveCourseId(e.target.value)}
              className="w-full bg-zinc-950 text-zinc-200 text-xs font-semibold rounded-lg px-2.5 py-2 border border-zinc-800 focus:outline-none focus:border-indigo-500 truncate cursor-pointer"
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
              onClick={onOpenUploadModal}
              className="w-full py-2 px-3 text-xs bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg font-medium text-center"
            >
              + Upload First Syllabus
            </button>
          )}

          {/* Active Course Progress Bar */}
          {activeCourse && totalTopics > 0 && (
            <div className="mt-2.5 px-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                <span>Progress</span>
                <span className="font-mono text-zinc-200 font-bold">{completionPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
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
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-zinc-800/90 text-zinc-100 border border-zinc-700/70 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      item.badge === "Chill TA"
                        ? "bg-violet-500/20 text-violet-300 font-semibold"
                        : "bg-zinc-900 text-zinc-400"
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

      {/* Bottom active topic / quick context banner */}
      <div className="p-3 border-t border-zinc-900 flex flex-col gap-2">
        {activeTopic ? (
          <div
            id="sidebar-active-topic-card"
            onClick={() => setCurrentTab("tutor")}
            className="p-2.5 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/70 hover:border-indigo-500/40 cursor-pointer group transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Focus Topic
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs font-semibold text-zinc-200 line-clamp-1 group-hover:text-white">
              {activeTopic.title}
            </p>
            <span className="text-[10px] text-zinc-500 block mt-0.5">
              Click to drill with AI TA
            </span>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/40 text-center">
            <BookOpen className="w-4 h-4 text-zinc-500 mx-auto mb-1" />
            <span className="text-[11px] text-zinc-400 block font-medium">Pick a topic in Syllabus</span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
          <span>Dark Mode Active</span>
          <span className="text-[10px] font-mono text-zinc-400">v1.0</span>
        </div>
      </div>
    </aside>
  );
};
