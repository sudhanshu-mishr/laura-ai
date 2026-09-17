import React, { useState, useEffect } from "react";
import { useStudy } from "../context/StudyContext";
import { YouTubeRecommendation } from "../types";
import {
  Youtube,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { apiRequest } from "../lib/api";

export const YouTubeView: React.FC = () => {
  const { activeCourse, activeTopic, setActiveTopicId } = useStudy();

  const [recommendations, setRecommendations] = useState<YouTubeRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allTopics = activeCourse?.modules.flatMap((m) => m.topics) || [];

  const fetchRecommendations = async (topicTitle: string, topicSummary: string, keyTerms: string[]) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ recommendations?: YouTubeRecommendation[] }>("/api/youtube/recommend", {
        method: "POST",
        body: JSON.stringify({
          courseName: activeCourse?.name,
          topicTitle,
          topicSummary,
          keyTerms,
        }),
      });

      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.warn("YouTube recommendation error:", err?.message || err);
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
    <div id="youtube-view-container" className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#E5E5E0] dark:border-[#30302E]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-1.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <Youtube className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1E1D] dark:text-[#ECECEC]">
              Video Intelligence
            </h1>
          </div>
          <p className="text-xs text-[#73726C] dark:text-[#B4B4B4] max-w-xl">
            AI-curated search queries and channels tailored specifically to build intuition and solve problems for your active topic.
          </p>
        </div>

        {/* Topic Picker */}
        {allTopics.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#73726C] dark:text-[#B4B4B4] font-semibold">Topic:</span>
            <select
              id="select-youtube-topic"
              value={activeTopic?.id || ""}
              onChange={(e) => setActiveTopicId(e.target.value)}
              className="bg-[#FFFFFF] dark:bg-[#262624] text-[#1F1E1D] dark:text-[#ECECEC] text-xs font-semibold rounded-xl px-3 py-2 border border-[#DDDDDD] dark:border-[#404040] focus:outline-hidden focus:border-[#D97757] cursor-pointer max-w-xs truncate"
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
        <div className="my-6 p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D97757]">
              Current Target Topic
            </span>
            <h2 className="text-base font-serif text-[#1F1E1D] dark:text-[#ECECEC] mt-0.5">{activeTopic.title}</h2>
            <p className="text-xs text-[#73726C] dark:text-[#B4B4B4] mt-1 max-w-xl">{activeTopic.summary}</p>
          </div>

          <button
            id="btn-refresh-youtube-recs"
            type="button"
            onClick={() =>
              fetchRecommendations(activeTopic.title, activeTopic.summary, activeTopic.keyTerms)
            }
            disabled={isLoading}
            className="px-4 py-2 bg-[#D97757] hover:bg-[#C6613F] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all self-start sm:self-center shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Regenerate Recommendations</span>
          </button>
        </div>
      ) : (
        <div className="my-8 p-8 text-center bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] rounded-3xl text-[#888888] text-xs">
          Select a topic from your Syllabus to generate curated YouTube explainers.
        </div>
      )}

      {/* Recommendations Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#888888]">
          <Loader2 className="w-8 h-8 animate-spin text-[#D97757]" />
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
                className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#262624] border border-[#E5E5E0] dark:border-[#30302E] hover:border-[#D97757]/50 transition-all flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                        rec.difficultyLevel === "Visual Intuition"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : rec.difficultyLevel === "Problem Solving"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : rec.difficultyLevel === "Deep Dive"
                          ? "bg-[#D97757]/10 text-[#D97757]"
                          : "bg-[#F0EEE6] dark:bg-[#30302E] text-[#73726C] dark:text-[#B4B4B4]"
                      }`}
                    >
                      {rec.difficultyLevel}
                    </span>

                    {rec.recommendedChannelStyle && (
                      <span className="text-[10px] text-[#888888] truncate max-w-[170px] text-right font-medium">
                        📺 {rec.recommendedChannelStyle}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-serif text-[#1F1E1D] dark:text-[#ECECEC] group-hover:text-[#D97757] transition-colors">
                    {rec.title}
                  </h3>

                  <p className="text-xs text-[#73726C] dark:text-[#B4B4B4] mt-2 leading-relaxed">
                    {rec.whyRelevant}
                  </p>

                  <div className="mt-3.5 p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#20201F] border border-[#E5E5E0] dark:border-[#30302E] flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-[#3D3D3A] dark:text-[#ECECEC] truncate">
                      "{rec.searchQuery}"
                    </span>
                    <button
                      id={`btn-copy-query-${rec.id}`}
                      type="button"
                      onClick={() => handleCopyQuery(rec.searchQuery, rec.id)}
                      className="text-[#888888] hover:text-[#1F1E1D] dark:hover:text-white p-1 shrink-0 cursor-pointer"
                      title="Copy search query"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0EEE6] dark:border-[#30302E] flex items-center justify-between">
                  <span className="text-[10px] text-[#888888] font-medium">Open in YouTube</span>
                  <a
                    id={`link-open-yt-${rec.id}`}
                    href={rec.youtubeSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] border border-[#D97757]/30 text-xs font-semibold transition-all"
                  >
                    <span>Watch Video</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-[#888888] text-xs">
          Click "Regenerate Recommendations" to find high-yield visual explainers for this topic.
        </div>
      )}
    </div>
  );
};
