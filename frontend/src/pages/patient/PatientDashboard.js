import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
  ResponsiveContainer,
  Cell,
} from "recharts";

import {
  Bell,
  Calendar,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  User,
  Edit3,
  Search,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle,
  LifeBuoy,
  ShieldCheck,
  Activity,
  Plus,
  Shield,
  Clock,
  Play,
  TrendingUp,
  Target,
  Award,
  AlertCircle,
  Sun,
  Moon,
  Download,
} from "lucide-react";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { gameService } from "../../services/gameService";
import { userService } from "../../services/userService";
import { reminderService } from "../../services/reminderService";
import ChatPage from "../common/ChatPage";
import PatientAppointments from "./PatientAppointments";

export default function PatientDashboard({ userId }) {
  const { user, logout, isDarkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);

  // New state to manage the active section (for switching main content)
  const [activeSection, setActiveSection] = useState("Dashboard");

  // Sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Reminders and logic
  const [reminders] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await userService.getUserFullDetails(userId);
        if (data.success) setUserData(data.user);
        else console.error("Failed to load user info");
      } catch {
        console.error("Error fetching data");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await gameService.getBasicStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setUserData((prev) => ({
      ...prev,
      doctor: [doctor],
    }));
    setIsDoctorModalOpen(false);
  };

  // Function to change the active section
  const changeSection = (section) => {
    setActiveSection(section);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-black text-gray-100" : "bg-[#F4F7FE] text-gray-800"}`}
    >
      {/* Sidebar - fixed, collapsible */}
      <aside
        className={`fixed top-0 left-0 h-screen transition-all duration-300 z-30 flex flex-col justify-between overflow-hidden shadow-lg border-r
        ${isCollapsed ? "w-20" : "w-64"} 
        bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800`}
      >
        <div className="p-0 flex flex-col h-full uppercase">
          {/* Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-4 flex items-center justify-center border-b border-gray-200 dark:border-gray-800"
          >
            {isCollapsed ? (
              <ChevronRight
                size={18}
                className="text-gray-600 dark:text-gray-400 cursor-pointer"
              />
            ) : (
              <ChevronLeft
                size={18}
                className="text-gray-600 dark:text-gray-400 cursor-pointer"
              />
            )}
          </button>

          {/* Logo */}
          <div className={`p-6 flex items-center space-x-2 transition-opacity`}>
            <div className="bg-[#2B91D4] h-8 w-8 rounded-lg shadow-sm"></div>
            {!isCollapsed && (
              <span className="text-xl font-bold dark:text-white capitalize">
                Young Tempo
              </span>
            )}
          </div>

          {/* Profile */}

          {!isCollapsed && (
            <div
              className={`px-6 pt-6 pb-2 flex items-center space-x-3 transition-all ${isCollapsed ? "space-x-0 justify-center" : ""}`}
            >
              <img
                src="https://via.placeholder.com/40"
                alt="Profile"
                className="w-10 h-10 bg-black rounded-full flex-shrink-0"
              />
              <div>
                <h1 className="text-lg font-semibold text-[#2B91D4]">
                  {userData?.name || "Your Name"}
                </h1>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="mt-4 flex-1 overflow-y-auto px-2">
            <SidebarItem
              icon={<Home size={18} />}
              label="Dashboard"
              active={activeSection === "Dashboard"}
              onClick={() => changeSection("Dashboard")}
              collapsed={isCollapsed}
            />
            <SidebarItem
              icon={<Calendar size={18} />}
              label="Appointment"
              active={activeSection === "Appointment"}
              onClick={() => changeSection("Appointment")}
              collapsed={isCollapsed}
            />
            <SidebarItem
              icon={<FileText size={18} />}
              label="Record"
              active={activeSection === "Record"}
              onClick={() => changeSection("Record")}
              collapsed={isCollapsed}
            />
            <SidebarItem
              icon={<MessageSquare size={18} />}
              label="Chat"
              active={activeSection === "Chat"}
              onClick={() => changeSection("Chat")}
              collapsed={isCollapsed}
            />
            <SidebarItem
              icon={<ClipboardList size={18} />}
              label="Calendar"
              active={activeSection === "Calendar"}
              onClick={() => changeSection("Calendar")}
              collapsed={isCollapsed}
            />
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="border-t dark:border-gray-800 py-4 pt-5 space-y-2 px-2">
          <SidebarItem
            icon={<LifeBuoy size={18} />}
            label="Help Center"
            active={activeSection === "Help Center"}
            onClick={() => changeSection("Help Center")}
            collapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Settings size={18} />}
            label="Settings"
            active={activeSection === "Settings"}
            onClick={() => changeSection("Settings")}
            collapsed={isCollapsed}
          />
        </div>
      </aside>

      {/* Main content - scrollable, offset by sidebar */}
      <div
        className={`h-screen ${activeSection === "Chat" ? "overflow-hidden" : "overflow-y-auto"} px-10 flex-1 transition-all duration-300 fade-in
        ${isCollapsed ? "ml-20" : "ml-64"} 
        bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100`}
      >
        {activeSection !== "Chat" && (
          <TopBar
            activeSection={activeSection}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            handleLogout={handleLogout}
          />
        )}
        <main
          className={`flex-1 ${activeSection === "Chat" ? "flex flex-col justify-center" : ""}`}
        >
          {activeSection === "Dashboard" && (
            <DashboardContent
              userData={userData}
              user={user}
              stats={stats}
              setIsDoctorModalOpen={setIsDoctorModalOpen}
              navigate={navigate}
              userId={userId}
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
            />
          )}
          {activeSection === "Appointment" && (
            <PatientAppointments isDarkMode={isDarkMode} />
          )}
          {activeSection === "Record" && (
            <RecordContent isDarkMode={isDarkMode} />
          )}
          {activeSection === "Chat" && <ChatPage isDarkMode={isDarkMode} />}
          {activeSection === "Calendar" && (
            <CalendarContent
              isDarkMode={isDarkMode}
              reminders={reminders}
              userData={userData}
            />
          )}
          {activeSection === "Settings" && (
            <SettingsContent
              userData={userData}
              navigate={navigate}
              isDarkMode={isDarkMode}
            />
          )}
          {activeSection === "Help Center" && (
            <HelpCenterContent
              handleLogout={handleLogout}
              isDarkMode={isDarkMode}
            />
          )}
        </main>
      </div>

      {/* Doctor Selection Modal */}
      {isDoctorModalOpen && (
        <DoctorModal
          doctors={userData?.doctor || []}
          onClose={() => setIsDoctorModalOpen(false)}
          onSelect={handleDoctorSelect}
        />
      )}
    </div>
  );
}

/* Components */

// Helper to calculate consecutive days streak
const calculateStreak = (dailyData, referenceDate) => {
  const toDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  let streak = 0;
  let currentDate = new Date(referenceDate);
  currentDate.setHours(0, 0, 0, 0);

  const todayStr = toDateStr(currentDate);
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateStr(yesterday);

  const hasActivityToday = dailyData[todayStr] && dailyData[todayStr].total > 0;
  const hasActivityYesterday =
    dailyData[yesterdayStr] && dailyData[yesterdayStr].total > 0;

  if (!hasActivityToday && !hasActivityYesterday) return 0;

  // Start checking from today if played, else start from yesterday
  let checkDate = new Date(hasActivityToday ? currentDate : yesterday);

  while (true) {
    const dStr = toDateStr(checkDate);
    if (dailyData[dStr] && dailyData[dStr].total > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

// Updated SidebarItem to use the new design system classes
// Updated SidebarItem for dark mode
const SidebarItem = ({ icon, label, active, onClick, collapsed }) => (
  <div
    className={`nav-item ${active ? "nav-item-active" : "nav-item-inactive"} ${collapsed ? "justify-center mx-0 px-0" : ""}`}
    onClick={onClick}
  >
    <span
      className={`${active ? "text-white" : "text-gray-500 dark:text-gray-400"} flex-shrink-0 transition-colors`}
    >
      {icon}
    </span>
    {!collapsed && (
      <span className="text-sm font-medium whitespace-nowrap">{label}</span>
    )}
  </div>
);

// Dark Mode Toggle Component
const DarkModeToggle = ({ isDarkMode, setIsDarkMode, collapsed }) => (
  <div
    className={`nav-item nav-item-inactive ${collapsed ? "justify-center mx-0 px-0" : ""}`}
    onClick={() => setIsDarkMode(!isDarkMode)}
  >
    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 transition-colors">
      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
    </span>
    {!collapsed && (
      <span className="text-sm font-medium whitespace-nowrap">
        {isDarkMode ? "Light Mode" : "Dark Mode"}
      </span>
    )}
  </div>
);

// Extracted Dashboard content into its own component
const DashboardContent = ({
  userData,
  user,
  stats,
  setIsDoctorModalOpen,
  navigate,
  userId,
  isDarkMode,
  toggleDarkMode,
}) => {
  const [selectedSession, setSelectedSession] = useState(0);
  const [reminders, setReminders] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [editingReminder, setEditingReminder] = useState(null);

  // Computations for charts - moved inside DashboardContent
  const recentSessions = useMemo(
    () => stats?.recentSessions || (stats?.play ? [stats] : []),
    [stats],
  );
  const today = useMemo(() => new Date(), []); // Stable reference for calculations

  const totals = useMemo(
    () => ({
      correct: recentSessions.reduce((sum, s) => sum + (s.correct || 0), 0),
      incorrect: recentSessions.reduce((sum, s) => sum + (s.incorrect || 0), 0),
      notDone: recentSessions.reduce((sum, s) => sum + (s.notDone || 0), 0),
      responsetime: recentSessions.reduce(
        (sum, s) => sum + (s.responsetime || 0),
        0,
      ),
    }),
    [recentSessions],
  );

  const barData = useMemo(
    () => [
      { name: "Correct", value: totals.correct },
      { name: "Incorrect", value: totals.incorrect },
      { name: "Not Done", value: totals.notDone },
    ],
    [totals],
  );

  // Daily data aggregation
  const dailyData = useMemo(() => {
    const data = {};
    recentSessions.forEach((session) => {
      const date = new Date(session.time);
      const dateStr = date.toISOString().split("T")[0];
      if (!data[dateStr]) {
        data[dateStr] = {
          correct: 0,
          incorrect: 0,
          notDone: 0,
          total: 0,
          totalResponseTime: 0,
        };
      }
      data[dateStr].correct += session.correct || 0;
      data[dateStr].incorrect += session.incorrect || 0;
      data[dateStr].notDone += session.notDone || 0;
      data[dateStr].total +=
        session.total || session.correct + session.incorrect + session.notDone;
      data[dateStr].totalResponseTime += session.responsetime || 0;
    });
    return data;
  }, [recentSessions]);

  // Last 7 chronological sessions ascending for charts
  const last7ChronAsc = [...recentSessions]
    .sort((a, b) => new Date(a.time) - new Date(b.time))
    .slice(-7);

  // Descending for select (most recent first)
  const last7ChronDesc = [...last7ChronAsc].reverse();

  // Accuracy and Response Time data for last 7 games (using asc for chronological order)
  const accuracyData = last7ChronAsc.map((session) => {
    const total = (session.correct || 0) + (session.incorrect || 0);
    const accuracy = total > 0 ? ((session.correct || 0) / total) * 100 : 0;
    const avgResponseTime =
      (session.total || total) > 0
        ? (session.responsetime || 0) / (session.total || total)
        : 2.5;

    return {
      date: new Date(session.time).toLocaleDateString(),
      accuracy,
      responseTime: avgResponseTime,
    };
  });

  // Average accuracy over last 7 sessions
  const avgAcc7Sessions =
    last7ChronAsc.length > 0
      ? last7ChronAsc.reduce((sum, s) => {
          const total = (s.correct || 0) + (s.incorrect || 0);
          return sum + (total > 0 ? ((s.correct || 0) / total) * 100 : 0);
        }, 0) / last7ChronAsc.length
      : 0;

  // Average response time over last 7 games
  const avgResponseTime7Games =
    last7ChronAsc.reduce((sum, session) => {
      const total =
        session.total ||
        (session.correct || 0) +
          (session.incorrect || 0) +
          (session.notDone || 0);
      const avg = total > 0 ? (session.responsetime || 0) / total : 2.5;
      return sum + avg;
    }, 0) / last7ChronAsc.length;

  // Counts data for last 7 games (using asc)
  const last7Data = last7ChronAsc.map((session) => ({
    date: new Date(session.time).toLocaleDateString(),
    correct: session.correct || 0,
    incorrect: session.incorrect || 0,
    notDone: session.notDone || 0,
  }));

  // Daily totals data for last 7 days
  const last7Days = Array.from(
    { length: 7 },
    (_, i) => new Date(today.getTime() - i * 24 * 60 * 60 * 1000),
  );
  const dailyTotalsData = last7Days
    .map((day) => {
      const dateStr = day.toISOString().split("T")[0];
      const dayData = dailyData[dateStr] || {
        correct: 0,
        incorrect: 0,
        notDone: 0,
      };
      return {
        date: day.toLocaleDateString(),
        correct: dayData.correct,
        incorrect: dayData.incorrect,
        notDone: dayData.notDone,
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Ensure ascending order

  // Streak calculation
  const currentStreak = useMemo(
    () => calculateStreak(dailyData, today),
    [dailyData, today],
  );

  // Streak data for last 15 days - for visualization
  const last15Days = Array.from({ length: 15 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return d;
  });
  const streakData = last15Days.map((day) => {
    const dateStr = day.toISOString().split("T")[0];
    const attempts = dailyData[dateStr] ? dailyData[dateStr].total : 0;
    return {
      date: day.toLocaleDateString(),
      attempts,
    };
  });

  // Selected session detailed data (using desc, index 0 is most recent)
  const selectedSessionData = last7ChronDesc[selectedSession];
  const attemptData = selectedSessionData?.session.play
    ? selectedSessionData.session.play.map((p, i) => ({
        attempt: i + 1,
        responseTime: p.responsetime,
        correct: p.correct,
      }))
    : [];

  // Custom dot renderer for colored nodes based on correctness
  const renderDot = (props) => {
    const { cx, cy, payload } = props;
    let fillColor = "black";
    if (payload.correct === 1) {
      fillColor = "green";
    } else if (payload.correct === -1) {
      fillColor = "red";
    } else {
      fillColor = isDarkMode ? "#374151" : "#E5E7EB";
    }
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={fillColor}
        stroke={fillColor}
        strokeWidth={2}
      />
    );
  };

  // Custom tooltip formatter to include status
  const customTooltip = (props) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const status =
        data.correct === 1
          ? "Correct"
          : data.correct === -1
            ? "Incorrect"
            : "Not Done";
      return (
        <div className="bg-white dark:bg-gray-900 p-3 border dark:border-gray-800 rounded-xl shadow-xl">
          <p className="font-bold dark:text-white mb-1">
            Attempt {data.attempt}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Response Time: {data.responseTime}s
          </p>
          <p className="text-sm font-medium mt-1">
            Status:{" "}
            <span
              style={{
                color:
                  data.correct === 1
                    ? "#10B981"
                    : data.correct === -1
                      ? "#EF4444"
                      : isDarkMode
                        ? "#94A3B8"
                        : "black",
              }}
            >
              {status}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  console.log(selectedSessionData);

  // Fetch reminders
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await reminderService.listForPatient(userId);
        setReminders(res.reminders || []);
      } catch (err) {
        console.error("Failed to fetch reminders:", err);
      }
    };
    fetchReminders();
  }, [userId]);

  // Filter reminders based on period
  const filteredReminders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    let start = todayStr;
    let end;

    if (selectedPeriod === "today") {
      end = todayStr;
    } else if (selectedPeriod === "week") {
      const dayOfWeek = now.getDay(); // 0 = Sunday
      const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + daysToSunday);
      end = endOfWeek.toISOString().split("T")[0];
    } else {
      // month
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end = endOfMonth.toISOString().split("T")[0];
    }

    const filtered = reminders
      .filter((r) => {
        const rDateStr = new Date(r.date).toISOString().split("T")[0];
        return rDateStr >= start && rDateStr <= end;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return filtered;
  }, [reminders, selectedPeriod]);

  const activeReminders = filteredReminders.filter(
    (r) => r.status !== "completed",
  );
  const completedReminders = filteredReminders.filter(
    (r) => r.status === "completed",
  );
  const totalReminders = filteredReminders.length;
  const percentage =
    totalReminders > 0
      ? Math.round((completedReminders.length / totalReminders) * 100)
      : 0;

  const handleSaveEdit = useCallback(
    async (updatedForm) => {
      if (!editingReminder) return;
      try {
        await reminderService.update(editingReminder._id, updatedForm);
        const res = await reminderService.listForPatient(userId);
        setReminders(res.reminders || []);
        setEditingReminder(null);
      } catch (err) {
        console.error("Failed to update reminder:", err);
      }
    },
    [editingReminder, userId],
  );

  const handleMarkDone = useCallback(
    async (reminderId) => {
      try {
        await reminderService.complete(reminderId);
        const res = await reminderService.listForPatient(userId);
        setReminders(res.reminders || []);
      } catch (err) {
        console.error("Failed to complete reminder:", err);
      }
    },
    [userId],
  );

  return (
    <div className="fade-in">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 capitalize">
            Hello, {userData?.name || "Your Name"}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">
            How are you feeling today?
          </p>
        </div>
        {/* Right side: Streak, Theme, Search, Notifications */}
        <div className="flex items-center gap-3">
          {/* Streak Indicator - Moved from dashboard content to navbar for better visibility */}
          <div className="hidden lg:flex px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-2xl items-center gap-2 border border-transparent dark:border-gray-700/30 group hover:border-orange-500/20 transition-all cursor-pointer shadow-sm">
            <span className="text-xl animate-pulse group-hover:animate-none">
              🔥
            </span>
            <div className="flex flex-col">
              <span
                className={`text-base font-black leading-none ${currentStreak > 0 ? (streakData.hasActivityToday ? "text-orange-600 dark:text-orange-400" : "text-gray-400") : "text-gray-300"}`}
              >
                {currentStreak}
              </span>
              <span className="text-[8px] text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest">
                {streakData.hasActivityToday ? "Active" : "Streak"}
              </span>
            </div>
          </div>

          {/* <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors size-4" />
            <input 
              type="text" 
              placeholder="Global search..." 
              className="pl-12 pr-6 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none w-full md:w-64 dark:text-gray-200 transition-all font-medium text-sm"
            />
          </div> */}

          {/* <DarkModeToggle 
            isDarkMode={isDarkMode} 
            setIsDarkMode={() => {}} // Controlled by context
            collapsed={false} 
            toggleDarkMode={toggleDarkMode}
          />

          <button className="p-2.5 rounded-2xl bg-white dark:bg-gray-900 shadow-premium border border-transparent hover:border-primary-100 transition-all text-gray-400 hover:text-primary-500">
            <Bell size={18} />
          </button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor & Data & Stats & Recent Sessions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoCard
                title="Your Doctor"
                content={
                  <div className="flex justify-between">
                    <div className="flex space-x-2 items-center">
                      <img
                        src="https://via.placeholder.com/40"
                        className="w-10 h-10 rounded-full bg-black ring-2 ring-primary-100 dark:ring-primary-900"
                        alt="Doctor"
                      />
                      <div>
                        <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                          {userData?.doctor[0]?.doctorName || "Your Doctor"}
                        </p>
                        <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                          {userData?.doctor[0]?.doctorDegree || "Doctor Degree"}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <div
                        className="bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center p-2 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors cursor-pointer text-primary-500 dark:text-primary-400"
                        onClick={() => navigate("/chat")}
                      >
                        <MessageSquare size={18} />
                      </div>
                      <a
                        href={`tel:${userData?.doctor[0]?.doctorphone}`}
                        className="bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center p-2 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors text-primary-500 dark:text-primary-400"
                      >
                        <PhoneCall size={18} />
                      </a>
                    </div>
                  </div>
                }
                onChange={() => setIsDoctorModalOpen(true)}
              />
              <InfoCard
                title="Your data"
                content={
                  <div className="flex justify-between text-sm">
                    <div className="text-center">
                      <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        Weight:
                      </p>
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {userData?.patientDetails.weight || "NA"} kg
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        Height:
                      </p>
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {userData?.patientDetails.height || "NA"} cm
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        Blood:
                      </p>
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {userData?.patientDetails.blood?.toUpperCase() || "NA"}
                      </p>
                    </div>
                  </div>
                }
                onChange={() => navigate("/patient/setting")}
              />
            </div>

            {/* Streak Balls - Added at the top, just the balls, no text */}
            {/* <div className="w-full flex justify-center py-4">
              <div className="flex space-x-0.5">
                {streakData.map((day, index) => {
                  let bgColor;
                  if (day.attempts === 0) {
                    bgColor = '#EF4444'; // red for no game played
                  } else {
                    const intensity = Math.min(day.attempts / 30, 1);
                    const lightness = 80 - intensity * 60; // light green (80%) to dark green (20%)
                    bgColor = `hsl(152, 69%, ${lightness}%)`;
                  }
                  return (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-full transition-colors"
                      style={{ backgroundColor: bgColor }}
                      title={`${day.date}: ${day.attempts} attempts`}
                    />
                  );
                })}
              </div>
            </div> */}

            {/* Middle Section - Stats Cards */}
            <div className="premium-card p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                Performance Overview
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-2xl p-5 border border-primary-50 dark:border-primary-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                      Level
                    </p>
                    <Award className="w-4 h-4 text-primary-500" />
                  </div>
                  <p className="text-3xl font-black text-primary-900 dark:text-primary-100">
                    {stats?.level || 1}
                  </p>
                </div>

                <div className="bg-secondary-50/50 dark:bg-secondary-900/10 rounded-2xl p-5 border border-secondary-50 dark:border-secondary-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                      Total Score
                    </p>
                    <Target className="w-4 h-4 text-secondary-500" />
                  </div>
                  <p className="text-3xl font-black text-secondary-900 dark:text-secondary-100">
                    {stats?.totalScore || 0}
                  </p>
                </div>

                <div className="bg-green-50/50 dark:bg-green-900/10 rounded-2xl p-5 border border-green-50 dark:border-green-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                      Sessions
                    </p>
                    <Play className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-3xl font-black text-green-900 dark:text-green-100">
                    {recentSessions.length}
                  </p>
                </div>

                <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl p-5 border border-orange-50 dark:border-orange-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                      Response
                    </p>
                    <Clock className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-black text-orange-900 dark:text-orange-100">
                      {stats?.currentlevelspan || stats?.levelspan || 5}
                    </p>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                      s
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sessions - Charts */}
            <div className="space-y-6">
              <div className="premium-card p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                  Recent Sessions
                </h2>
                {recentSessions.length > 0 ? (
                  <div className="space-y-6">
                    {/* Accuracy & Response Time Line Graph for Last 7 Games with Averages */}
                    <div className="bg-gray-50 dark:bg-gray-800/20 rounded-2xl p-6 border dark:border-gray-800">
                      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4 tracking-tight">
                        Accuracy & Avg Response Time: Last 7 Games
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={accuracyData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={isDarkMode ? "#374151" : "#E5E7EB"}
                            />
                            <XAxis
                              dataKey="date"
                              tick={{
                                fill: isDarkMode ? "#9CA3AF" : "#4B5563",
                              }}
                            />
                            <YAxis
                              yAxisId="left"
                              orientation="left"
                              unit="%"
                              tick={{
                                fill: isDarkMode ? "#9CA3AF" : "#4B5563",
                              }}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              unit="s"
                              tick={{
                                fill: isDarkMode ? "#9CA3AF" : "#4B5563",
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: isDarkMode
                                  ? "#111827"
                                  : "#FFFFFF",
                                borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                                color: isDarkMode ? "#F3F4F6" : "#111827",
                                borderRadius: "12px",
                              }}
                              formatter={(value, name) => {
                                if (name === "accuracy")
                                  return [`${value}%`, "Accuracy"];
                                if (name === "responseTime")
                                  return [`${value}s`, "Avg Response Time"];
                                return [value, name];
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="accuracy"
                              stroke="#3B82F6"
                              yAxisId="left"
                              strokeWidth={3}
                              dot={{ r: 4, fill: "#3B82F6" }}
                              activeDot={{ r: 6 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="responseTime"
                              stroke="#EC4899"
                              yAxisId="right"
                              strokeWidth={3}
                              dot={{ r: 4, fill: "#EC4899" }}
                              activeDot={{ r: 6 }}
                            />
                            <ReferenceLine
                              y={avgAcc7Sessions}
                              label={{
                                value: `${avgAcc7Sessions.toFixed(1)}%`,
                                position: "middle",
                                fill: "#3B82F6",
                                fontWeight: "bold",
                                fontSize: 10,
                              }}
                              stroke="#3B82F6"
                              strokeDasharray="5 5"
                              yAxisId="left"
                            />
                            <ReferenceLine
                              y={avgResponseTime7Games}
                              label={{
                                value: `${avgResponseTime7Games.toFixed(1)}s`,
                                position: "top",
                                fill: "#EC4899",
                                fontWeight: "bold",
                                fontSize: 10,
                              }}
                              stroke="#EC4899"
                              strokeDasharray="5 5"
                              yAxisId="right"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Grid for Counts Line Graphs */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      {/* Last 7 Games Counts */}
                      <div className="bg-primary-50/20 dark:bg-primary-900/10 rounded-2xl p-6 border border-primary-50/50 dark:border-primary-900/20">
                        <h3 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-6 flex items-center gap-2 tracking-tight">
                          <Activity className="w-4 h-4 text-primary-500" />
                          Performance Metrics
                        </h3>
                        <div className="h-64">
                          {isMounted && (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={last7Data}
                                margin={{
                                  top: 10,
                                  right: 10,
                                  left: -20,
                                  bottom: 0,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  vertical={false}
                                  stroke={isDarkMode ? "#374151" : "#E2E8F0"}
                                />
                                <XAxis
                                  dataKey="date"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{
                                    fontSize: 10,
                                    fill: isDarkMode ? "#9CA3AF" : "#94A3B8",
                                  }}
                                />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{
                                    fontSize: 10,
                                    fill: isDarkMode ? "#9CA3AF" : "#94A3B8",
                                  }}
                                />
                                <Tooltip
                                  contentStyle={{
                                    borderRadius: "12px",
                                    border: "none",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    backgroundColor: isDarkMode
                                      ? "#111827"
                                      : "#FFFFFF",
                                    color: isDarkMode ? "#F3F4F6" : "#111827",
                                  }}
                                />
                                <Legend iconType="circle" />
                                <Line
                                  type="monotone"
                                  dataKey="correct"
                                  stroke="#10B981"
                                  strokeWidth={3}
                                  dot={{ r: 3, fill: "#10B981" }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="incorrect"
                                  stroke="#EF4444"
                                  strokeWidth={3}
                                  dot={{ r: 3, fill: "#EF4444" }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="notDone"
                                  stroke="#F59E0B"
                                  strokeWidth={3}
                                  dot={{ r: 3, fill: "#F59E0B" }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>

                      {/* Daily Counts Last 7 Days */}
                      <div className="bg-secondary-50/20 dark:bg-secondary-900/10 rounded-2xl p-6 border border-secondary-50/50 dark:border-secondary-900/20">
                        <h3 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-6 flex items-center gap-2 tracking-tight">
                          <TrendingUp className="w-4 h-4 text-secondary-500" />
                          Daily Progress
                        </h3>
                        <div className="h-64">
                          {isMounted && (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={dailyTotalsData}
                                margin={{
                                  top: 10,
                                  right: 10,
                                  left: -20,
                                  bottom: 0,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  vertical={false}
                                  stroke={isDarkMode ? "#374151" : "#E2E8F0"}
                                />
                                <XAxis
                                  dataKey="date"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{
                                    fontSize: 10,
                                    fill: isDarkMode ? "#9CA3AF" : "#94A3B8",
                                  }}
                                />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{
                                    fontSize: 10,
                                    fill: isDarkMode ? "#9CA3AF" : "#94A3B8",
                                  }}
                                />
                                <Tooltip
                                  contentStyle={{
                                    borderRadius: "12px",
                                    border: "none",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    backgroundColor: isDarkMode
                                      ? "#111827"
                                      : "#FFFFFF",
                                    color: isDarkMode ? "#F3F4F6" : "#111827",
                                  }}
                                />
                                <Legend iconType="circle" />
                                <Line
                                  type="monotone"
                                  dataKey="correct"
                                  stroke="#10B981"
                                  strokeWidth={3}
                                  dot={{ r: 3, fill: "#10B981" }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="incorrect"
                                  stroke="#EF4444"
                                  strokeWidth={3}
                                  dot={{ r: 3, fill: "#EF4444" }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="notDone"
                                  stroke="#F59E0B"
                                  strokeWidth={3}
                                  dot={{ r: 3, fill: "#F59E0B" }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Last Game Plot */}
                    <div className="bg-gray-50 dark:bg-gray-800/20 rounded-2xl p-6 border dark:border-gray-800">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 tracking-tight">
                          Detailed Plot: Last Game Performance
                        </h3>
                        <select
                          className="p-2 border dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500/50"
                          value={selectedSession}
                          onChange={(e) =>
                            setSelectedSession(parseInt(e.target.value))
                          }
                        >
                          {last7ChronDesc.map((s, i) => (
                            <option key={i} value={i}>
                              Game {i + 1} (
                              {new Date(s.time).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      </div>
                      {attemptData.length > 0 ? (
                        <div className="h-64">
                          {isMounted && (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={attemptData}
                                margin={{
                                  top: 20,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="attempt" />
                                <YAxis unit="s" />
                                <Tooltip content={customTooltip} />
                                <Line
                                  type="monotone"
                                  dataKey="responseTime"
                                  stroke="#82ca9d"
                                  strokeWidth={2}
                                  dot={renderDot}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center">
                          No detailed play data available for this session.
                        </p>
                      )}
                    </div>

                    {/* Performance Indicator */}
                    <div className="mt-8 p-6 bg-primary-50/50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/20 flex items-start gap-4">
                      <div className="bg-white dark:bg-gray-800 p-2.5 rounded-xl shadow-sm">
                        <AlertCircle className="w-6 h-6 text-primary-500" />
                      </div>
                      <div>
                        <p className="text-sm text-primary-900 dark:text-primary-100 font-bold mb-1">
                          💡 Pro Tip for Better Results
                        </p>
                        <p className="text-sm text-primary-700 dark:text-primary-300 leading-relaxed font-medium">
                          Consistency is key! Try to maintain your streak by
                          completing at least one session daily. Aim for a
                          response time under{" "}
                          <span className="font-bold text-primary-900 dark:text-primary-100">
                            {stats?.currentlevelspan || stats?.levelspan || 5}s
                          </span>{" "}
                          to maximize your score.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="mb-6">
                      <Play className="w-24 h-24 text-gray-300 mx-auto" />
                    </div>
                    <p className="text-xl text-gray-400 mb-4 font-semibold">
                      No sessions yet!
                    </p>
                    <p className="text-gray-500 mb-6">
                      Start playing to see your progress and statistics
                    </p>
                    <button
                      onClick={() => navigate("/game")}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition shadow-lg font-semibold text-lg"
                    >
                      <Play className="w-6 h-6" />
                      Play Your First Game
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reminders & Play Button & Total Counts Bar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="premium-card p-5 mb-4">
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold dark:text-white uppercase tracking-wider text-xs">
                Remind me
              </p>
              <div className="flex items-center gap-1">
                <select
                  className="text-sm text-[#6FD2EE] bg-transparent border-none focus:outline-none cursor-pointer font-bold"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
              </div>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300 shadow-sm shadow-primary-200 dark:shadow-none"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            <div className="space-y-1 rounded-2xl bg-gray-50 dark:bg-gray-800/40 p-1.5 max-h-48 overflow-y-auto border border-transparent dark:border-gray-800/50">
              {activeReminders.map((r) => (
                <ReminderItem
                  key={r._id}
                  reminder={r}
                  onEdit={() => setEditingReminder(r)}
                  onMarkDone={handleMarkDone}
                />
              ))}
              {completedReminders.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-2">
                    Completed
                  </p>
                  {completedReminders.map((r) => (
                    <ReminderItem
                      key={r._id}
                      reminder={r}
                      onEdit={() => setEditingReminder(r)}
                      isCompleted
                    />
                  ))}
                </div>
              )}
              {activeReminders.length === 0 &&
                completedReminders.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4 font-medium italic">
                    No reminders scheduled
                  </p>
                )}
            </div>
          </div>

          <button
            onClick={() => navigate("/game3")}
            className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-primary-200 dark:hover:shadow-none transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            // className="w-full flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-900 border-2 border-primary-50 dark:border-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl font-bold text-lg hover:border-primary-100 dark:hover:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-5 h-5 fill-current" />
            Shape Tracing
          </button>

          <button
            onClick={() => navigate("/game4")}
            className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-primary-200 dark:hover:shadow-none transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            // className="w-full flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-900 border-2 border-primary-50 dark:border-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl font-bold text-lg hover:border-primary-100 dark:hover:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-5 h-5 fill-current" />
            Arm Fruit Fetch
          </button>

          <button
            onClick={() => navigate("/game")}
            className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-primary-200 dark:hover:shadow-none transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            // className="w-full flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-900 border-2 border-primary-50 dark:border-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl font-bold text-lg hover:border-primary-100 dark:hover:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-5 h-5 fill-current" />
            Piano Reaction Game
          </button>

          {/* Total Counts Bar Chart - UPDATED with colors */}
          <div className="premium-card p-6 mb-4">
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-6 flex items-center gap-2 justify-center tracking-tight">
              <Award className="w-4 h-4 text-primary-500" />
              Total Achievements
            </h3>
            <div className="h-64 flex items-center justify-center">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 10,
                        fill: isDarkMode ? "#9CA3AF" : "#94A3B8",
                      }}
                    />
                    <YAxis hide={true} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        backgroundColor: isDarkMode ? "#111827" : "#FFFFFF",
                        color: isDarkMode ? "#F3F4F6" : "#111827",
                      }}
                      formatter={(value) => [value, "Count"]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, index) => {
                        let color = isDarkMode ? "#374151" : "#E2E8F0"; // fallback
                        if (entry.name === "Correct") color = "#10B981";
                        else if (entry.name === "Incorrect") color = "#EF4444";
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Reminder Modal */}
      {editingReminder && (
        <EditReminderModal
          reminder={editingReminder}
          onClose={() => setEditingReminder(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

// Updated ReminderItem component
const ReminderItem = ({ reminder, onEdit, onMarkDone, isCompleted }) => {
  const dateStr = new Date(reminder.date).toLocaleDateString("en-GB");
  return (
    <div
      className={`p-3 rounded-xl transition-all mb-1 ${isCompleted ? "bg-blue-50/50 dark:bg-blue-900/10" : "bg-white dark:bg-gray-800 shadow-sm border border-transparent dark:border-gray-700/50"}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="bg-primary-50 dark:bg-primary-900/20 p-2.5 rounded-xl flex-shrink-0">
          <ClipboardList
            size={20}
            className="text-primary-600 dark:text-primary-400"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold dark:text-white truncate">
            {reminder.title}
          </p>
          {reminder.text && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
              {reminder.text}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Clock size={10} className="text-gray-300" />
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {dateStr} • {reminder.time}
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          className="text-primary-500 dark:text-primary-400 font-bold text-[10px] uppercase tracking-widest hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-1.5 rounded-lg transition-colors"
          onClick={() => onEdit && onEdit(reminder)}
        >
          Edit
        </button>
        {!isCompleted && (
          <button
            className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all shadow-sm shadow-green-200 dark:shadow-none"
            onClick={() => onMarkDone && onMarkDone(reminder._id)}
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};

// Edit Reminder Modal Component
const EditReminderModal = ({ reminder, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: reminder.title || "",
    text: reminder.text || "",
    date: new Date(reminder.date).toISOString().split("T")[0],
    time: reminder.time || "",
    isRecurring: reminder.isRecurring || false,
  });

  const handleSave = () => {
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl space-y-8 fade-in h-auto border border-transparent dark:border-gray-800/50">
        <div className="space-y-2">
          <h2 className="text-3xl font-black dark:text-white tracking-tight">
            Edit <span className="text-primary-500">Reminder</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
            Update your recovery task details here.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
              Task Title
            </label>
            <input
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 dark:text-white transition-all font-bold placeholder:text-gray-300"
              placeholder="e.g., Morning Hand Exercise"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
              Description (Optional)
            </label>
            <textarea
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 dark:text-white transition-all font-medium placeholder:text-gray-300"
              placeholder="Additional details..."
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                Date
              </label>
              <input
                type="date"
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 dark:text-white transition-all font-bold"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                Time
              </label>
              <input
                type="time"
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 dark:text-white transition-all font-bold"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl cursor-pointer group hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors">
            <input
              type="checkbox"
              className="w-5 h-5 rounded-lg border-none bg-gray-200 dark:bg-gray-700 text-primary-500 focus:ring-primary-500/20"
              checked={form.isRecurring}
              onChange={(e) =>
                setForm({ ...form, isRecurring: e.target.checked })
              }
            />
            <span className="text-sm font-bold dark:text-gray-300">
              Set as Reappearing Task
            </span>
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:shadow-xl hover:shadow-primary-100 dark:hover:shadow-none transition-all transform hover:-translate-y-1 active:scale-95 shadow-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 3. TopBar Component ---
const TopBar = ({
  activeSection,
  isDarkMode,
  toggleDarkMode,
  handleLogout,
}) => (
  <div className="flex justify-between items-center py-8">
    <div className="flex items-center gap-2">
      <div className="w-2 h-8 bg-primary-500 rounded-full"></div>
      <h2 className="text-2xl font-black dark:text-white tracking-widest uppercase">
        {activeSection}
      </h2>
    </div>

    <div className="flex items-center gap-4">
      {/* <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
        <input
          type="text"
          placeholder="Global search..."
          className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-white pl-12 pr-6 py-3 rounded-[1.5rem] text-sm font-bold focus:ring-4 focus:ring-primary-500/10 transition-all outline-none w-64 placeholder:text-gray-400"
        />
      </div> */}

      <DarkModeToggle isDarkMode={isDarkMode} setIsDarkMode={toggleDarkMode} />

      <button className="p-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-primary-500/50 transition-all shadow-sm relative">
        <Bell size={20} />
        <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
      </button>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-5 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-all ml-2"
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </div>
  </div>
);

// Functional component for Medical Records
const RecordContent = ({ userData, isDarkMode }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const records = [
    {
      id: 1,
      title: "Health Assessment",
      date: "2026-03-24",
      type: "Routine",
      status: "Completed",
      result: "Healthy",
      doctor: "Dr. Sarah Wilson",
    },
    {
      id: 2,
      title: "MRI Scan",
      date: "2026-03-20",
      type: "Imaging",
      status: "Completed",
      result: "Normal",
      doctor: "Dr. Michael Chen",
    },
    {
      id: 3,
      title: "Blood Test",
      date: "2026-03-15",
      type: "Laboratory",
      status: "Completed",
      result: "Standard Range",
      doctor: "Dr. Sarah Wilson",
    },
    {
      id: 4,
      title: "General Checkup",
      date: "2026-03-10",
      type: "Consultation",
      status: "Completed",
      result: "Follow-up in 3 months",
      doctor: "Dr. Robert Brown",
    },
  ];

  const filteredRecords = records.filter(
    (record) =>
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.doctor.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getRecordIcon = (type) => {
    switch (type) {
      case "Imaging":
        return <Activity size={20} />;
      case "Laboratory":
        return <Award size={20} />;
      case "Consultation":
        return <MessageSquare size={20} />;
      case "Routine":
        return <ShieldCheck size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 fade-in pb-20">
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-xl border border-transparent dark:border-gray-800/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black dark:text-white tracking-tight">
              Clinical <span className="text-primary-500">History</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
              View and manage your rehabilitation diagnostic history
            </p>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors size-5" />
            <input
              type="text"
              placeholder="Search records..."
              className="pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none w-full md:w-80 dark:text-gray-200 shadow-inner transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="p-6 rounded-[2rem] bg-gray-50/50 dark:bg-gray-800/20 border border-transparent dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center text-primary-500 shadow-sm group-hover:scale-110 transition-transform">
                  {getRecordIcon(record.type)}
                </div>
                <div>
                  <h3 className="text-lg font-black dark:text-white tracking-tight uppercase">
                    {record.title}
                  </h3>
                  <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> {record.date}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                      {record.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="hidden lg:block text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                    Doctor
                  </p>
                  <p className="text-sm font-bold dark:text-gray-200">
                    {record.doctor}
                  </p>
                </div>
                <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100 dark:border-green-900/30">
                  {record.status}
                </div>
                <button className="p-3.5 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 rounded-xl hover:text-primary-500 dark:hover:text-primary-400 shadow-sm border border-transparent dark:border-gray-800 transition-all">
                  <Download size={20} />
                </button>
              </div>
            </div>
          ))}
          {filteredRecords.length === 0 && (
            <div className="text-center py-20 bg-gray-50/30 dark:bg-gray-800/10 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
              <FileText className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">
                No clinical records found matching your search
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Functional component for Calendar
const CalendarContent = ({ isDarkMode, reminders, userData }) => {
  const [view, setView] = useState("Month"); // 'Today', 'Week', 'Month'
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrev = () => {
    if (view === "Month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
      );
    } else if (view === "Week") {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      const prevDay = new Date(currentDate);
      prevDay.setDate(currentDate.getDate() - 1);
      setCurrentDate(prevDay);
    }
  };

  const handleNext = () => {
    if (view === "Month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
      );
    } else if (view === "Week") {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    } else {
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);
      setCurrentDate(nextDay);
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Mock events for visualization
  // Combined real reminders and mock appointments for calendar
  const allEvents = useMemo(() => {
    const reminderEvents = reminders.map((r) => ({
      id: `rem-${r._id}`,
      title: r.title,
      // reminders from backend have 'date' field
      date: r.date ? new Date(r.date).toISOString().split("T")[0] : "",
      type: "Reminder",
      time: r.time || "--:--",
      status: r.status,
      // For doctor field in calendar
      doctor: r.isRecurring
        ? "System"
        : userData?.doctor?.[0]?.doctorName || "Clinical Team",
    }));

    const mockAppointments = [
      {
        id: "app-1",
        title: "Checkup",
        date: "2026-03-25",
        type: "Appointment",
        time: "10:00 AM",
        doctor: userData?.doctor?.[0]?.doctorName || "Dr. Sarah Wilson",
      },
      {
        id: "app-2",
        title: "Lab Test",
        date: "2026-03-28",
        type: "Appointment",
        time: "09:00 AM",
        doctor: "Lab Specialist",
      },
    ];

    return [...reminderEvents, ...mockAppointments];
  }, [reminders, userData]);

  const getDayEvents = (date) => {
    const dStr = date.toLocaleDateString("en-CA"); // YYYY-MM-DD
    return allEvents.filter((e) => {
      if (!e.date) return false;
      const eDateStr = new Date(e.date).toLocaleDateString("en-CA");
      return eDateStr === dStr;
    });
  };

  const renderTodayView = () => {
    const dayEvents = getDayEvents(currentDate);
    return (
      <div className="p-8 space-y-6 min-h-[500px]">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shadow-primary-200 dark:shadow-none">
            <span className="text-xs font-bold uppercase tracking-widest">
              {dayNames[currentDate.getDay()]}
            </span>
            <span className="text-2xl font-black">{currentDate.getDate()}</span>
          </div>
          <div>
            <h3 className="text-2xl font-black dark:text-white">
              Daily Schedule
            </h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              You have {dayEvents.length} events today
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {dayEvents.length > 0 ? (
            dayEvents.map((e) => (
              <div
                key={e.id}
                className="premium-card p-6 flex items-center justify-between group hover:border-primary-400 transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                    <Clock className="text-primary-500" size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-primary-500 uppercase tracking-widest mb-1">
                      {e.time}
                    </p>
                    <h4 className="text-lg font-bold dark:text-white">
                      {e.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {e.doctor}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${e.type === "Appointment" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}
                >
                  {e.type}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/20 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-bold">
                No events scheduled for today
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dayEvents = getDayEvents(day);
      const isToday = new Date().toDateString() === day.toDateString();

      weekDays.push(
        <div
          key={i}
          className={`flex-1 min-h-[500px] border-r dark:border-gray-800 last:border-r-0 ${isToday ? "bg-blue-50/20 dark:bg-blue-900/5" : ""}`}
        >
          <div
            className={`p-4 text-center border-b dark:border-gray-800 ${isToday ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
          >
            <p
              className={`text-[10px] font-black uppercase tracking-widest ${isToday ? "text-blue-600" : "text-gray-400"}`}
            >
              {dayNames[i]}
            </p>
            <p
              className={`text-2xl font-black mt-1 ${isToday ? "text-blue-600" : "dark:text-white"}`}
            >
              {day.getDate()}
            </p>
          </div>
          <div className="p-2 space-y-2">
            {dayEvents.map((e) => (
              <div
                key={e.id}
                className={`p-3 rounded-xl border text-[10px] font-bold ${e.type === "Appointment" ? "bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400" : "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"}`}
              >
                <p className="uppercase tracking-tighter opacity-70 mb-1">
                  {e.time}
                </p>
                <p className="line-clamp-2">{e.title}</p>
              </div>
            ))}
          </div>
        </div>,
      );
    }
    return <div className="flex">{weekDays}</div>;
  };

  const renderMonthView = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const startOffset = firstDayOfMonth(currentDate);
    const prevMonthLastDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0,
    ).getDate();

    for (let i = startOffset - 1; i >= 0; i--) {
      days.push(
        <div
          key={`prev-${i}`}
          className="h-32 border dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 p-2 opacity-30"
        >
          <span className="text-sm font-bold text-gray-400">
            {prevMonthLastDate - i}
          </span>
        </div>,
      );
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        d,
      );
      const dayEvents = getDayEvents(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div
          key={d}
          className={`h-32 border dark:border-gray-800 p-2 transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/5 group ${isToday ? "bg-blue-50/30 dark:bg-blue-900/5" : "bg-white dark:bg-gray-900"}`}
        >
          <div className="flex justify-between items-start">
            <span
              className={`text-sm font-black w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${isToday ? "bg-primary-500 text-white shadow-lg shadow-primary-100" : "text-gray-700 dark:text-gray-300 group-hover:text-primary-500"}`}
            >
              {d}
            </span>
          </div>
          <div className="mt-2 space-y-1 overflow-y-auto max-h-[70px] custom-scrollbar">
            {dayEvents.map((e) => (
              <div
                key={e.id}
                className={`text-[9px] p-1.5 rounded-lg border font-bold truncate ${e.type === "Appointment" ? "bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400" : "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"}`}
              >
                {e.title}
              </div>
            ))}
          </div>
        </div>,
      );
    }
    return days;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl shadow-gray-100 dark:shadow-none border border-transparent dark:border-gray-800/50">
        <div>
          <h1 className="text-4xl font-black dark:text-white tracking-tight">
            Health <span className="text-primary-500">Calendar</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Keep track of your rehabilitation journey and appointments.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-2xl border dark:border-gray-700/50">
            {["Today", "Week", "Month"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === v ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="bg-primary-500 text-white p-3 rounded-2xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-100 dark:shadow-none">
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl shadow-gray-100 dark:shadow-none border border-transparent dark:border-gray-800/50 overflow-hidden">
        <div className="flex items-center justify-between p-8 border-b dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/20">
          <h2 className="text-2xl font-black dark:text-white tracking-tight">
            {view === "Month"
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : view === "Week"
                ? `Week of ${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`
                : `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrev}
              className="p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl dark:text-gray-300 transition-all shadow-sm"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-6 py-2.5 text-xs font-black dark:text-primary-400 uppercase tracking-widest bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl hover:shadow-md transition-all"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl dark:text-gray-300 transition-all shadow-sm"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div>
          {view === "Month" ? (
            <div className="grid grid-cols-7 border-collapse">
              {dayNames.map((d) => (
                <div
                  key={d}
                  className="p-5 text-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] border-b border-r dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/10"
                >
                  {d}
                </div>
              ))}
              {renderMonthView()}
            </div>
          ) : view === "Week" ? (
            renderWeekView()
          ) : (
            renderTodayView()
          )}
        </div>
      </div>
    </div>
  );
};

// Updated SettingsContent with a premium dark mode layout
const SettingsContent = ({ isDarkMode }) => {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12 fade-in pb-20">
      <div className="space-y-4">
        <h1 className="text-4xl font-black dark:text-white tracking-tight">
          Account <span className="text-primary-500">Settings</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
          Manage your profile, security, and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="premium-card p-10 space-y-10">
          {/* Profile Section */}
          <section className="space-y-8">
            <h2 className="text-xl font-black dark:text-white uppercase tracking-wider flex items-center gap-3">
              <User className="text-primary-500" />
              Personal Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                  Full Name
                </label>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl dark:text-white font-bold border border-transparent dark:border-gray-700/50">
                  Alex Johnson
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                  Email Address
                </label>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl dark:text-white font-bold border border-transparent dark:border-gray-700/50">
                  alex.johnson@example.com
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* Preferences Section */}
          <section className="space-y-8">
            <h2 className="text-xl font-black dark:text-white uppercase tracking-wider flex items-center gap-3">
              <Settings className="text-primary-500" />
              General Preferences
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800 rounded-[2rem] border border-transparent dark:border-gray-700/50">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl text-primary-500 shadow-sm">
                    <Bell size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold dark:text-white">
                      Push Notifications
                    </h4>
                    <p className="text-sm text-gray-400 font-medium">
                      Receive alerts for game reminders and appointments.
                    </p>
                  </div>
                </div>
                <div className="w-14 h-8 bg-primary-500 rounded-full flex items-center px-1 cursor-pointer">
                  <div className="w-6 h-6 bg-white rounded-full shadow-md ml-auto" />
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800 rounded-[2rem] border border-transparent dark:border-gray-700/50">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl text-secondary-500 shadow-sm">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold dark:text-white">
                      Privacy Mode
                    </h4>
                    <p className="text-sm text-gray-400 font-medium">
                      Hide sensitive clinical data from the dashboard.
                    </p>
                  </div>
                </div>
                <div className="w-14 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center px-1 cursor-pointer">
                  <div className="w-6 h-6 bg-white rounded-full shadow-md" />
                </div>
              </div>
            </div>
          </section>

          <button className="w-full py-5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm hover:shadow-2xl hover:shadow-primary-500/20 transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl">
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Overhauled HelpCenterContent with premium design and dark mode support
const HelpCenterContent = ({ isDarkMode }) => (
  <div className="p-6 max-w-5xl mx-auto space-y-12 fade-in pb-20">
    {/* Hero Section */}
    <div className="text-center space-y-4">
      <h1 className="text-4xl md:text-5xl font-black dark:text-white tracking-tight">
        How can we <span className="text-primary-500">help you?</span>
      </h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
        Find answers to common questions and learn how to get the most out of
        your rehabilitation journey.
      </p>
    </div>

    {/* Category Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="premium-card p-8 group hover:border-primary-400 transition-all cursor-pointer">
        <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6 group-hover:scale-110 transition-transform">
          <BookOpen size={28} />
        </div>
        <h3 className="text-xl font-bold dark:text-white mb-2">
          Getting Started
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          New to the platform? Learn the basics of your dashboard and how to
          start your first session.
        </p>
      </div>

      <div className="premium-card p-8 group hover:border-secondary-400 transition-all cursor-pointer">
        <div className="w-14 h-14 bg-secondary-50 dark:bg-secondary-900/20 rounded-2xl flex items-center justify-center text-secondary-600 dark:text-secondary-400 mb-6 group-hover:scale-110 transition-transform">
          <Activity size={28} />
        </div>
        <h3 className="text-xl font-bold dark:text-white mb-2">Game Guides</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          Detailed instructions on how to play each game and how they help your
          physical recovery.
        </p>
      </div>

      <div className="premium-card p-8 group hover:border-blue-400 transition-all cursor-pointer">
        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
          <ShieldCheck size={28} />
        </div>
        <h3 className="text-xl font-bold dark:text-white mb-2">
          Privacy & Security
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          Understand how we protect your clinical data and maintain your privacy
          at all times.
        </p>
      </div>
    </div>

    {/* FAQ Section */}
    <div className="space-y-6">
      <h2 className="text-2xl font-black dark:text-white uppercase tracking-wider flex items-center gap-3">
        <HelpCircle className="text-primary-500" />
        Popular Questions
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {[
          {
            q: "How do I reset my password?",
            a: "Navigate to Settings > Security and click on 'Change Password'. You'll receive an email with instructions.",
          },
          {
            q: "How is my progress tracked?",
            a: "Our system records every game session, tracking accuracy, range of motion, and consistency to build your recovery profile.",
          },
          {
            q: "What hardware do I need?",
            a: "Most games only require a standard webcam. Some advanced modules might benefit from specific sensors like Leap Motion.",
          },
          {
            q: "Can my doctor see my results?",
            a: "Yes, your assigned clinical team has real-time access to your progress reports to adjust your therapy as needed.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="premium-card p-6 border-l-4 border-l-primary-500 dark:border-l-primary-600"
          >
            <h4 className="font-bold dark:text-white text-lg mb-2">{item.q}</h4>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </div>

    {/* Support CTA */}
    <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-[2rem] p-10 text-center text-white shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-110"></div>
      <div className="relative z-10 space-y-6">
        <h2 className="text-3xl font-black tracking-tight">
          Still have questions?
        </h2>
        <p className="text-primary-50 max-w-xl mx-auto font-medium">
          Our dedicated support team is available 24/7 to help you with any
          technical or clinical platform issues.
        </p>
        <button className="bg-white text-primary-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:shadow-xl transition-all hover:scale-105 active:scale-95">
          Contact Support
        </button>
      </div>
    </div>
  </div>
);

const InfoCard = ({ title, content, onChange }) => (
  <div className="premium-card p-6 relative">
    <div className="flex justify-between items-center mb-4">
      <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        {title}
      </p>
      {onChange && (
        <div
          className="flex items-center gap-1.5 cursor-pointer text-[#2B91D4] hover:text-blue-600 transition-colors"
          onClick={onChange}
        >
          <Edit3 size={12} />
          <p className="font-bold text-xs uppercase">Edit</p>
        </div>
      )}
    </div>
    <div className="dark:text-gray-200">{content}</div>
  </div>
);

// Doctor selection modal component
const DoctorModal = ({ doctors, onClose, onSelect }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 fade-in px-4">
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border dark:border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white capitalize">
          Select Your Doctor
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
        >
          <ChevronRight size={24} className="rotate-90" />
        </button>
      </div>
      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar border-b dark:border-gray-800 mb-6">
        {doctors.map((doc, idx) => (
          <div
            key={idx}
            className="p-4 cursor-pointer border dark:border-gray-800 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
            onClick={() => onSelect(doc)}
          >
            <p className="font-bold text-lg dark:text-white group-hover:text-blue-600 transition-colors capitalize">
              {doc.doctorName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase font-medium tracking-wider">
              {doc.doctorDegree}
            </p>
          </div>
        ))}
      </div>
      <button
        onClick={onClose}
        className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors uppercase shadow-sm"
      >
        Close
      </button>
    </div>
  </div>
);

