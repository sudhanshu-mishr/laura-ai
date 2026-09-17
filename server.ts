import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import dotenv from "dotenv";

dotenv.config();

const filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(filename);

const PORT = parseInt(process.env.PORT || "3000", 10);

// Set up Freebuff local router via freebuff2api if needed, or point to external router
const FREEBUFF_API_URL = process.env.FREEBUFF_API_URL || "http://127.0.0.1:11434/v1";

const freebuffOpenAI = createOpenAI({
  baseURL: FREEBUFF_API_URL,
  apiKey: "dummy", // Freebuff local proxies usually ignore the API key
});

// Resilient Freebuff execution with exponential backoff & model fallbacks
interface FreebuffResilientOptions {
  contents: any;
  config?: any;
  primaryModel?: string;
  fallbackModels?: string[];
  maxRetriesPerModel?: number;
}

async function callFreebuffResilient(options: FreebuffResilientOptions) {
  const primary = options.primaryModel || "deepseek-v4.1-flash";
  const fallbacks = options.fallbackModels || ["glm-5.3-flash", "mimo-2.5"];
  const modelsToTry = [primary, ...fallbacks];
  const maxRetries = options.maxRetriesPerModel ?? 1;

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delayMs = Math.min(500 * Math.pow(2, attempt - 1) + Math.random() * 300, 2000);
          console.log(`[Freebuff Resilient] Retrying ${model} (attempt ${attempt + 1}/${maxRetries + 1}) after ${Math.round(delayMs)}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const messages: any[] = [];
        if (options.config?.systemInstruction) {
           messages.push({ role: 'system', content: options.config.systemInstruction });
        }
        messages.push({ role: 'user', content: options.contents });

        const response = await generateText({
          model: freebuffOpenAI(model),
          messages,
          temperature: options.config?.temperature,
        });

        return { text: response.text };
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err || "");
        console.warn(`[Freebuff Resilient] Model ${model} returned error: ${errMsg}.`);
      }
    }
  }

  throw lastError || new Error("Freebuff AI models are currently experiencing high demand. Please try again in a few seconds.");
}

function extractJsonFromFreebuffText(text: string): any {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch {}
    }

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
      } catch {}
    }

    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(trimmed.substring(firstBracket, lastBracket + 1));
      } catch {}
    }

    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.post(["/api/notes/generate", "/api/notes/generate/"], async (req, res) => {
    const { syllabus, topicTitle, courseName, previousKnowledge } = req.body;

    if (!syllabus || typeof syllabus !== "string" || syllabus.trim().length === 0) {
      return res.status(400).json({ error: "Syllabus text is required." });
    }

    try {
      const promptInstructions = `You are StudyHQ's world-class academic study assistant.
Create comprehensive, highly structured, and easy-to-memorize study notes from the provided syllabus text.
Course: ${courseName || "General Academic Course"}
Topic: ${topicTitle || "Key Concepts"}
Context/Previous Knowledge: ${previousKnowledge || "None provided"}

Output Requirements:
1. Use markdown formatting with clear headings (H1, H2, H3).
2. Use bolding for key terms and concepts.
3. Include bullet points for easy scanning.
4. Structure the notes into these sections:
   - Core Theory & Concepts (The big picture)
   - Key Terms & Definitions (Flashcard-ready)
   - High-Yield Exam Traps (What students usually get wrong)
   - Quick Self-Check (2-3 practice questions to test understanding)
`;

      let contentsPayload = "";
      if (syllabus.length > 25000) {
        contentsPayload = `${promptInstructions}\n\n[WARNING: Syllabus text is extremely long. I am providing a truncated version to fit within context limits. Focus on extracting the most vital, high-level structural concepts from this excerpt.]\n\nHere is the raw syllabus text excerpt:\n${syllabus.substring(0, 25000)}...`;
      } else {
        contentsPayload = `${promptInstructions}\n\nHere is the raw syllabus text:\n${syllabus}`;
      }

      const response = await callFreebuffResilient({
        contents: contentsPayload,
        config: {
          temperature: 0.2,
        },
      });

      const generatedNotes = response?.text || "";

      if (!generatedNotes.trim()) {
        throw new Error("AI returned an empty response.");
      }

      res.json({ notes: generatedNotes });
    } catch (error: any) {
      console.error("Notes generation error:", error);
      const text = syllabus.substring(0, 500);
      let keyTerms: string[] = text.match(/\b[A-Z][a-z]+(?: [A-Z][a-z]+)?\b/g) || [];
      keyTerms = [...new Set(keyTerms)].filter((t) => t.length > 4).slice(0, 5);

      const fallbackNotes = `# ${topicTitle || "Study Notes"}\n\n## 1. Core Theory & Concepts\n- **Fundamental Principle:** The core idea behind ${topicTitle || "this topic"} is to break down every problem into systematic inputs, transformations, and outputs.\n- **Application:** Always verify boundary conditions and check sanity after calculating.\n\n## 2. Key Terms & Definitions\n${(keyTerms || ["Core Theory", "Application"]).map((term: string) => `- **${term}:** Fundamental conceptual unit essential for exams and problem sets.`).join("\n")}\n\n## 3. High-Yield Exam Traps\n- Misinterpreting problem boundaries or mixing up formula constraints.\n- Skipping step-by-step verification during intermediate steps.\n\n## 4. Quick Self-Check\n1. *Can you explain this concept in 1 sentence without looking at notes?*\n2. *What is the most common mistake students make on this topic?*\n`;
      res.json({ notes: fallbackNotes });
    }
  });

  app.post(["/api/notes/analyze", "/api/notes/analyze/"], async (req, res) => {
    const userNotes = req.body.userNotes || req.body.content || req.body.notes || req.body.text || "";
    const { courseName, topicTitle, action } = req.body;

    if (!userNotes || typeof userNotes !== "string" || userNotes.trim().length === 0) {
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

      const response = await callFreebuffResilient({
        contents: prompt,
        config: {
          temperature: 0.3,
        },
      });

      const text = response?.text || "{}";
      const parsed = extractJsonFromFreebuffText(text);

      res.json(parsed);
    } catch (error: any) {
      console.warn("Notes analysis fallback triggered:", error?.message || error);
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

  app.post(["/api/youtube/recommend", "/api/youtube/recommend/"], async (req, res) => {
    const topicTitle = req.body.topicTitle || req.body.title || req.body.topic || "Academic Study";
    const { courseName, topicSummary, keyTerms } = req.body;

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

      const response = await callFreebuffResilient({
        contents: prompt,
        config: {
          temperature: 0.4,
        },
      });

      const text = response?.text || "[]";
      const items = extractJsonFromFreebuffText(text);

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
      console.warn("YouTube recommend fallback triggered:", error?.message || error);
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

  // AI Tutor Chat Endpoint (Migrated to Freebuff)
  app.post(["/api/tutor/chat", "/api/tutor/chat/"], async (req, res) => {
    try {
      const { messages, courseContext, teachingMode } = req.body;

      let contextInstruction = `You are a helpful, extremely knowledgeable, and encouraging academic AI tutor.
Your goal is to help students truly understand concepts, not just give them the answers.
Ask probing questions, use analogies, and break down complex topics. Keep responses conversational and concise.`;

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

      const formattedContents = (messages || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      if (formattedContents.length === 0) {
        formattedContents.push({
          role: "user",
          content: "Hey! What should we tackle first?",
        });
      }

      const response = await generateText({
        model: freebuffOpenAI("deepseek-v4.1-flash"),
        messages: [
          { role: "system", content: contextInstruction },
          ...formattedContents,
        ],
        temperature: 0.7,
      });

      const replyText = response.text || "My bad, brain lagged for a second. Ask me that again!";
      res.json({ reply: replyText });
    } catch (error: any) {
      console.warn("Tutor chat fallback triggered:", error?.message || error);
      res.json({
        reply: "⚠️ The AI tutor is experiencing a momentary spike in traffic right now. Give it 3-5 seconds and click ask again — let's lock back in!",
      });
    }
  });

  app.all("/api/*", (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Server API error:", err);
    if (res.headersSent) {
      return next(err);
    }
    if (req.originalUrl && req.originalUrl.startsWith("/api")) {
      return res.status(500).json({
        error: err?.message || "An unexpected server error occurred.",
      });
    }
    next(err);
  });

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
