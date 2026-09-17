import React, { useState, useEffect } from "react";
import { StudyProvider } from "./context/StudyContext";
import { FocusProvider } from "./context/FocusContext";
import { Sidebar, NavTab } from "./components/Sidebar";
import { DashboardView } from "./components/DashboardView";
import { SyllabusView } from "./components/SyllabusView";
import { TutorView } from "./components/TutorView";
import { NotesView } from "./components/NotesView";
import { YouTubeView } from "./components/YouTubeView";
import { FocusToolsView } from "./components/FocusToolsView";
import { PersistentFocusWidget } from "./components/PersistentFocusWidget";
import { SyllabusUploadModal } from "./components/SyllabusUploadModal";
import { Menu, X, Sun, Moon } from "lucide-react";

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("studyhq_theme");
      if (saved) return saved === "dark";
    } catch (e) {}
    // Default to light mode for the authentic Claude warm paper experience
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("studyhq_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("studyhq_theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div
      id="studyhq-root"
      className="min-h-screen bg-[#FAF9F5] dark:bg-[#212121] text-[#1F1E1D] dark:text-[#ECECEC] flex flex-col md:flex-row antialiased selection:bg-[#D97757]/20 selection:text-[#D97757] transition-colors duration-200"
    >
      {/* Mobile Top App Bar */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-[#FFFFFF] dark:bg-[#262624] border-b border-[#E5E5E0] dark:border-[#30302E] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#D97757] flex items-center justify-center text-white font-black shadow-xs">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-white">
              <defs>
                <ellipse id="petal-pair-mob" cx="100" cy="100" rx="88" ry="22" />
              </defs>
              <g fill="currentColor" fillRule="evenodd">
                <use href="#petal-pair-mob" transform="rotate(0 100 100)" />
                <use href="#petal-pair-mob" transform="rotate(45 100 100)" />
                <use href="#petal-pair-mob" transform="rotate(90 100 100)" />
                <use href="#petal-pair-mob" transform="rotate(135 100 100)" />
              </g>
            </svg>
          </div>
          <span className="font-serif font-medium text-base tracking-tight text-[#1F1E1D] dark:text-[#ECECEC]">
            StudyHQ
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white rounded-xl bg-[#F0EEE6] dark:bg-[#30302E] border border-[#DDDDDD] dark:border-[#404040]"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            id="btn-mobile-menu-toggle"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#73726C] dark:text-[#B4B4B4] hover:text-[#1F1E1D] dark:hover:text-white rounded-xl bg-[#F0EEE6] dark:bg-[#30302E] border border-[#DDDDDD] dark:border-[#404040]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex">
          <div className="w-72 bg-[#FAF9F5] dark:bg-[#212121] h-full border-r border-[#E5E5E0] dark:border-[#30302E] flex flex-col justify-between shadow-2xl">
            <Sidebar
              currentTab={currentTab}
              setCurrentTab={handleTabChange}
              onOpenUploadModal={() => {
                setIsUploadModalOpen(true);
                setMobileMenuOpen(false);
              }}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={handleTabChange}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
      </div>

      {/* Main Content Workspace */}
      <main
        id="main-content-viewport"
        className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen pb-24 md:pb-12 bg-[#FAF9F5] dark:bg-[#212121]"
      >
        {currentTab === "dashboard" && (
          <DashboardView
            setCurrentTab={setCurrentTab}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
          />
        )}
        {currentTab === "syllabus" && <SyllabusView setCurrentTab={setCurrentTab} />}
        {currentTab === "tutor" && <TutorView setCurrentTab={setCurrentTab} />}
        {currentTab === "notes" && <NotesView />}
        {currentTab === "youtube" && <YouTubeView />}
        {currentTab === "focus" && <FocusToolsView />}
      </main>

      {/* Floating Persistent Focus Widget (Docked in bottom-right corner across all views) */}
      <PersistentFocusWidget onOpenFullFocus={() => setCurrentTab("focus")} />

      {/* Global Upload Syllabus Modal */}
      <SyllabusUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccessNavigate={() => setCurrentTab("syllabus")}
      />
    </div>
  );
};

export default function App() {
  return (
    <StudyProvider>
      <FocusProvider>
        <MainLayout />
      </FocusProvider>
    </StudyProvider>
  );
}
