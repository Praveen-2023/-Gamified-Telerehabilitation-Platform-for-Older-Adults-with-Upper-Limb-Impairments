import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { gameService } from "../../services/gameService";
import {
  ArrowLeft,
  TrendingUp,
  Target,
  Clock,
  Zap,
  Settings,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PatientAnalytics = () => {
  const { isDarkMode } = useAuth();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [selectedGameType, setSelectedGameType] = useState("type1");
  const [loading, setLoading] = useState(true);
  const [showLevelSpanModal, setShowLevelSpanModal] = useState(false);
  const [newLevelSpan, setNewLevelSpan] = useState(5);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const response = await gameService.getDetailedAnalytics(
        patientId,
        selectedGameType,
      );
      setAnalytics(response.analytics);
      setNewLevelSpan(response.analytics.user.currentlevelspan);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      alert("Failed to load patient analytics");
    } finally {
      setLoading(false);
    }
  }, [patientId, selectedGameType]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const updateLevelSpan = async () => {
    try {
      await gameService.updateLevelSpan(patientId, newLevelSpan);
      alert("Level span updated successfully!");
      setShowLevelSpanModal(false);
      loadAnalytics();
    } catch (error) {
      alert("Failed to update level span");
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-black" : "bg-gray-50"}`}
      >
        <div className="text-primary-500 text-xl animate-pulse font-bold">
          Loading analytics...
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-black" : "bg-gray-50"}`}
      >
        <div className="text-gray-500 text-xl font-bold">No data available</div>
      </div>
    );
  }

  // Prepare data for visualizations
  const sessions = analytics.sessions || [];
  const isArmFruitFetch = selectedGameType === "arm_fruit_fetch";
  const getSessionCounts = (session) => {
    if (isArmFruitFetch) {
      const attempts = session.attempts || session.metrics?.attempts || 0;
      const successes =
        session.successes || session.metrics?.successes || session.reps || 0;
      return {
        correct: successes,
        incorrect: Math.max(attempts - successes, 0),
        notDone: session.metrics?.timeouts || 0,
        total: attempts,
      };
    }

    return {
      correct: session.play.filter((p) => p.correct === 1).length,
      incorrect: session.play.filter((p) => p.correct === -1).length,
      notDone: session.play.filter((p) => p.correct === 0).length,
      total: session.play.length,
    };
  };

  // 1. Response Time Scatter Plot Data (from latest session)
  const latestSession =
    sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const scatterData =
    latestSession?.play?.map((entry, index) => ({
      attempt: index + 1,
      responsetime:
        entry.responsetime === -1
          ? analytics.user.currentlevelspan + 0.5
          : entry.responsetime,
      actualTime: entry.responsetime,
      correct: entry.correct,
      color:
        entry.correct === 1
          ? "#10b981"
          : entry.correct === -1
            ? "#ef4444"
            : "#f59e0b",
    })) || [];

  // 2. Session Performance Data
  const sessionPerformanceData = sessions.map((session, index) => {
    const { correct, incorrect, notDone, total } = getSessionCounts(session);

    return {
      name: `Session ${index + 1}`,
      date: new Date(session.time).toLocaleDateString(),
      correct,
      incorrect,
      notDone,
      total,
    };
  });

  // 3. Overall Distribution Pie Data
  const pieData = [
    {
      name: "Correct",
      value: analytics.overallStats.totalCorrect,
      color: "#10b981",
    },
    {
      name: "Incorrect",
      value: analytics.overallStats.totalIncorrect,
      color: "#ef4444",
    },
    {
      name: "Not Done",
      value: analytics.overallStats.totalNotDone,
      color: "#f59e0b",
    },
  ];

  // 4. Average Response Time Trend
  const avgResponseTimeTrend = sessions.map((session, index) => {
    const validResponses = isArmFruitFetch
      ? []
      : session.play.filter((p) => p.responsetime !== -1);
    const avgTime = isArmFruitFetch
      ? session.attempts > 0
        ? (session.durationSec / session.attempts).toFixed(2)
        : 0
      : validResponses.length > 0
        ? (
            validResponses.reduce((sum, p) => sum + p.responsetime, 0) /
            validResponses.length
          ).toFixed(2)
        : 0;

    return {
      session: `S${index + 1}`,
      avgResponseTime: parseFloat(avgTime),
      levelspan: session.levelspan,
    };
  });

  // Custom tooltip for scatter plot
  const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-xl border dark:border-gray-800">
          <p className="font-bold text-gray-800 dark:text-gray-100 mb-1">
            Attempt #{data.attempt}
          </p>
          <p className="text-sm">
            Time:{" "}
            <span className="font-semibold text-blue-600">
              {data.actualTime === -1 ? "Exceeded" : `${data.actualTime}s`}
            </span>
          </p>
          <p className="text-sm">
            Status:{" "}
            <span
              className={`font-semibold ${
                data.correct === 1
                  ? "text-green-600"
                  : data.correct === -1
                    ? "text-red-600"
                    : "text-yellow-600"
              }`}
            >
              {data.correct === 1
                ? "✓ Correct"
                : data.correct === -1
                  ? "✗ Incorrect"
                  : "⊘ Not Done"}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`min-h-screen p-4 md:p-6 transition-colors duration-500 ${isDarkMode ? "bg-black text-white" : "bg-gray-50 text-gray-800"}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-premium p-8 mb-8 border dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <button
              onClick={() => navigate("/doctor/dashboard")}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedGameType}
                onChange={(e) => setSelectedGameType(e.target.value)}
                className="px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 font-semibold"
              >
                <option value="type1">Piano Reaction Game</option>
                <option value="arm_fruit_fetch">Arm Fruit Fetch</option>
              </select>
              {!isArmFruitFetch && (
                <button
                  onClick={() => setShowLevelSpanModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold hover:from-primary-600 hover:to-secondary-600 transition shadow-lg"
                >
                  <Settings className="w-5 h-5" />
                  Update Level Span
                </button>
              )}
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
              Patient Analytics
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xl font-medium mb-3">
              {analytics.user.email}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                Viewing: {analytics.overallStats.gameName}
                {!isArmFruitFetch &&
                  ` | Level Span: ${analytics.user.currentlevelspan} seconds`}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-primary-100">Total Sessions</p>
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-4xl font-bold">
              {analytics.overallStats.totalSessions}
            </p>
          </div>

          <div className="bg-gradient-to-br from-success-500 to-success-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-100">Accuracy</p>
              <Target className="w-6 h-6" />
            </div>
            <p className="text-4xl font-bold">
              {analytics.overallStats.accuracy.toFixed(1)}%
            </p>
            <p className="text-xs text-green-100 mt-1">
              {analytics.overallStats.totalCorrect} correct /{" "}
              {analytics.overallStats.totalCorrect +
                analytics.overallStats.totalIncorrect}{" "}
              attempted
            </p>
          </div>

          <div className="bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-yellow-100">Avg Response</p>
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-4xl font-bold">
              {analytics.overallStats.avgResponseTime}s
            </p>
            <p className="text-xs text-yellow-100 mt-1">Valid responses only</p>
          </div>

          <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-purple-100">Total Score</p>
              <Zap className="w-6 h-6" />
            </div>
            <p className="text-4xl font-bold">{analytics.user.totalScore}</p>
            <p className="text-xs text-purple-100 mt-1">
              Level {analytics.user.level}
            </p>
          </div>
        </div>

        {/* Charts Row 1: Response Time Scatter + Session Performance */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Response Time Scatter Plot */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-premium p-8 border dark:border-gray-800">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">
              Response Time Analysis
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Latest Session - Individual response times
              <span className="block text-xs text-gray-500 mt-1">
                Green = Correct, Red = Incorrect, Yellow = Not Done (exceeded{" "}
                {analytics.user.currentlevelspan}s)
              </span>
            </p>
            {scatterData.length > 0 ? (
              <div className="h-[300px]">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        dataKey="attempt"
                        name="Attempt"
                        label={{
                          value: "Attempt Number",
                          position: "insideBottom",
                          offset: -10,
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="responsetime"
                        name="Time"
                        label={{
                          value: "Response Time (s)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                        domain={[0, analytics.user.currentlevelspan + 1]}
                      />
                      <Tooltip content={<CustomScatterTooltip />} />
                      <Scatter data={scatterData} fill="#8884d8">
                        {scatterData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No session data available
              </div>
            )}
          </div>

          {/* Session Performance Bar Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-premium p-8 border dark:border-gray-800">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">
              Session Performance
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Correct vs Incorrect vs Not Done per session
            </p>
            {sessionPerformanceData.length > 0 ? (
              <div className="h-[300px]">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sessionPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="correct" fill="#10b981" name="Correct" />
                      <Bar
                        dataKey="incorrect"
                        fill="#ef4444"
                        name="Incorrect"
                      />
                      <Bar dataKey="notDone" fill="#f59e0b" name="Not Done" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No session data available
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2: Distribution Pie + Response Time Trend */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Overall Distribution Pie Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-premium p-8 border dark:border-gray-800">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">
              Overall Distribution
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              All attempts across all sessions
            </p>
            <div className="h-[300px]">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Average Response Time Trend */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-premium p-8 border dark:border-gray-800">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">
              Response Time Trend
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Average response time per session
            </p>
            {avgResponseTimeTrend.length > 0 ? (
              <div className="h-[300px]">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={avgResponseTimeTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="session" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="avgResponseTime"
                        stroke="#667eea"
                        strokeWidth={3}
                        dot={{ fill: "#667eea", r: 6 }}
                        name="Avg Response Time (s)"
                      />
                      <Line
                        type="monotone"
                        dataKey="levelspan"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: "#f59e0b", r: 4 }}
                        name="Level Span (s)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Detailed Session Table */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-premium p-8 border dark:border-gray-800">
          <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-6 tracking-tight">
            Session History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100 dark:border-gray-800">
                  <th className="text-left py-4 px-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">
                    Date
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">
                    Level Span
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">
                    Attempts
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">
                    Correct
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">
                    Incorrect
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">
                    Not Done
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">
                    Accuracy
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions
                  .slice()
                  .reverse()
                  .map((session, index) => {
                    const { correct, incorrect, notDone, total } =
                      getSessionCounts(session);
                    const accuracy =
                      correct + incorrect > 0
                        ? ((correct / (correct + incorrect)) * 100).toFixed(1)
                        : 0;

                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-4 px-4 text-sm font-medium">
                          {new Date(session.time).toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-xs font-bold">
                            {session.levelspan}s
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-sm tracking-tight">
                          {total}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-bold">
                            {correct}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-bold">
                            {incorrect}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full text-xs font-bold">
                            {notDone}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-black text-primary-600 dark:text-primary-400">
                            {accuracy}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Level Span Update Modal */}
        {showLevelSpanModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border dark:border-gray-800">
              <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-4 tracking-tight">
                Update Level Span
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">
                Adjust how many seconds the patient has to respond to each
                letter.
              </p>
              <div className="mb-8">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                  Current Level Span:{" "}
                  <span className="text-primary-500 text-3xl ml-2">
                    {newLevelSpan}s
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={newLevelSpan}
                  onChange={(e) => setNewLevelSpan(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">
                  <span>1s (Harder)</span>
                  <span>10s (Easier)</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={updateLevelSpan}
                  className="flex-1 bg-primary-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-600 transition shadow-xl shadow-primary-500/20"
                >
                  Update
                </button>
                <button
                  onClick={() => {
                    setNewLevelSpan(analytics.user.currentlevelspan);
                    setShowLevelSpanModal(false);
                  }}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAnalytics;
