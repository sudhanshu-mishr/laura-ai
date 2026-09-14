import React, { createContext, useContext, useEffect, useState } from "react";
import { Course, Note, ChatMessage, Topic } from "../types";
import { INITIAL_PRESET_COURSE } from "../data/sampleSyllabi";

interface StudyContextType {
  courses: Course[];
  activeCourse: Course | null;
  activeCourseId: string;
  activeTopic: Topic | null;
  activeTopicId: string | null;
  notes: Note[];
  chatHistory: ChatMessage[];
  setActiveCourseId: (id: string) => void;
  setActiveTopicId: (id: string | null) => void;
  addCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  toggleTopicComplete: (courseId: string, topicId: string) => void;
  toggleDeadlineComplete: (courseId: string, deadlineId: string) => void;
  saveNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearChatHistory: () => void;
  resetToSampleData: () => void;
  startFreshWithNoCourses: () => void;
}

const StudyContext = createContext<StudyContextType | null>(null);

const STORAGE_KEYS = {
  COURSES: "studyhq_courses_v1",
  ACTIVE_COURSE: "studyhq_active_course_v1",
  ACTIVE_TOPIC: "studyhq_active_topic_v1",
  NOTES: "studyhq_notes_v1",
  CHAT: "studyhq_chat_v1",
};

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial courses from localStorage or default to sample
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COURSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [INITIAL_PRESET_COURSE];
  });

  const [activeCourseId, setActiveCourseIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_COURSE);
      if (saved) return saved;
    } catch (e) {}
    return INITIAL_PRESET_COURSE.id;
  });

  const [activeTopicId, setActiveTopicIdState] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TOPIC);
      if (saved) return saved;
    } catch (e) {}
    return "top-2-1"; // Default to Conditionals topic in CS 106A
  });

  // Notes
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: "note-init-1",
        courseId: INITIAL_PRESET_COURSE.id,
        courseName: INITIAL_PRESET_COURSE.name,
        topicId: "top-1-1",
        topicTitle: "Computational Thinking & Decomposition",
        title: "Decomposition Mental Models & Karel",
        content: `# Computational Thinking & Decomposition
> **TL;DR (The 30-Second Mental Model):** Think of coding like ordering at a busy restaurant. You don't tell the chef how to harvest wheat; you give modular commands like "make_burger()". Decomposition means writing small, pure helper functions that do ONE job ruthlessly well.

## 1. Core Principles & Mechanisms
- **Top-Down Stepwise Refinement**: Always sketch the master function first before filling in the implementation details.
- **Single Responsibility Principle (SRP)**: If your function is longer than 25 lines or requires the word "and" in its docstring, it should probably be two functions.
- **Abstraction**: Hiding lower-level hardware or state mutations behind clean, descriptive method signatures.

## 2. Key Terms & Definitions
- **Abstraction**: Separating interface from underlying mechanics.
- **Decomposition**: Breaking a complex task into manageable, isolated sub-problems.
- **Invariants**: Conditions that are guaranteed to stay true before and after a function runs.

## 3. High-Yield Exam Traps
- **Code Duplication**: Losing points for copy-pasting the same 4 lines in 3 different branches. Wrap it in a helper function immediately!
- **State Leakage**: Modifying global variables unintentionally inside a helper function.`,
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        tags: ["Decomposition", "Python", "CS106A"],
        aiGenerated: true,
      },
    ];
  });

  // Initial chat message with Gen-Z chill TA tone
  const INITIAL_CHAT_MESSAGE: ChatMessage = {
    id: "msg-welcome",
    role: "model",
    content: `Yo! Welcome to **StudyHQ**. I'm your AI TA — basically here to break down your worst classes, turn your messy syllabi into a clean roadmap, and drill concepts until they actually stick without the corporate robot fluff.

Drop your syllabus (PDF, image, or text), or check out the sample course I set up. What are we tackling today?`,
    timestamp: new Date().toISOString(),
    isInitialGreeting: true,
  };

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [INITIAL_CHAT_MESSAGE];
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    } catch (e) {}
  }, [courses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COURSE, activeCourseId);
    } catch (e) {}
  }, [activeCourseId]);

  useEffect(() => {
    try {
      if (activeTopicId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TOPIC, activeTopicId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_TOPIC);
      }
    } catch (e) {}
  }, [activeTopicId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (e) {}
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(chatHistory));
    } catch (e) {}
  }, [chatHistory]);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0] || null;

  const activeTopic =
    activeCourse?.modules
      .flatMap((m) => m.topics)
      .find((t) => t.id === activeTopicId) || null;

  const setActiveCourseId = (id: string) => {
    setActiveCourseIdState(id);
    const course = courses.find((c) => c.id === id);
    if (course && course.modules.length > 0 && course.modules[0].topics.length > 0) {
      setActiveTopicIdState(course.modules[0].topics[0].id);
    } else {
      setActiveTopicIdState(null);
    }
  };

  const setActiveTopicId = (id: string | null) => {
    setActiveTopicIdState(id);
  };

  const addCourse = (newCourse: Course) => {
    setCourses((prev) => [newCourse, ...prev.filter((c) => c.id !== newCourse.id)]);
    setActiveCourseIdState(newCourse.id);
    if (newCourse.modules[0]?.topics[0]) {
      setActiveTopicIdState(newCourse.modules[0].topics[0].id);
    }
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (activeCourseId === id) {
        if (filtered.length > 0) {
          setActiveCourseIdState(filtered[0].id);
        } else {
          setActiveCourseIdState("");
          setActiveTopicIdState(null);
        }
      }
      return filtered;
    });
  };

  const toggleTopicComplete = (courseId: string, topicId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => ({
            ...m,
            topics: m.topics.map((t) => (t.id === topicId ? { ...t, isCompleted: !t.isCompleted } : t)),
          })),
        };
      })
    );
  };

  const toggleDeadlineComplete = (courseId: string, deadlineId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          deadlines: c.deadlines.map((d) =>
            d.id === deadlineId ? { ...d, isCompleted: !d.isCompleted } : d
          ),
        };
      })
    );
  };

  const saveNote = (newNote: Note) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === newNote.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newNote;
        return updated;
      }
      return [newNote, ...prev];
    });
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const addChatMessage = (msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, newMsg]);
  };

  const clearChatHistory = () => {
    setChatHistory([INITIAL_CHAT_MESSAGE]);
  };

  const resetToSampleData = () => {
    setCourses([INITIAL_PRESET_COURSE]);
    setActiveCourseIdState(INITIAL_PRESET_COURSE.id);
    setActiveTopicIdState(INITIAL_PRESET_COURSE.modules[0].topics[0].id);
    setChatHistory([INITIAL_CHAT_MESSAGE]);
  };

  const startFreshWithNoCourses = () => {
    setCourses([]);
    setActiveCourseIdState("");
    setActiveTopicIdState(null);
    setNotes([]);
    setChatHistory([
      {
        id: "msg-fresh",
        role: "model",
        content: `Hey! Blank slate ready. You haven't loaded any course syllabi yet.
Upload your syllabus (PDF, image, or text paste), or tell me what topic or class you're studying, and we'll map the whole thing out in seconds.`,
        timestamp: new Date().toISOString(),
        isInitialGreeting: true,
      },
    ]);
  };

  return (
    <StudyContext.Provider
      value={{
        courses,
        activeCourse,
        activeCourseId,
        activeTopic,
        activeTopicId,
        notes,
        chatHistory,
        setActiveCourseId,
        setActiveTopicId,
        addCourse,
        deleteCourse,
        toggleTopicComplete,
        toggleDeadlineComplete,
        saveNote,
        deleteNote,
        addChatMessage,
        clearChatHistory,
        resetToSampleData,
        startFreshWithNoCourses,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error("useStudy must be used within a StudyProvider");
  }
  return context;
};
