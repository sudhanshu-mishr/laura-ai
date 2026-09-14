import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Resilient Gemini execution with exponential backoff & model fallbacks
interface GeminiResilientOptions {
  contents: any;
  config?: any;
  primaryModel?: string;
  fallbackModels?: string[];
  maxRetriesPerModel?: number;
}

async function callGeminiResilient(options: GeminiResilientOptions) {
  const ai = getAiClient();
  const primary = options.primaryModel || "gemini-3.8-flash";
  const fallbacks = options.fallbackModels || ["gemini-flash-latest", "gemini-3.1-flash-lite"];
  const modelsToTry = [primary, ...fallbacks];
  const maxRetries = options.maxRetriesPerModel ?? 2;

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delayMs = Math.min(800 * Math.pow(2, attempt - 1) + Math.random() * 400, 3500);
          console.log(`[Gemini Resilient] Retrying ${model} (attempt ${attempt + 1}/${maxRetries + 1}) after ${Math.round(delayMs)}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });

        return response;
      } catch (err: any) {
        lastError = err;
        const errString = `${err?.status || ""} ${err?.code || ""} ${err?.message || ""} ${JSON.stringify(err)}`;
        const isTransient =
          errString.includes("503") ||
          errString.includes("UNAVAILABLE") ||
          errString.includes("high demand") ||
          errString.includes("temporary") ||
          errString.includes("429") ||
          errString.includes("RESOURCE_EXHAUSTED") ||
          errString.includes("overloaded");

        console.warn(`[Gemini Resilient] Model ${model} attempt ${attempt + 1} failed:`, err?.message || err);

        if (!isTransient) {
          // If error is not transient (e.g., bad parameter), move on or break
          break;
        }
      }
    }
    console.log(`[Gemini Resilient] Primary model ${model} temporarily unavailable. Trying fallback model...`);
  }

  throw lastError || new Error("Gemini AI models are currently experiencing high demand. Please try again in a few seconds.");
}

// Robust JSON extractor from Gemini text responses
function extractJsonFromModelText(text: string): any {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // 1. Try markdown code block extraction
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch {}
    }

    // 2. Try slicing first '{' to last '}'
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
      } catch {}
    }

    // 3. Try slicing first '[' to last ']'
    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1));
      } catch {}
    }

    throw new Error("Could not parse valid JSON from AI response: " + trimmed.slice(0, 100));
  }
}

// Intelligent heuristic syllabus fallback in case of extended upstream service spikes
function parseSyllabusHeuristically(rawText: string, fileName?: string) {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const firstFew = lines.slice(0, 5).join(" ");

  // Extract course code
  const codeMatch = firstFew.match(/([A-Z]{2,5}\s*\d{1,4}[A-Z]?)/i);
  const courseCode = codeMatch ? codeMatch[1].toUpperCase() : "COURSE 101";

  // Extract course name
  let courseName = lines[0] || fileName || "New Academic Course";
  if (courseName.length > 50) {
    courseName = courseName.slice(0, 50) + "...";
  }

  // Extract modules & topics by scanning for Week / Module / Chapter or sections
  const modules: any[] = [];
  let currentModule: any = null;
  const deadlines: any[] = [];

  let modIndex = 1;
  let topicIndex = 1;

  for (const line of lines) {
    const weekMatch = line.match(/(?:Week|Module|Unit|Chapter)\s*(\d+)[:\s-]*(.*)/i);
    if (weekMatch) {
      const weekNum = parseInt(weekMatch[1], 10) || modIndex;
      const title = weekMatch[2]?.trim() || `Module ${modIndex}`;
      currentModule = {
        id: `mod-${modIndex}`,
        title: title || `Module ${modIndex}`,
        weekNumber: weekNum,
        orderIndex: modIndex,
        description: `Core curriculum coverage for ${title || `Module ${modIndex}`}.`,
        topics: [],
      };
      modules.push(currentModule);
      modIndex++;
      continue;
    }

    const topicMatch = line.match(/(?:Topic\s*\d*|[-*•])\s*[:\s-]*(.*)/i);
    if (topicMatch && currentModule && topicMatch[1].length > 3) {
      const topicTitle = topicMatch[1].replace(/^(readings|reading|chapter)\s*:\s*/i, "").trim();
      currentModule.topics.push({
        id: `top-${currentModule.orderIndex}-${topicIndex}`,
        title: topicTitle.slice(0, 45),
        summary: `Study and practice fundamental concepts for ${topicTitle.slice(0, 45)}.`,
        difficulty: topicIndex % 3 === 0 ? "Advanced" : topicIndex % 2 === 0 ? "Intermediate" : "Beginner",
        estimatedMinutes: 45 + (topicIndex % 3) * 15,
        keyTerms: [topicTitle.split(" ")[0] || "Key Concept", "Fundamentals", "Applications"],
        readingsOrRefs: ["Lecture & Textbook Notes"],
      });
      topicIndex++;
    }

    // Deadlines
    const deadlineMatch = line.match(/(assignment|problem set|midterm|exam|quiz|project|final)\s*(\d*)[:\s-]*(.*)/i);
    if (deadlineMatch) {
      const type = deadlineMatch[1].toLowerCase().includes("exam") || deadlineMatch[1].toLowerCase().includes("midterm")
        ? "exam"
        : deadlineMatch[1].toLowerCase().includes("quiz")
        ? "quiz"
        : deadlineMatch[1].toLowerCase().includes("project")
        ? "project"
        : "assignment";

      deadlines.push({
        id: `dl-${deadlines.length + 1}`,
        title: line.slice(0, 50),
        type,
        dueDate: "Upcoming",
        weightPercent: type === "exam" ? 25 : 10,
        description: `Key milestone: ${line.slice(0, 80)}`,
        relatedTopicTitle: currentModule?.title || "Core Course Topic",
      });
    }
  }

  // Ensure at least 3 modules exist
  if (modules.length === 0) {
    modules.push(
      {
        id: "mod-1",
        title: "Course Foundations & Core Concepts",
        weekNumber: 1,
        orderIndex: 1,
        description: "Initial foundational principles and prerequisite mental models.",
        topics: [
          {
            id: "top-1-1",
            title: "Core Framework & Nomenclature",
            summary: "Understand the key definitions and setup for the course.",
            difficulty: "Beginner",
            estimatedMinutes: 45,
            keyTerms: ["Foundations", "Core Rules", "Framework"],
            readingsOrRefs: ["Syllabus Section 1"],
          },
        ],
      },
      {
        id: "mod-2",
        title: "Intermediate Applications & Problem Sets",
        weekNumber: 2,
        orderIndex: 2,
        description: "Deep dive into problem solving and core mechanics.",
        topics: [
          {
            id: "top-2-1",
            title: "Key Methodologies & Problem Solving",
            summary: "Hands-on execution and high-yield application.",
            difficulty: "Intermediate",
            estimatedMinutes: 60,
            keyTerms: ["Problem Solving", "Execution", "Technique"],
            readingsOrRefs: ["Syllabus Section 2"],
          },
        ],
      }
    );
  }

  return {
    courseName,
    code: courseCode,
    instructor: "Course Instructor",
    term: "Current Term",
    description: "Structured academic roadmap extracted from syllabus materials.",
    suggestedStudyOrderExplanation: "Work through the modules chronologically, solidifying foundational concepts before attempting the milestone problem sets and exams.",
    modules,
    deadlines,
  };
}

const SYSTEM_TUTOR_PROMPT = `You are StudyHQ's AI tutor — a smart, chill friend who's actually elite at explaining things.
Think: an awesome TA who is funny, direct, and zero-bullshit, definitely NOT a corporate chatbot.

Tone & Style Rules:
- Talk casual and confident with natural Gen-Z/collegiate phrasing (e.g., "bet", "no cap", "let's lock in", "here's the play", "lowkey", "makes zero sense until you see it like this"). Never overdo it or sound like a try-hard boomer; keep it authentic, smooth, and grounded.
- ZERO filler. Never say "As an AI language model..." or "Certainly! I would be delighted to assist you with...".
- Explanations must be rock-solid, structured, and accurate. Casual vibe, high intellect. Never dumb it down.
- Heavy on analogies, intuitive mental models, step-by-step breakdowns, and real-world parallels rather than dense textbook walls of text.
- Encouraging but 100% honest — if the user is confused, off track, or procrastinating, call it out directly with kindness and hand them an actionable mini-plan.
- When teaching a topic: break it down into bite-sized concepts, check understanding with a quick low-friction check ("Does that click or want a weird analogy?"), and adjust pace.
- Format responses nicely with markdown (headers, bold terms, concise bullets).`;

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ extended: true, limit: "30mb" }));

  // API Health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Parse Syllabus Endpoint
  app.post("/api/syllabus/parse", async (req, res) => {
    const { text, fileBase64, mimeType, fileName } = req.body;

    if (!text && !fileBase64) {
      return res.status(400).json({ error: "Please provide either syllabus text or an uploaded file." });
    }

    const promptInstructions = `You are an expert academic curriculum parser and study strategist.
Analyze the following course syllabus and extract all course details into a strictly valid JSON object.
Extract or synthesize:
1. "courseName": The clear course title (e.g. "Introduction to Computer Science", "Organic Chemistry I").
2. "code": Course code (e.g. "CS 106A", "CHEM 201", "ECON 101").
3. "instructor": Instructor or professor name if present, else "Prof. TBA".
4. "term": Academic term/semester (e.g. "Fall 2026", "Spring 2026").
5. "description": A sharp, informative 2-sentence summary of what this course covers and its core goal.
6. "suggestedStudyOrderExplanation": A smart, tactical 2-3 sentence recommendation from the AI TA explaining why they should study these topics in this specific order, highlighting any major milestone deadlines or foundational prerequisite concepts.
7. "modules": Array of 3 to 10 structured modules or units. Each module must have:
   - "id": unique string (e.g. "mod-1")
   - "title": module name
   - "weekNumber": integer week or chronological order
   - "orderIndex": integer starting at 1
   - "description": 1-2 sentence focus of the module
   - "topics": Array of 2 to 6 specific study topics in that module. Each topic must have:
     - "id": unique string (e.g. "top-1-1")
     - "title": concise topic name
     - "summary": 1-2 sentence breakdown of what you actually need to learn
     - "difficulty": "Beginner" | "Intermediate" | "Advanced"
     - "estimatedMinutes": realistic study time (e.g. 35, 45, 60, 90)
     - "keyTerms": array of 3 to 6 essential keywords or formulas
     - "readingsOrRefs": array of chapter or reading references
8. "deadlines": Array of upcoming exams, quizzes, problem sets, midterms, finals, or projects extracted from the syllabus. Each must have:
   - "id": unique string (e.g. "dl-1")
   - "title": e.g. "Problem Set 1", "Midterm Exam 1", "Final Capstone Project"
   - "type": "exam" | "assignment" | "quiz" | "project" | "reading"
   - "dueDate": realistic calendar date or relative date string (e.g. "Week 4 Friday", "Oct 18, 2026")
   - "weightPercent": number (e.g. 20 for 20%) or estimated weight
   - "description": brief note on what is tested
   - "relatedTopicTitle": name of module or topic it corresponds to

Format requirement: Respond ONLY with valid JSON matching this schema. Do not include markdown code block backticks.`;

    try {
      let contentsPayload: any;

      if (fileBase64 && mimeType) {
        contentsPayload = {
          parts: [
            {
              inlineData: {
                data: fileBase64,
                mimeType: mimeType,
              },
            },
            {
              text: `${promptInstructions}\n\nAdditional syllabus context/file name: ${fileName || "syllabus"}\nText context if any: ${text || ""}`,
            },
          ],
        };
      } else {
        contentsPayload = `${promptInstructions}\n\nHere is the raw syllabus text:\n${text}`;
      }

      const response = await callGeminiResilient({
        contents: contentsPayload,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const responseText = response?.text || "{}";
      const parsedData = extractJsonFromModelText(responseText);

      if (!parsedData || !parsedData.modules || parsedData.modules.length === 0) {
        throw new Error("AI output was empty or improperly formatted.");
      }

      return res.json(parsedData);
    } catch (error: any) {
      console.warn("Syllabus parse primary attempts failed, checking fallback:", error?.message);

      // If raw text is available, use heuristic extraction fallback so user isn't stuck during demand spikes
      if (text && text.trim().length > 20) {
        console.log("Using heuristic syllabus parser fallback due to AI model demand spike...");
        const fallbackCourse = parseSyllabusHeuristically(text, fileName);
        return res.json(fallbackCourse);
      }

      res.status(503).json({
        error: "The AI service is currently experiencing high demand. Please try again in a few seconds.",
      });
    }
  });

  // AI Tutor Chat Endpoint
  app.post("/api/tutor/chat", async (req, res) => {
    try {
      const { messages, courseContext, teachingMode } = req.body;

      let contextInstruction = SYSTEM_TUTOR_PROMPT;

      if (courseContext) {
        contextInstruction += `\n\nCURRENT COURSE CONTEXT:
Course: ${courseContext.courseName || "General Study"}
Active Topic: ${courseContext.currentTopic?.title || "Overview"}
Topic Summary: ${courseContext.currentTopic?.summary || ""}
Key Terms for this topic: ${(courseContext.currentTopic?.keyTerms || []).join(", ")}
Completed Topics: ${(courseContext.completedTopics || []).join(", ") || "None yet"}`;
      }

      if (teachingMode) {
        if (teachingMode === "teach_next") {
          contextInstruction += `\n\nTEACHING MODE ACTIVATED: "Teach Next Topic". Give an engaging, punchy, intuitive intro to this topic. Break the first big concept down with a memorable visual analogy. Then ask a quick sanity-check question to see if they're with you.`;
        } else if (teachingMode === "analogy") {
          contextInstruction += `\n\nTEACHING MODE ACTIVATED: "Analogy Engine". Explain the concept using a funny, brilliant real-world analogy (e.g. food, sports, video games, everyday life) so it instantly clicks.`;
        } else if (teachingMode === "quiz_me") {
          contextInstruction += `\n\nTEACHING MODE ACTIVATED: "Quick Quiz / Drill". Ask ONE snappy, high-yield conceptual question or problem to test their intuition on this topic. Don't reveal the answer immediately — let them answer first, or prompt them to take their best guess!`;
        } else if (teachingMode === "eli5") {
          contextInstruction += `\n\nTEACHING MODE ACTIVATED: "ELI5 / Simplify". Strip away all the academic jargon and explain this like they're 5 or talking to a buddy at 2 AM. Pure intuition and common sense.`;
        } else if (teachingMode === "deep_dive") {
          contextInstruction += `\n\nTEACHING MODE ACTIVATED: "Deep Dive / Edge Cases". Level up the difficulty. Discuss what professors love testing on exams, common trick questions, edge cases, and underlying mechanics.`;
        }
      }

      // Format conversation history
      const formattedContents = (messages || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      // If empty messages, supply default kickoff
      if (formattedContents.length === 0) {
        formattedContents.push({
          role: "user",
          parts: [{ text: "Hey! What should we tackle first?" }],
        });
      }

      const response = await callGeminiResilient({
        contents: formattedContents,
        config: {
          systemInstruction: contextInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response?.text || "My bad, brain lagged for a second. Ask me that again!";
      res.json({ reply: replyText });
    } catch (error: any) {
      console.error("Tutor chat error:", error);
      res.json({
        reply: "⚠️ The AI tutor is experiencing a momentary spike in traffic right now. Give it 3-5 seconds and click ask again — let's lock back in!",
      });
    }
  });

  // Auto-Generate Structured Notes Endpoint
  app.post("/api/notes/generate", async (req, res) => {
    const { courseName, topicTitle, topicSummary, keyTerms, chatExcerpts } = req.body;

    try {
      const prompt = `You are StudyHQ's elite note-taking engine.
Create comprehensive, clean, beautifully structured academic study notes in Markdown for the following topic:

Course: ${courseName || "General Course"}
Topic: ${topicTitle}
Topic Overview: ${topicSummary || ""}
Key Terms: ${(keyTerms || []).join(", ") || "Standard syllabus terms"}
${chatExcerpts ? `Recent Tutor Discussion Points:\n${chatExcerpts}` : ""}

Required Note Structure in Markdown:
# ${topicTitle}
> **TL;DR (The 30-Second Mental Model):** [A punchy, crystal-clear 2-sentence summary with an intuitive analogy]

## 1. Core Principles & Mechanisms
[Structured breakdown with bullet points, bolded key terms, and exact mathematical/conceptual formulations]

## 2. Key Terms & Definitions
[Bullet list where every term is **bolded** followed by a no-nonsense definition and an example]

## 3. High-Yield Exam Traps & Common Misconceptions
[What students always get wrong on midterms and how to dodge it]

## 4. Quick Practice Drill
[2 self-test questions with toggleable or bulleted answers]

Keep the formatting clean, modern, and easy to scan. No fluff.`;

      const response = await callGeminiResilient({
        contents: prompt,
        config: {
          temperature: 0.3,
        },
      });

      res.json({ notes: response?.text || "" });
    } catch (error: any) {
      console.error("Notes generation error:", error);
      // Generate clean structured study notes fallback if demand spike persists
      const fallbackNotes = `# ${topicTitle || "Study Notes"}

> **TL;DR (The 30-Second Mental Model):** ${topicSummary || `Key foundational overview of ${topicTitle}. Master the primary mechanics and definitions before tackling edge-case problem sets.`}

## 1. Core Principles & Mechanisms
- **Foundational Concept:** Master the underlying theory and mathematical/logical formulations.
- **Workflow:** Break down every problem into systematic inputs, transformations, and outputs.
- **Application:** Always verify boundary conditions and check sanity after calculating.

## 2. Key Terms & Definitions
${(keyTerms || ["Core Theory", "Application"]).map((term: string) => `- **${term}:** Fundamental conceptual unit essential for exams and problem sets.`).join("\n")}

## 3. High-Yield Exam Traps
- Misinterpreting problem boundaries or mixing up formula constraints.
- Skipping step-by-step verification during intermediate steps.

## 4. Quick Self-Check
1. *Can you explain this concept in 1 sentence without looking at notes?*
2. *What is the most common mistake students make on this topic?*
`;
      res.json({ notes: fallbackNotes });
    }
  });

  // Analyze User Notes Endpoint (summarize, quiz, find gaps, format cleanup)
  app.post("/api/notes/analyze", async (req, res) => {
    const { userNotes, courseName, topicTitle, action } = req.body;

    if (!userNotes || userNotes.trim().length === 0) {
      return res.status(400).json({ error: "Please provide notes to analyze." });
    }

    try {
      const prompt = `You are StudyHQ's academic intelligence engine.
Analyze the student's study notes for:
Course: ${courseName || "General"}
Topic: ${topicTitle || "Study Notes"}

Student's Raw Notes:
"""
${userNotes}
"""

Requested Action: ${action || "all"}

Provide an analysis formatted as valid JSON with the following fields:
{
  "cleanedNotes": "A polished, structured markdown rewrite of their notes with clear headers, bold key terms, and organized bullet points.",
  "summary": "A sharp, executive summary highlighting the big ideas (3-4 sentences).",
  "identifiedGaps": [
    "List of 3 to 5 critical nuances, missing prerequisites, edge cases, or exam concepts that the student omitted from their notes"
  ],
  "quizQuestions": [
    {
      "question": "Realistic exam/conceptual question based on these notes",
      "answer": "Accurate model answer",
      "explanation": "Why this is correct and what trap to avoid"
    }
  ],
  "retentionTip": "One memorable mnemonic or mental hook to cement this in memory"
}

Respond ONLY with valid JSON.`;

      const response = await callGeminiResilient({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const text = response?.text || "{}";
      const parsed = extractJsonFromModelText(text);

      res.json(parsed);
    } catch (error: any) {
      console.error("Notes analysis error:", error);
      // Fallback structured analysis
      const fallbackAnalysis = {
        cleanedNotes: `# ${topicTitle || "Polished Notes"}\n\n${userNotes}`,
        summary: `Review of key concepts in ${topicTitle || "the notes"}. Focus on memorizing foundational terms and working through practice drills.`,
        identifiedGaps: [
          "Verify edge cases and prerequisite boundary conditions.",
          "Check step-by-step mathematical or logical derivations.",
          "Review typical exam trick questions related to this unit."
        ],
        quizQuestions: [
          {
            question: `What is the most crucial rule or principle governing ${topicTitle || "this topic"}?`,
            answer: "The fundamental theorem or definition stated in the syllabus.",
            explanation: "Midterms regularly test whether you understand the definition rather than memorized steps."
          }
        ],
        retentionTip: "Explain this concept aloud to a peer or rubber duck for 2 minutes to test retention."
      };
      res.json(fallbackAnalysis);
    }
  });

  // YouTube Recommendation Generator Endpoint
  app.post("/api/youtube/recommend", async (req, res) => {
    const { courseName, topicTitle, topicSummary, keyTerms } = req.body;

    try {
      const prompt = `You are StudyHQ's YouTube learning curator.
For the following academic topic, suggest 5 high-yield YouTube search queries and recommended video types that provide the absolute best visual intuition, conceptual clarity, or problem-solving walkthroughs.

Course: ${courseName || "Academic Course"}
Topic: ${topicTitle}
Summary: ${topicSummary || ""}
Key Terms: ${(keyTerms || []).join(", ") || ""}

Format your response strictly as a JSON array of recommendation objects:
[
  {
    "id": "yt-1",
    "title": "Title or concept to search for (e.g. '3Blue1Brown Intuition on Eigenvectors')",
    "searchQuery": "Optimized YouTube search query string (e.g. 'linear algebra eigenvectors visualized 3blue1brown')",
    "whyRelevant": "Why this video query is game-changing for understanding this specific topic",
    "recommendedChannelStyle": "Channel or style recommendation (e.g. '3Blue1Brown, StatQuest, CrashCourse, Khan Academy, Fireship, MIT OpenCourseWare, Michel van Biezen')",
    "difficultyLevel": "Visual Intuition"
  }
]

Respond ONLY with valid JSON array.`;

      const response = await callGeminiResilient({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      });

      const text = response?.text || "[]";
      const items = extractJsonFromModelText(text);

      const enhanced = (Array.isArray(items) ? items : []).map((item: any, idx: number) => ({
        id: item.id || `yt-${idx + 1}`,
        title: item.title || `${topicTitle} Explained`,
        searchQuery: item.searchQuery || `${topicTitle} tutorial`,
        whyRelevant: item.whyRelevant || "Provides visual intuition and problem walkthroughs.",
        recommendedChannelStyle: item.recommendedChannelStyle || "Educational channels",
        difficultyLevel: item.difficultyLevel || "Visual Intuition",
        youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.searchQuery || item.title || topicTitle)}`,
      }));

      res.json({ recommendations: enhanced });
    } catch (error: any) {
      console.error("YouTube recommend error:", error);
      // High-yield fallback search recommendations tailored to the topic
      const topic = topicTitle || "Core Concepts";
      const fallbackRecs = [
        {
          id: "yt-fallback-1",
          title: `${topic} Visual Intuition & Mental Model`,
          searchQuery: `${topic} visual intuition explained`,
          whyRelevant: "Builds deep conceptual clarity and visual geometric or logical intuition.",
          recommendedChannelStyle: "3Blue1Brown / StatQuest / Welch Labs",
          difficultyLevel: "Visual Intuition",
          youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} visual intuition`)}`,
        },
        {
          id: "yt-fallback-2",
          title: `${topic} Complete Crash Course`,
          searchQuery: `${topic} crash course full guide`,
          whyRelevant: "Comprehensive overview covering all fundamental rules and definitions.",
          recommendedChannelStyle: "CrashCourse / Khan Academy / freeCodeCamp",
          difficultyLevel: "Quick Overview",
          youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} crash course`)}`,
        },
        {
          id: "yt-fallback-3",
          title: `${topic} Step-by-Step Problem Solving & Exam Questions`,
          searchQuery: `${topic} practice problems walkthrough exam`,
          whyRelevant: "Shows actual problem set solutions and tips for avoiding common exam traps.",
          recommendedChannelStyle: "Organic Chemistry Tutor / Michel van Biezen / Brian McLogan",
          difficultyLevel: "Problem Solving",
          youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} practice problems walkthrough`)}`,
        },
        {
          id: "yt-fallback-4",
          title: `${topic} University Lecture & Deep Mechanics`,
          searchQuery: `${courseName || ""} ${topic} MIT lecture`,
          whyRelevant: "Rigorous academic formulation directly from leading university professors.",
          recommendedChannelStyle: "MIT OpenCourseWare / Stanford Online / Harvard",
          difficultyLevel: "Deep Dive",
          youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${courseName || ""} ${topic} university lecture`)}`,
        },
      ];
      res.json({ recommendations: fallbackRecs });
    }
  });

  // Vite middleware setup for SPA
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyHQ server running on port ${PORT}`);
  });
}

startServer();
