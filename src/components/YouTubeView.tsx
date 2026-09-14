import React, { useState, useEffect } from "react";
import { useStudy } from "../context/StudyContext";
import { YouTubeRecommendation } from "../types";
import {
  Youtube,
  Search,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Loader2,
  BookOpen,
  ArrowRight,
  Tv
} from "lucide-react";

export const YouTubeView: React.FC = () => {
  const { activeCourse, activeTopic, setActiveTopicId } = useStudy();

  const [recommendations, setRecommendations] = useState<YouTubeRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allTopics = activeCourse?.modules.flatMap((m) => m.topics) || [];

  // Fetch recommendations
  const fetchRecommendations = async (topicTitle: string, topicSummary: string, keyTerms: string[]) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/youtube/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: activeCourse?.name,
          topicTitle,
          topicSummary,
          keyTerms,
        }),
      });

      if (!response.ok) throw new Error("Could not fetch YouTube recommendations.");
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTopic) {
      fetchRecommendations(activeTopic.title, activeTopic.summary, activeTopic.keyTerms);
    }
  }, [activeTopic?.id]);

  const handleCopyQuery = (query: string, id: string) => {
    navigator.clipboard.writeText(query);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="youtube-view-container" className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-red-600/20 text-red-400">
              <Youtube className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              YouTube Video Intelligence
            </h1>
          </div>
          <p className="text-xs text-zinc-400 max-w-xl">
            AI-curated search queries and channels tailored specifically to build intuition and solve problems for your active topic.
          </p>
        </div>

        {/* Topic Picker */}
        {allTopics.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-semibold">Topic:</span>
            <select
              id="select-youtube-topic"
              value={activeTopic?.id || ""}
              onChange={(e) => setActiveTopicId(e.target.value)}
              className="bg-zinc-900 text-zinc-200 text-xs font-semibold rounded-xl px-3 py-2 border border-zinc-800 focus:outline-none focus:border-red-500 cursor-pointer max-w-xs truncate"
            >
              {allTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active Topic Banner */}
      {activeTopic ? (
        <div className="my-6 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-red-400">
              Current Target Topic
            </span>
            <h2 className="text-base font-bold text-zinc-100 mt-0.5">{activeTopic.title}</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">{activeTopic.summary}</p>
          </div>

          <button
            id="btn-refresh-youtube-recs"
            onClick={() =>
              fetchRecommendations(activeTopic.title, activeTopic.summary, activeTopic.keyTerms)
            }
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-red-600/25 transition-all self-start sm:self-center shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Regenerate Recs</span>
          </button>
        </div>
      ) : (
        <div className="my-8 p-8 text-center bg-zinc-900/30 border border-zinc-800/40 rounded-3xl text-zinc-500 text-xs">
          Select a topic from your Syllabus to generate curated YouTube explainers.
        </div>
      )}

      {/* Recommendations Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <p className="text-xs font-medium">Scouting high-yield YouTube search queries & channels...</p>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => {
            const isCopied = copiedId === rec.id;
            return (
              <div
                key={rec.id}
                id={`yt-card-${rec.id}`}
                className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-red-500/40 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                        rec.difficultyLevel === "Visual Intuition"
                          ? "bg-indigo-500/10 text-indigo-400"
                          : rec.difficultyLevel === "Problem Solving"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : rec.difficultyLevel === "Deep Dive"
                          ? "bg-violet-500/10 text-violet-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {rec.difficultyLevel}
                    </span>

                    {rec.recommendedChannelStyle && (
                      <span className="text-[10px] text-zinc-400 truncate max-w-[170px] text-right font-medium">
                        📺 {rec.recommendedChannelStyle}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-zinc-100 group-hover:text-red-300 transition-colors">
                    {rec.title}
                  </h3>

                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {rec.whyRelevant}
                  </p>

                  <div className="mt-3 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-zinc-300 truncate">
                      "{rec.searchQuery}"
                    </span>
                    <button
                      id={`btn-copy-query-${rec.id}`}
                      onClick={() => handleCopyQuery(rec.searchQuery, rec.id)}
                      className="text-zinc-500 hover:text-zinc-200 p-1 shrink-0"
                      title="Copy search query"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-medium">Click to search on YouTube</span>
                  <a
                    id={`link-open-yt-${rec.id}`}
                    href={rec.youtubeSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold transition-all"
                  >
                    <span>Watch on YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-zinc-500 text-xs">
          Click "Regenerate Recs" to find high-yield visual explainers for this topic.
        </div>
      )}
    </div>
  );
};
