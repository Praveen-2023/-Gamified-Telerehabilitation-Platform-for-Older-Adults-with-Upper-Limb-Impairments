import React, { useState, useEffect, useMemo } from "react";
import { appointmentService } from "../../services/appointmentService";
import { useAuth } from "../../context/AuthContext";

const fmt = (d) => d.toISOString().slice(0, 10);

const SchedulePage = () => {
  const { isDarkMode } = useAuth();
  const [days, setDays] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState({
    startTime: "09:00",
    endTime: "17:00",
    slotMinutes: 30,
  });
  const [form, setForm] = useState({
    startTime: "09:00",
    endTime: "17:00",
    slotMinutes: 30,
  });
  const [saved, setSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const arr = [];
    for (let offset = -1; offset <= 7; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      arr.push(d);
    }
    setDays(arr);

    const load = async () => {
      try {
        const avail = await appointmentService.getAvailability({
          date: fmt(today),
        });
        const baseAvail = {
          startTime: avail.availability?.startTime || "09:00",
          endTime: avail.availability?.endTime || "17:00",
          slotMinutes: avail.availability?.slotMinutes || 30,
        };
        setAvailability(baseAvail);
        setForm(baseAvail);

        const perDayAvailability = new Map();
        for (const d of arr) {
          try {
            const dayAvail = await appointmentService.getAvailability({
              date: fmt(d),
            });
            console.log("dayAvail", dayAvail);
            perDayAvailability.set(fmt(d), dayAvail.availability?.slots || []);
          } catch (e) {
            perDayAvailability.set(fmt(d), []);
          }
        }

        const synthesized = [];
        const genSlots = (startTime, endTime, slotMinutes) => {
          const out = [];
          const [sh, sm] = (startTime || "09:00").split(":").map(Number);
          const [eh, em] = (endTime || "17:00").split(":").map(Number);
          let cur = sh * 60 + sm;
          const end = eh * 60 + em;
          while (cur + slotMinutes <= end) {
            const sH = String(Math.floor(cur / 60)).padStart(2, "0");
            const sM = String(cur % 60).padStart(2, "0");
            const eTot = cur + slotMinutes;
            const eH = String(Math.floor(eTot / 60)).padStart(2, "0");
            const eM = String(eTot % 60).padStart(2, "0");
            out.push({ startTime: `${sH}:${sM}`, endTime: `${eH}:${eM}` });
            cur += slotMinutes;
          }
          return out;
        };

        const baseSlots = genSlots(
          baseAvail.startTime,
          baseAvail.endTime,
          baseAvail.slotMinutes,
        );
        for (const d of arr) {
          const key = fmt(d);
          const availSlots = new Set(
            (perDayAvailability.get(key) || []).map(
              (s) => `${s.startTime}-${s.endTime}`,
            ),
          );
          baseSlots.forEach((slot) => {
            const slotKey = `${slot.startTime}-${slot.endTime}`;
            if (!availSlots.has(slotKey)) {
              synthesized.push({
                date: d,
                startTime: slot.startTime,
                endTime: slot.endTime,
                patient: { email: "—" },
              });
            }
          });
        }
        // console.log("synthesized", synthesized)
        setAppointments(synthesized);
      } catch (e) {
        setAppointments([]);
      }
    };
    load();
  }, []);

  // console.log(appointments)

  const timeSlots = useMemo(() => {
    const out = [];
    const [sh, sm] = (availability.startTime || "09:00").split(":").map(Number);
    const [eh, em] = (availability.endTime || "17:00").split(":").map(Number);
    const step = availability.slotMinutes || 30;
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur + step <= end) {
      const sH = String(Math.floor(cur / 60)).padStart(2, "0");
      const sM = String(cur % 60).padStart(2, "0");
      const eTot = cur + step;
      const eH = String(Math.floor(eTot / 60)).padStart(2, "0");
      const eM = String(eTot % 60).padStart(2, "0");
      out.push({ startTime: `${sH}:${sM}`, endTime: `${eH}:${eM}` });
      cur += step;
    }
    return out;
  }, [availability]);

  const apptKey = (d, slot) => `${fmt(d)}_${slot.startTime}-${slot.endTime}`;
  const bookedMap = useMemo(() => {
    const m = new Map();
    appointments.forEach((a) =>
      m.set(`${fmt(new Date(a.date))}_${a.startTime}-${a.endTime}`, a),
    );
    return m;
  }, [appointments]);

  const saveAvailability = async () => {
    await appointmentService.setAvailability(form);
    setAvailability(form);
    setSaved(true);
    setShowModal(false);
    setTimeout(() => setSaved(false), 1500);
  };

  // calculate dynamic row height to fit viewport
  const rowHeight = Math.max(
    40,
    Math.floor((window.innerHeight - 120) / timeSlots.length),
  );

  return (
    <div
      className={`h-screen flex flex-col transition-colors duration-500 ${isDarkMode ? "bg-black text-white" : "bg-gray-50 text-gray-800"}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="text-2xl font-black tracking-tight">Schedule</div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-xl shadow-primary-500/20"
        >
          Set Availability
        </button>
      </div>

      {/* Schedule Table */}
      <div className="flex-1 overflow-auto p-2">
        <div
          className="inline-grid min-w-full"
          style={{ gridTemplateColumns: `150px repeat(${days.length}, 1fr)` }}
        >
          {/* Header */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10"></div>
          {days.map((d, i) => (
            <div
              key={i}
              className="p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 text-center sticky top-0 z-10"
            >
              {d.toLocaleDateString()}
            </div>
          ))}

          {/* Time Slots */}
          {timeSlots.map((slot, rIdx) => (
            <React.Fragment key={`slot-row-${rIdx}`}>
              <div
                key={`t-${rIdx}`}
                className="p-3 border-r border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter sticky left-0 bg-white dark:bg-gray-900 z-10"
                style={{ height: rowHeight }}
              >
                {slot.startTime} - {slot.endTime}
              </div>
              {days.map((d, cIdx) => {
                const a = bookedMap.get(apptKey(d, slot));
                return (
                  <div
                    key={`c-${rIdx}-${cIdx}`}
                    className={`p-2 border border-gray-200 text-center rounded transition-colors duration-150 
                      ${a ? "bg-red-50 hover:bg-red-100" : "bg-green-50 hover:bg-green-100"}`}
                    style={{ height: rowHeight }}
                  >
                    {a ? (
                      <div className="text-[10px] flex flex-col justify-center h-full gap-1">
                        <div className="font-black uppercase tracking-widest text-red-600 dark:text-red-400">
                          Booked
                        </div>
                        <div className="text-gray-700 dark:text-gray-300 font-medium truncate">
                          {a.patient?.email || "—"}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400 flex items-center justify-center h-full">
                        Available
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Modal for Availability */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl border dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <div className="text-xl font-black tracking-tight dark:text-white">
                Set Availability
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  className="border dark:border-gray-700 p-3 rounded-xl w-full bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/50"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  className="border dark:border-gray-700 p-3 rounded-xl w-full bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/50"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Slot Minutes
                </label>
                <input
                  type="number"
                  className="border dark:border-gray-700 p-3 rounded-xl w-full bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/50"
                  value={form.slotMinutes}
                  onChange={(e) =>
                    setForm({ ...form, slotMinutes: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <button
              onClick={saveAvailability}
              className="mt-8 bg-primary-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs w-full shadow-xl shadow-primary-500/20 hover:bg-primary-600 transition"
            >
              Save Changes
            </button>
            {saved && (
              <div className="text-green-500 text-xs font-bold mt-4 text-center animate-bounce">
                ✓ Successfully Saved!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
