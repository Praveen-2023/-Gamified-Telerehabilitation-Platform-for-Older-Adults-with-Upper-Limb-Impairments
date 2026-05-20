import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { userService } from "../../services/userService";
import { chatService } from "../../services/chatService";
import { reminderService } from "../../services/reminderService";
import {
  LogOut,
  Users,
  MessageSquare,
  Bell,
  Calendar,
  Loader2,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Send,
  Sun,
  Moon,
} from "lucide-react";
import ChatPage from "../common/ChatPage";

// --- Components (Consonant with Doctor/Patient) ---

const SidebarItem = ({ icon, label, active, onClick, collapsed }) => (
  <div
    className={`flex ${collapsed ? "justify-center" : "items-center space-x-3"} mx-2 my-1 rounded-2xl px-4 py-3 cursor-pointer transition-all duration-300 ${
      active
        ? "text-white bg-primary-500 font-bold shadow-lg shadow-primary-500/20"
        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-500 dark:hover:text-primary-400"
    }`}
    onClick={onClick}
  >
    <span className={`${active ? "text-white" : "text-inherit"} flex-shrink-0`}>
      {icon}
    </span>
    {!collapsed && <span className="text-sm tracking-tight">{label}</span>}
  </div>
);

const Sidebar = ({
  activeView,
  setActiveView,
  handleLogout,
  user,
  isCollapsed,
  setIsCollapsed,
  isDarkMode,
}) => (
  <aside
    className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col justify-between overflow-hidden z-20 transition-all duration-500 ${isCollapsed ? "w-20" : "w-72"}`}
  >
    <div className="p-0 flex flex-col h-full">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-4 flex items-center justify-center border-b border-gray-100 dark:border-gray-800 h-[80px]"
      >
        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-primary-500 transition-colors">
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </div>
      </button>

      <div
        className={`p-8 flex items-center space-x-4 transition-opacity ${isCollapsed ? "justify-center" : ""}`}
      >
        <div className="bg-primary-500 h-10 w-10 rounded-2xl shadow-lg shadow-primary-500/20 flex-shrink-0 flex items-center justify-center">
          <Activity size={20} className="text-white" />
        </div>
        {!isCollapsed && (
          <span className="text-lg font-black dark:text-white tracking-widest uppercase text-black dark:text-white">
            Young Tempo
          </span>
        )}
      </div>

      <div
        className={`px-6 mb-8 flex items-center space-x-4 transition-all ${isCollapsed ? "justify-center ml-0" : "ml-2"}`}
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-black shadow-lg">
          {user?.email?.[0]?.toUpperCase()}
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-black dark:text-white truncate uppercase tracking-wider">
              Caretaker
            </h1>
            <p className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-widest">
              {user?.email}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        <SidebarItem
          icon={<LayoutDashboard size={18} />}
          label="Overview"
          active={activeView === "dashboard"}
          onClick={() => setActiveView("dashboard")}
          collapsed={isCollapsed}
        />
        {/* <SidebarItem
          icon={<Users size={18} />}
          label="My Patients"
          active={activeView === 'patients'}
          onClick={() => setActiveView('patients')}
          collapsed={isCollapsed}
        /> */}
        <SidebarItem
          icon={<MessageSquare size={18} />}
          label="Messages"
          active={activeView === "messages"}
          onClick={() => setActiveView("messages")}
          collapsed={isCollapsed}
        />
        <SidebarItem
          icon={<Bell size={18} />}
          label="Reminders"
          active={activeView === "reminders"}
          onClick={() => setActiveView("reminders")}
          collapsed={isCollapsed}
        />
      </nav>
    </div>

    <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
      <SidebarItem
        icon={<Settings size={18} />}
        label="Settings"
        active={activeView === "settings"}
        onClick={() => setActiveView("settings")}
        collapsed={isCollapsed}
      />
    </div>
  </aside>
);

// --- 3. DarkModeToggle & TopBar Component ---
const DarkModeToggle = ({ isDarkMode, toggleDarkMode, collapsed }) => (
  <div
    className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-800 ${collapsed ? "justify-center" : ""}`}
    onClick={toggleDarkMode}
  >
    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 transition-colors">
      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
    </span>
    {!collapsed && (
      <span className="text-xs font-bold whitespace-nowrap dark:text-gray-300">
        {isDarkMode ? "Light" : "Dark"}
      </span>
    )}
  </div>
);

