import React, { useState } from "react";
import { appointmentService } from "../../services/appointmentService";

const AvailabilityPage = () => {
  const [form, setForm] = useState({
    startTime: "09:00",
    endTime: "17:00",
    slotMinutes: 30,
  });
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await appointmentService.setAvailability(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-3">
      <div className="text-xl font-semibold">Set Availability</div>
      <label className="block">Start Time</label>
      <input
        type="time"
        className="border p-2 rounded w-full"
        value={form.startTime}
        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
      />
      <label className="block">End Time</label>
      <input
        type="time"
        className="border p-2 rounded w-full"
        value={form.endTime}
        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
      />
      <label className="block">Slot Minutes</label>
      <input
        type="number"
        className="border p-2 rounded w-full"
        value={form.slotMinutes}
        onChange={(e) =>
          setForm({ ...form, slotMinutes: Number(e.target.value) })
        }
      />
      <button
        onClick={save}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Save
      </button>
      {saved && <div className="text-green-600 text-sm">Saved!</div>}
    </div>
  );
};

export default AvailabilityPage;
