import React, { useState } from "react";
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
import { Menu, X, GraduationCap } from "lucide-react";

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div id="studyhq-root" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {/* Mobile Top App Bar */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-zinc-950 border-b border-zinc-900 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-zinc-100">StudyHQ</span>
        </div>

        <button
          id="btn-mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-zinc-100 rounded-xl bg-zinc-900 border border-zinc-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex">
          <div className="w-72 bg-zinc-950 h-full border-r border-zinc-900 flex flex-col justify-between">
            <Sidebar
              currentTab={currentTab}
              setCurrentTab={handleTabChange}
              onOpenUploadModal={() => {
                setIsUploadModalOpen(true);
                setMobileMenuOpen(false);
              }}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={handleTabChange}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
        />
      </div>

      {/* Main Content Workspace */}
      <main id="main-content-viewport" className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen pb-24 md:pb-12">
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
