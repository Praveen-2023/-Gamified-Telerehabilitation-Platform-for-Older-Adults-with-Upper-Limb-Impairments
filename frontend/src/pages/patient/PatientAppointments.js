import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { appointmentService } from "../../services/appointmentService";
import { userService } from "../../services/userService";

const PatientAppointments = ({ isDarkMode }) => {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [weekStart, setWeekStart] = useState(new Date());

  useEffect(() => {
    const loadDoctor = async () => {
      const res = await userService.getUserFullDetails();
      const id = res.user?.createdBy || res.user?.doctorId;
      if (id) {
        setDoctorId(id);
      }
    };
    loadDoctor();
  }, []);

  useEffect(() => {
    if (doctorId) fetchSlots(doctorId, selectedDate);
  }, [selectedDate, doctorId]);

  const fetchSlots = async (docId, d) => {
    setLoading(true);
    try {
      const res = await appointmentService.getAvailability({
        doctorId: docId,
        date: d,
      });
      setSlots(res.availability?.slots || []);
    } finally {
      setLoading(false);
    }
  };

  const book = async (slot) => {
    setBooking(true);
    try {
      await appointmentService.book({
        doctorId,
        slotId: slot._id,
        date: selectedDate,
      });
      alert("Appointment booked successfully!");
      fetchSlots(doctorId, selectedDate);
      setSelectedSlot(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  };

  const getWeekDays = (start) => {
    const days = [];
    const curr = new Date(start);
    curr.setDate(curr.getDate() - curr.getDay()); // Start of week (Sunday)
    for (let i = 0; i < 7; i++) {
      days.push(new Date(curr).toISOString().split("T")[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  };

  const nextWeek = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  };

  const prevWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };

  const weekDays = getWeekDays(weekStart);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDayHeader = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const parseTime = (time) => parseInt(time.split(":")[0]);

  const morningSlots = slots.filter((s) => parseTime(s.startTime) < 12);
  const afternoonSlots = slots.filter(
    (s) => parseTime(s.startTime) >= 12 && parseTime(s.startTime) < 17,
  );
  const eveningSlots = slots.filter((s) => parseTime(s.startTime) >= 17);

  return (
    <div className="max-w-4xl mx-auto pb-12 px-4 md:px-0 fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-full bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all text-gray-400 hover:text-primary-500 border border-transparent dark:border-gray-800"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
            Appointments
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium italic">
            Schedule your next clinical session
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Calendar & Info */}
        <div className="space-y-6">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-800 dark:text-gray-200">
                Select Date
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevWeek}
                  disabled={new Date(weekStart) <= new Date(today)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors dark:text-gray-400"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextWeek}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:text-gray-400"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-[10px] font-bold text-gray-400 dark:text-gray-500 text-center uppercase tracking-widest"
                >
                  {day[0]}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((d, idx) => {
                const isSel = d === selectedDate;
                const dateObj = new Date(d);
                const dayNum = dateObj.getDate();
                const isPast = dateObj < new Date(today);

                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    disabled={isPast}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-sm transition-all relative
                      ${isSel ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-600 dark:text-gray-400"}
                      ${isPast ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span
                      className={`font-bold ${isSel ? "text-white" : "text-gray-800 dark:text-gray-200"}`}
                    >
                      {dayNum}
                    </span>
                    {isSel && (
                      <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="premium-card p-6 bg-primary-500 text-white shadow-xl shadow-primary-500/20">
            <h3 className="font-black mb-2 flex items-center gap-2 uppercase tracking-wide">
              <CheckCircle2 size={18} />
              Session Info
            </h3>
            <p className="text-primary-50 text-xs leading-relaxed font-medium">
              Appointments are usually 30-45 minutes long. Please arrive 5
              minutes early to prepare for your exercises.
            </p>
          </div>
        </div>

        {/* Right Column: Time Slots */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-8 min-h-[400px]">
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">
                {getDayHeader(selectedDate)}
              </h2>
              {loading && (
                <Loader2 className="animate-spin text-primary-500 w-5 h-5" />
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-primary-100 dark:border-gray-800 border-t-primary-500 rounded-full animate-spin"></div>
                <p className="text-gray-400 dark:text-gray-500 font-medium italic">
                  Finding available times...
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {!morningSlots.length &&
                !afternoonSlots.length &&
                !eveningSlots.length ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                      <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
                      No Slots Available
                    </h3>
                    <p className="text-gray-400 dark:text-gray-500 max-w-xs mx-auto text-sm">
                      There are no sessions available on this day. Please try
                      another date.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <SlotGroup
                      title="Morning"
                      icon={<Sun className="text-amber-500" size={18} />}
                      slots={morningSlots}
                      selectedSlot={selectedSlot}
                      setSelectedSlot={setSelectedSlot}
                      formatTime={formatTime}
                    />
                    <SlotGroup
                      title="Afternoon"
                      icon={<Sunset className="text-orange-500" size={18} />}
                      slots={afternoonSlots}
                      selectedSlot={selectedSlot}
                      setSelectedSlot={setSelectedSlot}
                      formatTime={formatTime}
                    />
                    <SlotGroup
                      title="Evening"
                      icon={<Moon className="text-indigo-400" size={18} />}
                      slots={eveningSlots}
                      selectedSlot={selectedSlot}
                      setSelectedSlot={setSelectedSlot}
                      formatTime={formatTime}
                    />
                  </div>
                )}

                {selectedSlot && (
                  <div className="pt-8 mt-8 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-primary-50 dark:bg-primary-900/10 p-6 rounded-[2rem] border border-primary-100 dark:border-primary-800/50">
                      <div>
                        <p className="text-[10px] text-primary-600 dark:text-primary-400 font-black uppercase tracking-widest mb-1">
                          Confirm Selection
                        </p>
                        <div className="flex items-center gap-2 text-primary-900 dark:text-white font-black text-2xl tracking-tight">
                          <Clock className="w-6 h-6 text-primary-500" />
                          {formatTime(selectedSlot.startTime)} -{" "}
                          {formatTime(selectedSlot.endTime)}
                        </div>
                      </div>
                      <button
                        onClick={() => book(selectedSlot)}
                        disabled={booking}
                        className="w-full md:w-auto px-10 py-4 bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-3"
                      >
                        {booking ? (
                          <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                          <CalendarIcon className="w-5 h-5" />
                        )}
                        {booking ? "Booking..." : "Confirm Appointment"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SlotGroup = ({
  title,
  icon,
  slots,
  selectedSlot,
  setSelectedSlot,
  formatTime,
}) => {
  if (slots.length === 0) return null;
  return (
    <div>
      <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {slots.map((slot, i) => (
          <button
            key={i}
            onClick={() => setSelectedSlot(slot)}
            className={`flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all duration-300
              ${
                selectedSlot?.startTime === slot.startTime
                  ? "bg-primary-500 border-primary-500 text-white font-black shadow-lg shadow-primary-500/20"
                  : "bg-white dark:bg-gray-800 border-transparent dark:border-gray-800 hover:border-primary-100 dark:hover:border-primary-900 text-gray-600 dark:text-gray-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10"
              }`}
          >
            <span className="text-sm font-bold">
              {formatTime(slot.startTime)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PatientAppointments;
