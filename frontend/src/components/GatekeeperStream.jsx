import React, { useState, useRef, useCallback } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaRobot,
  FaStream,
  FaSearch,
  FaFilter,
  FaSync,
  FaWifi,
  FaPlay,
  FaMicroscope,
} from "react-icons/fa";
import { format } from "date-fns";
import { useGatekeeperFeed } from "../hooks/useGatekeeperFeed";
import PRDetailModal from "./PRDetailModal";
import api from "../services/api";

const GatekeeperStream = ({ isDarkMode, repoId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPR, setSelectedPR] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingPR, setAnalyzingPR] = useState(null);
  const observerTarget = useRef(null);

  const { feed, loading, hasMore, loadMore, refresh, stats, isConnected } = useGatekeeperFeed({
    initialLoading: true,
    filters: {
      status: statusFilter,
      search: searchTerm,
      repoId,
    },
    enableRealtime: true,
  });

  const handleAnalyzeAll = async () => {
    if (!repoId || analyzing) return;
    setAnalyzing(true);
    try {
      await api.post("/tech-debt/analyze-all-prs", { repoId });
      await refresh();
    } catch (error) {
      console.error("Failed to analyze PRs:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzePR = async (prNumber, e) => {
    e.stopPropagation();
    if (!repoId || analyzingPR === prNumber) return;
    setAnalyzingPR(prNumber);
    try {
      await api.post("/tech-debt/analyze-pr", { repoId, prNumber });
      await refresh();
    } catch (error) {
      console.error(`Failed to analyze PR #${prNumber}:`, error);
    } finally {
      setAnalyzingPR(null);
    }
  };

  const lastPRRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerTarget.current) observerTarget.current.disconnect();

      observerTarget.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observerTarget.current.observe(node);
    },
    [loading, hasMore, loadMore],
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case "PASS":
        return <FaCheckCircle className="text-green-500" />;
      case "BLOCK":
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaExclamationTriangle className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PASS":
        return "border-l-green-500";
      case "BLOCK":
        return "border-l-red-500";
      default:
        return "border-l-yellow-500";
    }
  };

  return (
    <>
      <div
        className={`shadow rounded-lg p-6 h-full flex flex-col transition-colors ${isDarkMode ? "bg-slate-800 border border-slate-700" : "bg-white"}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2
              className={`text-xl font-bold flex items-center ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              <FaStream className="mr-2 text-indigo-600" /> Live Gatekeeper Feed
              {isConnected && (
                <FaWifi className="ml-2 text-green-500" size={14} title="Connected" />
              )}
            </h2>
            <div className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Pass Rate: <span className="font-semibold text-green-500">{stats.passRate}%</span>
              {" • "}
              <span className="text-green-500">{stats.passCount} passed</span>
              {" • "}
              <span className="text-red-500">{stats.blockCount} blocked</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAnalyzeAll}
              disabled={analyzing || !repoId}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium ${isDarkMode
                ? "bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-700"
                : "bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-gray-300"
                } ${analyzing ? "animate-pulse" : ""}`}
              title="Analyze all pending PRs"
            >
              <FaMicroscope size={14} />
              {analyzing ? "Analyzing..." : "Analyze All"}
            </button>
            <button
              onClick={refresh}
              disabled={loading || !repoId}
              className={`p-2 rounded-lg transition ${isDarkMode
                ? "bg-slate-700 hover:bg-slate-600 text-gray-300 disabled:bg-slate-800 disabled:text-slate-500"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:bg-gray-200 disabled:text-gray-400"
                } ${loading ? "animate-spin" : ""}`}
              title="Refresh feed"
            >
              <FaSync size={14} />
            </button>
          </div>
        </div>

        <div className="mb-4 space-y-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search PRs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!repoId}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDarkMode
                ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400 disabled:bg-slate-800 disabled:text-slate-500"
                : "bg-white border-gray-300 text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <FaFilter
              className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            />
            {["", "PASS", "BLOCK", "WARN"].map((status) => (
              <button
                key={status || "all"}
                onClick={() => setStatusFilter(status)}
                disabled={!repoId}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${statusFilter === status
                  ? "bg-indigo-600 text-white"
                  : isDarkMode
                    ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {status || "All"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {!repoId ? (
            <div className="text-center py-10">
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Connect a repository to view the live Gatekeeper feed.
              </p>
            </div>
          ) : loading && feed.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p
                className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Loading feed...
              </p>
            </div>
          ) : feed.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No PRs found
            </p>
          ) : (
            feed.map((pr, index) => (
              <div
                key={pr._id}
                ref={index === feed.length - 1 ? lastPRRef : null}
                onClick={() => setSelectedPR(pr)}
                className={`border-l-4 ${getStatusColor(pr.status)} rounded p-4 transition-all cursor-pointer hover:shadow-lg ${isDarkMode
                  ? "bg-slate-700 hover:bg-slate-600"
                  : "bg-gray-50 hover:bg-gray-100"
                  }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={`font-bold text-lg truncate ${isDarkMode ? "text-white" : "text-gray-800"}`}
                      >
                        #{pr.prNumber} {pr.title}
                      </span>
                      {getStatusIcon(pr.status)}
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${pr.status === "BLOCK"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : pr.status === "PASS"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                      >
                        {pr.status}
                      </span>
                    </div>
                    <p
                      className={`text-xs mb-3 flex items-center gap-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      <span>{pr.repoId}</span>
                      <span>•</span>
                      <span>@{pr.author}</span>
                      <span>•</span>
                      <span>
                        {pr.createdAt
                          ? format(new Date(pr.createdAt), "HH:mm - MMM d")
                          : "Now"}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right flex-shrink-0 bg-gray-50 dark:bg-slate-800 p-2 rounded">
                      <div
                        className={`text-2xl font-bold ${(pr.risk_score || pr.healthScore?.current || 0) > 70
                          ? "text-red-500"
                          : (pr.risk_score || pr.healthScore?.current || 0) > 40
                            ? "text-yellow-500"
                            : "text-green-500"
                          }`}
                      >
                        {pr.risk_score || pr.healthScore?.current || 0}
                      </div>
                      <div className="text-xs uppercase tracking-wider text-gray-400">
                        Risk
                      </div>
                    </div>
                    {pr.status === "PENDING" && (
                      <button
                        onClick={(e) => handleAnalyzePR(pr.prNumber, e)}
                        disabled={analyzingPR === pr.prNumber}
                        className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${analyzingPR === pr.prNumber
                          ? "bg-indigo-400 text-white animate-pulse"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white"
                          }`}
                      >
                        <FaPlay size={8} />
                        {analyzingPR === pr.prNumber ? "Analyzing..." : "Analyze"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 text-xs mt-2 flex-wrap">
                  <span
                    className={`px-2 py-1 rounded ${pr.analysisResults?.lint?.errors > 0
                      ? "bg-red-200 text-red-900"
                      : "bg-green-200 text-green-900"
                      }`}
                  >
                    Lint: {pr.analysisResults?.lint?.errors || 0} err
                  </span>
                  <span
                    className={`px-2 py-1 rounded ${pr.analysisResults?.complexity?.healthScoreDelta < 0
                      ? "bg-red-200 text-red-900"
                      : "bg-green-200 text-green-900"
                      }`}
                  >
                    Compl: {pr.analysisResults?.complexity?.healthScoreDelta > 0 ? "+" : ""}
                    {pr.analysisResults?.complexity?.healthScoreDelta || 0}
                  </span>
                  <span
                    className={`px-2 py-1 rounded ${pr.analysisResults?.aiScan?.verdict === "BAD"
                      ? "bg-red-200 text-red-900"
                      : "bg-green-200 text-green-900"
                      }`}
                  >
                    AI: {pr.analysisResults?.aiScan?.verdict || "N/A"}
                  </span>
                </div>

                {pr.analysisResults?.aiScan?.findings?.length > 0 && (
                  <div
                    className={`mt-3 p-2 text-xs rounded border flex gap-2 ${isDarkMode
                      ? "bg-slate-800 border-slate-600 text-gray-300"
                      : "bg-white border-gray-200 text-gray-600"
                      }`}
                  >
                    <FaRobot className="flex-shrink-0 text-indigo-400 mt-1" />
                    <div>
                      {pr.analysisResults.aiScan.findings[0]?.message || "Issues found."}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {loading && feed.length > 0 && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          )}
        </div>
      </div>

      {selectedPR && (
        <PRDetailModal
          pr={selectedPR}
          onClose={() => setSelectedPR(null)}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
};

export default GatekeeperStream;
