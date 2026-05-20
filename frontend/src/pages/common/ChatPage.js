import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Send,
  MoreVertical,
  MessageSquare,
  UserPlus,
  Loader2,
  Search,
} from "lucide-react";
import { Dialog } from "@headlessui/react";
import { chatService } from "../../services/chatService";
import { userService } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

const ChatPage = ({ type: initialType }) => {
  const { user, isDarkMode } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState(
    initialType || "", // Default to ALL to avoid missing conversations
  );
  const [participants, setParticipants] = useState([]);
  const [patientList, setPatientList] = useState([]);
  const [caretakerList, setCaretakerList] = useState([]);
  const messagesEndRef = useRef(null);

  // Scroll to last message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChat]);

  const openChat = useCallback(async (chat) => {
    setLoadingMessages(true);
    setSelectedChat(chat);
    setMessages([]); // Clear old messages immediately to show it's loading fresh
    try {
      const res = await chatService.getMessages(chat._id);
      setMessages(res.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Load chats and participants
  const loadChats = useCallback(
    async (filterOverride) => {
      setLoadingChats(true);
      try {
        const activeType = filterOverride !== undefined ? filterOverride : type;
        const res = await chatService.listMyChats();
        const allChats = res.chats || [];
        const filtered = activeType
          ? allChats.filter((c) => c.type === activeType)
          : allChats;
        setChats(filtered);

        if (filtered.length > 0) {
          // Only auto-open if no chat is currently selected or if it's the first load
          if (!selectedChat) openChat(filtered[0]);
        } else {
          setSelectedChat(null);
        }

        if (user?.type === "doctor") {
          const my = await userService.getMyPatients();
          setPatientList(my.patients || []);
          setCaretakerList(my.caretakers || []);
        } else if (user?.type === "caretaker") {
          const list = await userService.getCaretakerPatients();
          setPatientList(list.patients || []);
        } else if (user?.type === "patient") {
          const res2 = await userService.getUserFullDetails();
          const doctorId = res2.user?.createdBy;
          if (doctorId) setParticipants([doctorId]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingChats(false);
        setLoadingMessages(false);
      }
    },
    [type, selectedChat, openChat, user?.type],
  );

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const sendMessage = async () => {
    if (!selectedChat || !message.trim()) return;
    try {
      const res = await chatService.sendMessage(
        selectedChat._id,
        message.trim(),
      );
      setMessages(res.chat.messages || []);
      setMessage("");
    } catch (e) {
      console.error(e);
    }
  };

  const ensureChat = async () => {
    const ids = participants.filter(Boolean);
    if (ids.length === 0) return;
    try {
      const res = await chatService.ensureChat(ids, type);
      await loadChats();
      openChat(res.chat);
      setIsModalOpen(false);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to create/open chat");
    }
  };

  // Modal Form
  const renderModal = () => (
    <Dialog
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      className="fixed z-50 inset-0 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4 bg-black/40 backdrop-blur-sm">
        <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl p-8 w-full max-w-md space-y-6 border border-transparent dark:border-gray-800">
          <Dialog.Title className="text-2xl font-black text-center dark:text-white tracking-tight">
            Start a <span className="text-primary-500">New Chat</span>
          </Dialog.Title>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                Chat Type
              </label>
              <select
                value={type || "doctor-patient"}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 dark:text-white transition-all font-bold"
              >
                {user?.type === "doctor" && (
                  <>
                    <option value="doctor-patient">Doctor-Patient</option>
                    <option value="doctor-caretaker">Doctor-Caretaker</option>
                  </>
                )}
                {user?.type === "caretaker" && (
                  <option value="caretaker-patient">Caretaker-Patient</option>
                )}
                {user?.type === "patient" && (
                  <>
                    <option value="doctor-patient">Doctor-Patient</option>
                    <option value="caretaker-patient">Caretaker-Patient</option>
                  </>
                )}
              </select>
            </div>

            {user?.type === "doctor" && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                  Select {type === "doctor-caretaker" ? "Caretaker" : "Patient"}
                </label>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 dark:text-white transition-all font-bold"
                  onChange={(e) => setParticipants([e.target.value])}
                >
                  <option value="">Choose from list...</option>
                  {type === "doctor-caretaker"
                    ? caretakerList.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.email}
                        </option>
                      ))
                    : patientList.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.email}
                        </option>
                      ))}
                </select>
              </div>
            )}

            {user?.type === "caretaker" && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                  Select Patient
                </label>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 dark:text-white transition-all font-bold"
                  onChange={(e) => setParticipants([e.target.value])}
                >
                  <option value="">Select patient...</option>
                  {patientList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {user?.type === "patient" && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                  User ID (Doctor/Caretaker)
                </label>
                <input
                  placeholder="Enter recipient ID..."
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 dark:text-white transition-all font-bold"
                  onChange={(e) => setParticipants([e.target.value])}
                />
              </div>
            )}
          </div>

          <button
            onClick={ensureChat}
            className="w-full bg-primary-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
          >
            Create/Open Chat
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const now = new Date();
    const msgTime = new Date(timestamp);
    const diff = now - msgTime;
    const oneDay = 24 * 60 * 60 * 1000;
    if (diff < 60000) return "Just Now";
    if (diff < oneDay)
      return msgTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    if (diff < 2 * oneDay) return "Yesterday";
    return msgTime.toLocaleDateString([], { day: "2-digit", month: "short" });
  };

  const filteredChats = chats.filter((chat) =>
    chat.participants
      .map((p) => p.email || p.name || "")
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div
      className={`flex h-[calc(100vh-40px)] mt-6 ml-6 transition-all duration-500 ${isDarkMode ? "bg-black" : "bg-white"} overflow-hidden rounded-[2.5rem] shadow-2xl border border-transparent dark:border-gray-800/50`}
    >
      {/* Sidebar */}
      <div className="w-1/3 max-w-xs border-r border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black dark:text-white tracking-tight">
              Messages
            </h2>
            {loadingChats && (
              <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-3 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all"
            title="Start new chat"
          >
            <UserPlus size={20} />
          </button>
        </div>

        {/* Filter Tabs for all roles */}
        {!initialType && (
          <div className="flex px-4 py-2 gap-2">
            <button
              onClick={() => {
                setType("");
                loadChats("");
              }}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!type ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
            >
              All
            </button>

            {user?.type === "patient" && (
              <>
                <button
                  onClick={() => {
                    setType("doctor-patient");
                    loadChats("doctor-patient");
                  }}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === "doctor-patient" ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "bg-gray-50 dark:bg-gray-800 text-gray-400"}`}
                >
                  Doctor
                </button>
                <button
                  onClick={() => {
                    setType("caretaker-patient");
                    loadChats("caretaker-patient");
                  }}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === "caretaker-patient" ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "bg-gray-50 dark:bg-gray-800 text-gray-400"}`}
                >
                  Caretaker
                </button>
              </>
            )}

            {user?.type === "doctor" && (
              <>
                <button
                  onClick={() => {
                    setType("doctor-patient");
                    loadChats("doctor-patient");
                  }}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === "doctor-patient" ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "bg-gray-50 dark:bg-gray-800 text-gray-400"}`}
                >
                  Patients
                </button>
                <button
                  onClick={() => {
                    setType("doctor-caretaker");
                    loadChats("doctor-caretaker");
                  }}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === "doctor-caretaker" ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "bg-gray-50 dark:bg-gray-800 text-gray-400"}`}
                >
                  Staff
                </button>
              </>
            )}

            {user?.type === "caretaker" && (
              <>
                <button
                  onClick={() => {
                    setType("caretaker-patient");
                    loadChats("caretaker-patient");
                  }}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === "caretaker-patient" ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "bg-gray-50 dark:bg-gray-800 text-gray-400"}`}
                >
                  Patients
                </button>
                <button
                  onClick={() => {
                    setType("doctor-caretaker");
                    loadChats("doctor-caretaker");
                  }}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === "doctor-caretaker" ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "bg-gray-50 dark:bg-gray-800 text-gray-400"}`}
                >
                  Doctor
                </button>
              </>
            )}
          </div>
        )}

        {/* Search bar */}
        <div className="p-4 pt-2">
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50/50 dark:bg-gray-800/50 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 dark:text-white transition-all outline-none border-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => openChat(chat)}
                className={`flex items-start gap-4 p-4 cursor-pointer rounded-2xl transition-all duration-300 ${
                  selectedChat?._id === chat._id
                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 group"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-lg font-black ${
                    selectedChat?._id === chat._id
                      ? "bg-white/20"
                      : "bg-gray-100 dark:bg-gray-800 text-primary-500 group-hover:bg-white dark:group-hover:bg-gray-700"
                  }`}
                >
                  {chat.participants
                    ?.find((p) => p._id !== user?.id)
                    ?.email?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3
                      className={`font-black truncate text-sm ${selectedChat?._id === chat._id ? "text-white" : "dark:text-white"}`}
                    >
                      {chat.participants?.find((p) => p._id !== user?.id)
                        ?.email || "Private Chat"}
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest ${selectedChat?._id === chat._id ? "text-white/70" : "text-gray-400"}`}
                    >
                      {formatTime(chat.updatedAt)}
                    </span>
                  </div>
                  <p
                    className={`text-xs truncate font-medium ${selectedChat?._id === chat._id ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {chat.messages?.slice(-1)[0]?.text || "No messages yet"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <MessageSquare className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
              <p className="text-gray-400 dark:text-gray-600 font-bold text-sm">
                No conversations
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {selectedChat ? (
          <>
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white font-black">
                  {selectedChat.participants
                    ?.find((p) => p._id !== user?.id)
                    ?.email?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <h2 className="text-lg font-black dark:text-white tracking-tight">
                    {selectedChat.participants?.find((p) => p._id !== user?.id)
                      ?.email || "Chat"}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary-500">
                    {selectedChat.type}
                  </p>
                </div>
              </div>
              <button className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-colors dark:text-gray-400">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar space-y-6 relative">
              {loadingMessages ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 transition-all duration-300">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-black text-primary-500 uppercase tracking-widest">
                      Syncing Messages...
                    </p>
                  </div>
                </div>
              ) : null}
              {messages.map((msg, i) => {
                const isMe =
                  msg.sender?._id === user?.id || msg.sender === user?.id;
                return (
                  <div
                    key={i}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%]`}
                    >
                      <div
                        className={`px-5 py-3 rounded-[1.5rem] text-sm font-medium shadow-sm ${
                          isMe
                            ? "bg-primary-500 text-white rounded-br-none"
                            : "bg-gray-50 dark:bg-gray-800 dark:text-gray-200 rounded-bl-none border border-transparent dark:border-gray-700/50"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1 px-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-[2rem] border border-transparent focus-within:ring-4 focus-within:ring-primary-500/10 transition-all">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold dark:text-white outline-none placeholder:text-gray-400"
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className={`p-4 rounded-[1.5rem] transition-all transform active:scale-95 ${
                    message.trim()
                      ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative">
            {loadingChats && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 transition-all duration-300">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                  <p className="text-sm font-black text-primary-500 uppercase tracking-widest">
                    Finding Conversations...
                  </p>
                </div>
              </div>
            )}
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-[2.5rem] flex items-center justify-center mb-6">
              <MessageSquare
                size={48}
                className="text-primary-500 animate-pulse"
              />
            </div>
            <h3 className="text-2xl font-black dark:text-white tracking-tight mb-2">
              Your Conversations
            </h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xs">
              Select a chat from the sidebar to start messaging your specialized
              clinical team.
            </p>
          </div>
        )}
      </div>

      {isModalOpen && renderModal()}
    </div>
  );
};

export default ChatPage;