const TopBar = ({ activeView, isDarkMode, toggleDarkMode, handleLogout }) => (
  <div className="flex justify-between items-center py-8">
    <div className="flex items-center gap-2">
      <div className="w-2 h-8 bg-primary-500 rounded-full"></div>
      <h2 className="text-2xl font-black dark:text-white tracking-widest uppercase">
        {activeView === "dashboard" ? "Overview" : activeView}
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

      <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

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

const MainDashboardView = ({ patients, chats, navigate, isDarkMode }) => (
  <div className="space-y-12">
    <div>
      <h1 className="text-6xl font-black dark:text-white tracking-tighter mb-2">
        Patient <span className="text-primary-500">Care</span>
      </h1>
      <p className="text-lg font-bold text-gray-400">
        Monitoring and supporting your clinical recipients.
      </p>
    </div>

    <div className="grid lg:grid-cols-2 gap-8">
      {/* Chats Preview */}
      {/* <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-transparent dark:border-gray-800 group hover:border-primary-500/30 transition-all">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black dark:text-white tracking-tight flex items-center gap-3">
                        <MessageSquare className="text-primary-500" size={24} /> Recent Chats
                    </h2>
                    <button onClick={() => navigate('/chat')} className="text-[10px] font-black uppercase tracking-widest text-primary-500 hover:text-primary-600 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-full transition-all">
                        View All
                    </button>
                </div>
                <div className="space-y-4">
                    {chats.slice(0, 3).map(c => (
                        <div key={c._id} onClick={() => navigate('/chat')} className="p-4 rounded-[1.5rem] bg-gray-50 dark:bg-gray-800/50 border border-transparent dark:border-gray-700/50 flex items-center justify-between group/item hover:bg-white dark:hover:bg-gray-800 transition-all cursor-pointer shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-white font-black text-xs">
                                    {(c.participants || [])[0]?.email?.[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-black dark:text-white truncate uppercase tracking-wider">{(c.participants || []).map(p => p.email || p).join(', ')}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.type}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {chats.length === 0 && <p className="text-center py-8 text-gray-400 font-bold text-sm">No recent conversations</p>}
                </div>
            </div> */}

      {/* Patients Preview */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-transparent dark:border-gray-800 group hover:border-primary-500/30 transition-all">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black dark:text-white tracking-tight flex items-center gap-3">
            <Users className="text-purple-500" size={24} /> My Patients
          </h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-4 py-1 rounded-full">
            {patients.length} ACTIVE
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {patients.slice(0, 4).map((p) => (
            <div
              key={p._id}
              className="p-5 rounded-[2rem] bg-gray-50 dark:bg-gray-800/50 border border-transparent dark:border-gray-700/50 group/card hover:bg-white dark:hover:bg-gray-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <h3 className="font-black dark:text-white text-md mb-1 truncate tracking-tight">
                {p.email}
              </h3>
              <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-4">
                {p.patientDetails?.diagnosis || "Clinical Tracking"}
              </p>
              <button
                onClick={async () => {
                  await chatService.ensureChat([p._id], "caretaker-patient");
                  navigate("/chat");
                }}
                className="w-full py-3 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-all border border-gray-100 dark:border-gray-700"
              >
                <MessageSquare size={14} /> Open Message
              </button>
            </div>
          ))}
          {patients.length === 0 && (
            <p className="col-span-full text-center py-8 text-gray-400 font-bold text-sm">
              No patients assigned
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const CaretakerDashboard = () => {
  const { user, logout, isDarkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedReminderPatient, setSelectedReminderPatient] = useState("");
  const [reminders, setReminders] = useState([]);
  const [reminderForm, setReminderForm] = useState({
    title: "",
    text: "",
    date: "",
    time: "",
    isRecurring: false,
  });
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveView] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const res = await userService.getCaretakerPatients();
        setPatients(res.patients || []);
      } catch (e) {
        console.error(e);
      }
      try {
        const c = await chatService.listMyChats();
        setChats(c.chats || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  const refreshReminders = async (pid) => {
    if (!pid) {
      setReminders([]);
      return;
    }
    try {
      const r = await reminderService.listForPatient(pid);
      setReminders(r.reminders || []);
    } catch (e) {
      console.error(e);
    }
  };

  const createReminder = async () => {
    if (!selectedReminderPatient) return alert("Select a patient");
    await reminderService.create({
      patientId: selectedReminderPatient,
      ...reminderForm,
    });
    setReminderForm({
      title: "",
      text: "",
      date: "",
      time: "",
      isRecurring: false,
    });
    refreshReminders(selectedReminderPatient);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading)
    return (
      <div
        className={`h-screen w-full flex items-center justify-center transition-colors duration-500 ${isDarkMode ? "bg-black" : "bg-gray-50"}`}
      >
        <Loader2 className="w-16 h-16 animate-spin text-primary-500" />
      </div>
    );

  return (
    <div
      className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? "bg-black" : "bg-gray-50"} text-gray-900 dark:text-gray-100`}
    >
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        handleLogout={handleLogout}
        user={user}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isDarkMode={isDarkMode}
      />

      <div
        className={`h-screen ${activeView === "messages" ? "overflow-hidden" : "overflow-y-auto"} px-10 flex-1 transition-all duration-300
 ${isCollapsed ? "ml-20" : "ml-72"}`}
      >
        <main
          className={`flex-1 ${activeView === "messages" ? "flex flex-col justify-center" : "pb-20"}`}
        >
          {activeView !== "messages" && (
            <TopBar
              activeView={activeView}
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              handleLogout={handleLogout}
            />
          )}

          {activeView === "dashboard" && (
            <MainDashboardView
              patients={patients}
              chats={chats}
              navigate={navigate}
              isDarkMode={isDarkMode}
            />
          )}

          {activeView === "patients" && (
            <div className="space-y-12">
              <div>
                <h1 className="text-6xl font-black dark:text-white tracking-tighter mb-2">
                  Recipient <span className="text-purple-500">Registry</span>
                </h1>
                <p className="text-lg font-bold text-gray-400">
                  Manage clinical oversight and messaging with your clinical
                  team.
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {patients.map((p) => (
                  <div
                    key={p._id}
                    className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-transparent dark:border-gray-800 hover:border-purple-500/30 transition-all"
                  >
                    <div className="w-16 h-16 rounded-[2rem] bg-purple-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-purple-500/20 mb-6">
                      {p.email?.[0]?.toUpperCase()}
                    </div>
                    <h3 className="text-xl font-black dark:text-white tracking-tight mb-1">
                      {p.email}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-6">
                      {p.phone}
                    </p>
                    <button
                      onClick={async () => {
                        await chatService.ensureChat(
                          [p._id],
                          "caretaker-patient",
                        );
                        navigate("/chat");
                      }}
                      className="w-full py-4 bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 active:scale-95"
                    >
                      Start Message
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === "messages" && <ChatPage type="caretaker-patient" />}

          {activeView === "reminders" && (
            <div className="space-y-12">
              <div>
                <h1 className="text-6xl font-black dark:text-white tracking-tighter mb-2">
                  Patient <span className="text-yellow-500">Reminders</span>
                </h1>
                <p className="text-lg font-bold text-gray-400">
                  Schedule daily tasks and medical events for your clinical
                  team.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-sm border border-transparent dark:border-gray-800">
                <div className="grid md:grid-cols-4 gap-6 items-end mb-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                      Select Patient
                    </label>
                    <select
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 dark:text-white transition-all font-bold"
                      value={selectedReminderPatient}
                      onChange={(e) => {
                        setSelectedReminderPatient(e.target.value);
                        refreshReminders(e.target.value);
                      }}
                    >
                      <option value="">Select patient...</option>
                      {patients.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                      Task Title
                    </label>
                    <input
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 dark:text-white transition-all font-bold"
                      placeholder="e.g. Physical Therapy"
                      value={reminderForm.title}
                      onChange={(e) =>
                        setReminderForm({
                          ...reminderForm,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                      Event Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 dark:text-white transition-all font-bold"
                      value={reminderForm.date}
                      onChange={(e) =>
                        setReminderForm({
                          ...reminderForm,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                        Start Time
                      </label>
                      <input
                        type="time"
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 dark:text-white transition-all font-bold"
                        value={reminderForm.time}
                        onChange={(e) =>
                          setReminderForm({
                            ...reminderForm,
                            time: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col justify-end pb-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded-lg border-2 border-gray-100 dark:border-gray-700 text-primary-500 focus:ring-0 transition-all pointer-events-none"
                          checked={reminderForm.isRecurring}
                          onChange={(e) =>
                            setReminderForm({
                              ...reminderForm,
                              isRecurring: e.target.checked,
                            })
                          }
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary-500 transition-colors">
                          Daily
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-black dark:text-white uppercase tracking-wider">
                    {reminders.length} Active Events
                  </span>
                  <button
                    onClick={createReminder}
                    className="flex items-center gap-2 px-8 py-4 bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 active:scale-95"
                  >
                    <Send size={16} /> Add Event
                  </button>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-auto custom-scrollbar pr-2">
                  {reminders.map((r) => (
                    <div
                      key={r._id}
                      className="p-6 rounded-[2rem] bg-gray-50 dark:bg-gray-800/50 border border-transparent dark:border-gray-700/50 flex items-center justify-between group hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-6">
                        <div
                          className={`w-12 h-12 rounded-2xl ${r.isRecurring ? "bg-yellow-500" : "bg-primary-500"} flex items-center justify-center text-white shadow-lg`}
                        >
                          {r.isRecurring ? (
                            <Calendar size={20} />
                          ) : (
                            <Bell size={20} />
                          )}
                        </div>
                        <div>
                          <h3 className="text-md font-black dark:text-white tracking-tight uppercase">
                            {r.title}
                          </h3>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {r.text || "Daily Medical Activity"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black dark:text-white tracking-tighter">
                          {r.time}
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-primary-500">
                          {new Date(r.date).toLocaleDateString([], {
                            day: "2-digit",
                            month: "short",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {reminders.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800">
                      <Bell className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
                      <p className="text-gray-400 dark:text-gray-600 font-bold text-sm uppercase tracking-widest text-center mx-auto">
                        No events scheduled
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CaretakerDashboard;
