import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { userService } from "../../services/userService";
import { reminderService } from "../../services/reminderService";
// Assuming appointmentService is used in one of the views
// import { appointmentService } from '../../services/appointmentService';
import api from "../../services/api";
import {
  Users,
  UserPlus,
  LogOut,
  Activity,
  MessageSquare,
  Bell,
  Calendar,
  LayoutDashboard,
  Pill,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  User as UserIcon,
  Phone as PhoneIcon,
  Clock,
  AlertCircle,
  User,
} from "lucide-react";
import ChatPage from "../common/ChatPage";
import DoctorProfileForm from "./DoctorProfileForm"; // This remains unchanged
import SchedulePage from "./SchedulePage";

// --- 1. New SidebarItem Component (from PatientDashboard) ---
// This replaces your old 'SidebarLink' component
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

// --- 2. Refactored Sidebar Component ---
// Now collapsible and styled to match PatientDashboard
const Sidebar = ({
  activeView,
  setActiveView,
  handleLogout,
  doctorProfile,
  profileLoading,
  isCollapsed,
  setIsCollapsed,
  isDarkMode,
}) => (
  <aside
    className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col justify-between overflow-hidden z-20 transition-all duration-500 ${isCollapsed ? "w-20" : "w-72"}`}
  >
    <div className="p-0 flex flex-col h-full">
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-4 flex items-center justify-center border-b border-gray-100 dark:border-gray-800 h-[80px]"
      >
        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-primary-500 transition-colors">
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </div>
      </button>

      {/* Logo */}
      <div
        className={`p-6 flex items-center space-x-2 transition-opacity ${isCollapsed ? "justify-center" : ""}`}
      >
        <div className="bg-[#2B91D4] h-8 w-8 rounded-lg flex-shrink-0"></div>
        {!isCollapsed && <span className="text-xl font-bold">Young Tempo</span>}
      </div>

      {/* Profile */}
      <div
        className={`px-6 pt-6 pb-2 flex items-center space-x-3 transition-all ${isCollapsed ? "space-x-0 justify-center" : ""}`}
      >
        <img
          src="https://via.placeholder.com/150" // Placeholder
          alt="Profile"
          className="w-10 h-10 bg-black rounded-full flex-shrink-0"
        />
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-semibold text-[#2B91D4] truncate">
              {profileLoading
                ? "Loading..."
                : doctorProfile.name || "Dr. Stranger"}
            </h1>
            <p className="text-xs text-gray-500 truncate">
              {profileLoading ? "..." : doctorProfile.degree || "Doctor"}
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="mt-4 flex-1 overflow-y-auto px-2">
        <SidebarItem
          icon={<LayoutDashboard size={18} />}
          label="Dashboard"
          active={activeView === "dashboard"}
          onClick={() => setActiveView("dashboard")}
          collapsed={isCollapsed}
        />
        <SidebarItem
          icon={<Calendar size={18} />}
          label="Schedule"
          active={activeView === "schedule"}
          onClick={() => setActiveView("schedule")}
          collapsed={isCollapsed}
        />
        <SidebarItem
          icon={<Activity size={18} />}
          label="Patients"
          active={activeView === "patients"}
          onClick={() => setActiveView("patients")}
          collapsed={isCollapsed}
        />
        <SidebarItem
          icon={<Users size={18} />}
          label="Caretakers"
          active={activeView === "caretakers"}
          onClick={() => setActiveView("caretakers")}
          collapsed={isCollapsed}
        />
        <SidebarItem
          icon={<MessageSquare size={18} />}
          label="Messages"
          active={activeView === "messages"}
          onClick={() => setActiveView("messages")}
          collapsed={isCollapsed}
        />
        <SidebarItem
          icon={<Pill size={18} />}
          label="Medicines"
          active={activeView === "medicines"}
          onClick={() => setActiveView("medicines")}
          collapsed={isCollapsed}
        />
        {/* <SidebarItem
          icon={<UserCog size={18} />}
          label="Edit Profile"
          active={activeView === 'profile'}
          onClick={() => setActiveView('profile')}
          collapsed={isCollapsed}
        /> */}
      </nav>
    </div>

    {/* Bottom Section - Settings only */}
    <div className="border-t py-4 pt-5 space-y-2 px-2">
      <SidebarItem
        icon={<Settings size={18} />}
        label="Settings"
        active={activeView === "Settings"}
        onClick={() => {
          /* Implement settings view if needed */
        }}
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
        {activeView}
      </h2>
    </div>

    <div className="flex items-center gap-4">
      {/* <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
        <input
          type="text"
          placeholder="Clinical search..."
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

// --- 4. MainDashboardView (Slightly modified) ---
// Header styling updated
const MainDashboardView = ({
  fetchProfileDetails,
  showEditFile,
  setShowEditFile,
  patients,
  caretakers,
  loadUsers,
  user,
  doctorProfile, // Pass this for the welcome message
  onProfileUpdate,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(true); // Default to false
  // const [editProfile, setEditProfile] = useState(false); // Default to false
  // const [showEditFile, setShowEditFile] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
    type: "patient",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await userService.createUser(formData);
      alert("User created successfully!");
      setShowCreateForm(false);
      setFormData({ email: "", password: "", phone: "", type: "patient" });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-transparent dark:border-gray-800/50 group hover:border-primary-500/30 transition-all duration-500">
      <div className="flex justify-between items-start mb-6">
        <div
          className="p-4 rounded-2xl"
          style={{ backgroundColor: `${color}15` }} // 15 is ~8% opacity in hex
        >
          <Icon className="w-6 h-6" style={{ color: color }} />
        </div>
        {trend && (
          <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
          {title}
        </p>
        <p className="text-4xl font-black dark:text-white tracking-tighter">
          {value}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          {/* <h1 className="text-6xl font-black dark:text-white tracking-tighter mb-2">
            Clinical <span className="text-primary-500">Center</span>
          </h1> */}
          <p className="text-lg font-bold text-gray-400">
            Welcome back, {doctorProfile.name || "Doctor"}. Here's your clinic
            overview.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowEditFile(!showEditFile)}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95 border border-transparent dark:border-gray-700"
          >
            <UserCog className="w-5 h-5 text-gray-400" />
            {showEditFile ? "Cancel" : "Profile"}
          </button>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-primary-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            {showCreateForm ? "Cancel" : "New User"}
          </button>
        </div>
      </div>

      {/* Stat Cards (Styling updated slightly) */}
      <div className="grid md:grid-cols-3 gap-8">
        <StatCard
          title="Active Patients"
          value={patients.length}
          icon={Users}
          color="#A855F7"
          trend="+12%"
        />
        <StatCard
          title="Care Team"
          value={caretakers.length}
          icon={Activity}
          color="#22C55E"
          trend="Stable"
        />
        <StatCard
          title="Appointments"
          value="8"
          icon={Calendar}
          color="#3B82F6"
          trend="Today"
        />
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-xl border border-transparent dark:border-gray-800/50 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl">
              <UserPlus className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black dark:text-white tracking-tight">
                Create New User
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium text-opacity-80">
                Add a new patient or caretaker to the platform
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@clinical.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold dark:text-gray-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold dark:text-gray-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                  Secure Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold dark:text-gray-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                  User Role
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold dark:text-gray-200"
                >
                  <option value="patient">Patient</option>
                  <option value="caretaker">Caretaker</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/30 text-sm font-bold">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:shadow-xl hover:shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  "Register User"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className=" mt-3"></div>
      {showEditFile && (
        <DoctorProfileForm
          // We pass the already-fetched data to the form
          initialData={doctorProfile}
          // We pass the refetch function so the sidebar updates on save
          onProfileUpdate={fetchProfileDetails}
        />
      )}
      <div className=" mt-3"></div>

      {/* Note: The DoctorProfileForm is now rendered from the main layout based on activeView === 'profile' */}
    </div>
  );
};

// --- 5. Other Views (PatientView, CaretakerView, etc.) ---
// These components remain unchanged internally, but they will now render
// inside the new, styled layout.

const PatientView = ({ patients, caretakers, isDarkMode }) => (
  <div className="space-y-6">
    {/* <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Patients</h1> */}
    {/* <AssignPatientForm patients={patients} caretakers={caretakers} isDarkMode={isDarkMode} /> */}
    <PatientList patients={patients} isDarkMode={isDarkMode} />
    <QuickReminders patients={patients} isDarkMode={isDarkMode} />
  </div>
);

const CaretakerView = ({ patients, caretakers, isDarkMode }) => (
  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
    {/* <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-4">
      <div>
        <h1 className="text-5xl font-black dark:text-white tracking-tighter mb-2">
          Care <span className="text-purple-500">Team</span>
        </h1>
        <p className="text-lg font-bold text-gray-400 italic">Monitor and manage your support staff and patient assignments.</p>
      </div>
    </div> */}

    <AssignPatientForm
      patients={patients}
      caretakers={caretakers}
      isDarkMode={isDarkMode}
    />

    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-xl border border-transparent dark:border-gray-800/50">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl">
          <Users className="w-6 h-6 text-primary-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black dark:text-white tracking-tight">
            Caretaker Directory
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Review workloads and assigned patient groups
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {caretakers.map((caretaker) => {
          const assignedPatients = patients.filter((p) =>
            caretaker.assignedPatients?.includes(p._id),
          );
          return (
            <div
              key={caretaker._id}
              className="premium-card p-6 border dark:border-gray-800 hover:border-primary-500/50 transition-all group overflow-hidden relative"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />

              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500 border border-primary-100 dark:border-primary-800 shadow-sm">
                  <UserIcon size={28} />
                </div>
                <div className="px-4 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-100 dark:border-purple-800/50">
                  {assignedPatients.length} Patients
                </div>
              </div>

              <h3 className="text-xl font-black dark:text-white mb-1 truncate relative z-10">
                {caretaker.email}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mb-6 flex items-center gap-2 relative z-10 italic">
                <PhoneIcon size={14} className="text-primary-400" />{" "}
                {caretaker.phone}
              </p>
              <div className="space-y-3 relative z-10">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">
                  Assigned Patients
                </label>
                <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                  {assignedPatients.length > 0 ? (
                    assignedPatients.map((p) => (
                      <div
                        key={p._id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-2 border border-transparent hover:border-primary-500/30 transition-all"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                        <span className="text-xs font-bold dark:text-gray-300 truncate">
                          {p.email}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-gray-400 font-bold uppercase italic p-3 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      No assignments
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t dark:border-gray-800 flex justify-between items-center relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Account Active
                </span>
                <Clock size={14} className="text-green-500" />
              </div>
            </div>
          );
        })}
        {caretakers.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-500">
            No caretakers created yet.
          </div>
        )}
      </div>
    </div>
  </div>
);

// const SchedulePage = () => {
//   const [loading, setLoading] = useState(true);
//   useEffect(() => {
//     const timer = setTimeout(() => setLoading(false), 500);
//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <div className="flex flex-col h-full bg-white rounded-lg shadow p-6">
//       <h1 className="text-3xl font-bold text-gray-800 mb-6">My Schedule</h1>
//       {loading ? (
//         <div className="flex justify-center items-center h-48">
//           <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
//         </div>
//       ) : (
//         <div>Your schedule content, tables, and booking logic would go here.</div>
//       )}
//     </div>
//   );
// };

const PlaceholderView = ({ title }) => (
  <div>
    <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
    <p className="mt-4 text-gray-600">
      This page is a placeholder. Content for {title} goes here.
    </p>
  </div>
);
const MedicinesView = () => <PlaceholderView title="Medicines" />;

// --- (Helper components, unchanged) ---

const AssignPatientForm = ({ patients, caretakers, isDarkMode }) => {
  const [assignCaretakerId, setAssignCaretakerId] = useState("");
  const [assignPatientId, setAssignPatientId] = useState("");
  const [loading, setLoading] = useState(false);

  const assignPatient = async () => {
    if (!assignCaretakerId || !assignPatientId)
      return alert("Select caretaker and patient");
    setLoading(true);
    try {
      await userService.assignPatient({
        caretakerId: assignCaretakerId,
        patientId: assignPatientId,
      });
      alert("Patient successfully assigned to caretaker!");
      setAssignCaretakerId("");
      setAssignPatientId("");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-xl border border-transparent dark:border-gray-800/50">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
          <UserPlus className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black dark:text-white tracking-tight">
            Assign Patient
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Connect patients with their dedicated caretakers
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
            Caretaker
          </label>
          <select
            className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold dark:text-gray-200"
            value={assignCaretakerId}
            onChange={(e) => setAssignCaretakerId(e.target.value)}
          >
            <option value="">Select Caretaker</option>
            {caretakers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.email}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
            Patient
          </label>
          <select
            className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold dark:text-gray-200"
            value={assignPatientId}
            onChange={(e) => setAssignPatientId(e.target.value)}
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={assignPatient}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Processing..." : "Assign Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

const PatientList = ({ patients, isDarkMode }) => {
  const navigate = useNavigate();
  const viewPatientAnalytics = (patientId) => {
    navigate(`/doctor/patient/${patientId}`);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-xl border border-transparent dark:border-gray-800/50 mt-10">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
          <Activity className="w-6 h-6 text-purple-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black dark:text-white tracking-tight">
            Active Patients
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Total registered patients: {patients.length}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => (
          <div
            key={patient._id}
            className="premium-card p-6 bg-gray-50/50 dark:bg-gray-800/30 border dark:border-gray-800 hover:border-primary-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-primary-500 shadow-sm border border-gray-100 dark:border-gray-700">
                  <User size={20} />
                </div>
                <h3 className="font-black dark:text-white truncate">
                  {patient.email}
                </h3>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-widest">
                    Phone
                  </span>
                  <span className="dark:text-gray-300 font-bold italic">
                    {patient.phone}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-widest">
                    Global Score
                  </span>
                  <span className="text-primary-500 font-black">
                    {patient.totalScore || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-widest">
                    Therapy Sessions
                  </span>
                  <span className="text-purple-500 font-black">
                    {patient.gameSessions?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => viewPatientAnalytics(patient._id)}
              className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-primary-500 hover:text-white hover:border-primary-500 dark:hover:bg-primary-500 dark:hover:text-white transition-all font-black uppercase tracking-widest text-[10px] shadow-sm flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" /> View Full Analytics
            </button>
          </div>
        ))}
        {patients.length === 0 && (
          <div className="col-span-full text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-400 font-black uppercase tracking-widest text-sm">
              No patients found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const QuickReminders = ({ patients, isDarkMode }) => {
  const [selectedReminderPatient, setSelectedReminderPatient] = useState("");
  const [reminders, setReminders] = useState([]);
  const [reminderForm, setReminderForm] = useState({
    title: "",
    date: "",
    time: "",
    isRecurring: false,
  });

  const refreshReminders = async (pid) => {
    if (!pid) return setReminders([]);
    const res = await reminderService.listForPatient(pid);
    setReminders(res.reminders || []);
  };

  const createReminder = async () => {
    if (!selectedReminderPatient || !reminderForm.title)
      return alert("Select patient and title");
    await reminderService.create({
      ...reminderForm,
      patientId: selectedReminderPatient,
    });
    alert("Reminder Created");
    setReminderForm({ title: "", date: "", time: "", isRecurring: false });
    refreshReminders(selectedReminderPatient);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-xl border border-transparent dark:border-gray-800/50 mt-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-yellow-400 rounded-2xl flex items-center justify-center transform -rotate-6">
              <Bell className="w-6 h-6 text-white" />
            </div>
            Quick <span className="text-primary-500">Reminders</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
            Set immediate therapy tasks for your assigned patients
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10 items-end">
        <div className="lg:col-span-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">
            Patient
          </label>
          <select
            className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold dark:text-gray-200"
            value={selectedReminderPatient}
            onChange={(e) => {
              setSelectedReminderPatient(e.target.value);
              refreshReminders(e.target.value);
            }}
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.email}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">
            Task Title
          </label>
          <input
            className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold dark:text-gray-200"
            placeholder="e.g. Piano Game Therapy"
            value={reminderForm.title}
            onChange={(e) =>
              setReminderForm({ ...reminderForm, title: e.target.value })
            }
          />
        </div>
        <div className="lg:col-span-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">
            Due Date
          </label>
          <input
            type="date"
            className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold dark:text-gray-200"
            value={reminderForm.date}
            onChange={(e) =>
              setReminderForm({ ...reminderForm, date: e.target.value })
            }
          />
        </div>
        <div className="lg:col-span-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">
            Time
          </label>
          <div className="flex items-center gap-3">
            <input
              type="time"
              className="flex-1 p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold dark:text-gray-200"
              value={reminderForm.time}
              onChange={(e) =>
                setReminderForm({ ...reminderForm, time: e.target.value })
              }
            />
            <button
              onClick={() =>
                setReminderForm({
                  ...reminderForm,
                  isRecurring: !reminderForm.isRecurring,
                })
              }
              className={`p-4 rounded-2xl transition-all border-2 ${reminderForm.isRecurring ? "bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/30" : "bg-gray-50 dark:bg-gray-800 border-transparent text-gray-400"}`}
              title="Daily Recurring"
            >
              <Users size={18} />
            </button>
          </div>
        </div>
        <div className="lg:col-span-1">
          <button
            onClick={createReminder}
            className="w-full p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Create Task
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-6 px-1">
          <span className="text-xs font-black uppercase tracking-widest text-gray-400">
            Scheduled for Patient ({reminders.length})
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map((r) => (
            <div
              key={r._id}
              className="p-5 rounded-3xl bg-gray-50/50 dark:bg-gray-800/20 border border-transparent dark:border-gray-700/50 flex items-center justify-between group hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.isRecurring ? "bg-primary-500 text-white" : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-primary-500"}`}
                >
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="font-bold dark:text-white">{r.title}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1 mt-0.5">
                    <Calendar size={10} />{" "}
                    {new Date(r.date).toLocaleDateString()} at {r.time}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${r.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}
                >
                  {r.status}
                </span>
              </div>
            </div>
          ))}
          {reminders.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2.5rem]">
              <Bell className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 dark:text-gray-500 font-bold">
                Select a patient to see their active reminders
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DoctorDashboard = () => {
  const { user, logout, isDarkMode, toggleDarkMode } = useAuth();

  const navigate = useNavigate();
  const [showEditFile, setShowEditFile] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapse state

  // State for patients/caretakers
  const [patients, setPatients] = useState([]);
  const [caretakers, setCaretakers] = useState([]);

  // State for doctor profile (for sidebar)
  const [doctorProfile, setDoctorProfile] = useState({
    name: "",
    degree: "",
    phone: "",
    email: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    fetchProfileDetails();
  }, []);

  async function fetchProfileDetails() {
    setProfileLoading(true);
    try {
      const res = await api.get("/users/get-user-details");
      if (res.data.success) {
        setDoctorProfile({
          degree: res.data.doctor.degree || "",
          name: res.data.doctor.name || "",
          phone: res.data.doctor.phone || "",
          email: res.data.doctor.email || "",
        });
      } else {
        console.error("Failed to load doctor details.");
      }
    } catch (err) {
      console.error("Failed to load doctor details:", err);
    } finally {
      setProfileLoading(false);
    }
  }

  const loadUsers = async () => {
    try {
      const response = await userService.getMyPatients();
      setPatients(response.patients || []);
      setCaretakers(response.caretakers || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? "bg-black" : "bg-gray-50"} text-gray-900 dark:text-gray-100`}
    >
      {/* Sidebar (Fixed, Collapsible) */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        handleLogout={handleLogout}
        doctorProfile={doctorProfile}
        profileLoading={profileLoading}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isDarkMode={isDarkMode}
      />

      {/* Main Content Area (Scrollable, with offset) */}
      <div
        className={`h-screen ${activeView === "messages" ? "overflow-hidden" : "overflow-y-auto"} px-10 flex-1 transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}
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

          {/* Conditional Content */}
          {activeView === "dashboard" && (
            <MainDashboardView
              // doctorProfile={doctorProfile}
              fetchProfileDetails={fetchProfileDetails}
              showEditFile={showEditFile}
              setShowEditFile={setShowEditFile}
              patients={patients}
              caretakers={caretakers}
              loadUsers={loadUsers}
              user={user}
              doctorProfile={doctorProfile}
              onProfileUpdate={fetchProfileDetails}
            />
          )}

          {activeView === "patients" && (
            <PatientView
              patients={patients}
              caretakers={caretakers}
              isDarkMode={isDarkMode}
            />
          )}

          {activeView === "caretakers" && (
            <CaretakerView
              patients={patients}
              caretakers={caretakers}
              isDarkMode={isDarkMode}
            />
          )}

          {activeView === "schedule" && <SchedulePage />}
          {activeView === "messages" && <ChatPage />}
          {activeView === "medicines" && <MedicinesView />}

          {/* <div className=' mt-3'></div>
          {showEditFile && (
            <DoctorProfileForm
              // We pass the already-fetched data to the form
              initialData={doctorProfile}
              // We pass the refetch function so the sidebar updates on save
              onProfileUpdate={fetchProfileDetails}
            />
          )}
<div className=' mt-3'></div> */}
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;
