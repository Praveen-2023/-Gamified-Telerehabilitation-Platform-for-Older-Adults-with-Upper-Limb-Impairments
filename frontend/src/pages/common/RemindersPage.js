import React, { useEffect, useState, useCallback } from "react";
import { reminderService } from "../../services/reminderService";
import { userService } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

const RemindersPage = () => {
  const { user } = useAuth();
  const [patientId, setPatientId] = useState("");
  const [reminders, setReminders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    title: "",
    text: "",
    date: "",
    time: "",
    isRecurring: false,
  });

  console.log(reminders);

  const isDoctor = user?.type === "doctor";
  const isCaretaker = user?.type === "caretaker";

  const refresh = useCallback(
    async (pid) => {
      const res = await reminderService.listForPatient(
        pid || (isDoctor || isCaretaker ? patientId : undefined),
      );
      setReminders(res.reminders || []);
    },
    [patientId, isDoctor, isCaretaker],
  );

  useEffect(() => {
    const load = async () => {
      if (isDoctor) {
        const res = await userService.getMyPatients();
        setPatients(res.patients || []);
      } else if (isCaretaker) {
        const res = await userService.getCaretakerPatients();
        setPatients(res.patients || []);
      }
      await refresh();
    };
    load();
  }, [isDoctor, isCaretaker, refresh]);

  const create = async () => {
    const payload = {
      patientId: isDoctor || isCaretaker ? patientId : undefined,
      ...form,
    };
    if ((isDoctor || isCaretaker) && !patientId) return alert("Select patient");
    await reminderService.create(payload);
    setForm({ title: "", text: "", date: "", time: "", isRecurring: false });
    await refresh();
  };

  const complete = async (id) => {
    await reminderService.complete(id);
    await refresh();
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      {(isDoctor || isCaretaker) && (
        <div className="flex gap-2">
          <select
            className="border p-2 rounded"
            value={patientId}
            onChange={(e) => {
              setPatientId(e.target.value);
              refresh(e.target.value);
            }}
          >
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.email}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="border rounded p-3 space-y-2">
        <div className="font-semibold">Create Reminder</div>
        <input
          className="border p-2 w-full rounded"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="border p-2 w-full rounded"
          placeholder="Text"
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
        />
        <div className="flex gap-2">
          <input
            type="date"
            className="border p-2 rounded"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <input
            type="time"
            className="border p-2 rounded"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) =>
                setForm({ ...form, isRecurring: e.target.checked })
              }
            />
            Daily recurring
          </label>
          <button
            onClick={create}
            className="ml-auto bg-green-600 text-white px-4 rounded"
          >
            Create
          </button>
        </div>
      </div>

      <div className="border rounded">
        <div className="p-3 border-b font-semibold">Reminders</div>
        <div className="p-3 space-y-2">
          {reminders.map((r) => (
            <div
              key={r._id}
              className="border rounded p-2 flex items-center gap-2"
            >
              <div className="flex-1">
                <div className="font-medium">{r.title}</div>
                <div className="text-sm text-gray-600">{r.text}</div>
                <div className="text-xs text-gray-500">
                  {new Date(r.date).toLocaleDateString()} {r.time} • {r.status}
                </div>
              </div>
              {r.status !== "completed" && (
                <button
                  onClick={() => complete(r._id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Mark done
                </button>
              )}
            </div>
          ))}
          {reminders.length === 0 && (
            <div className="text-sm text-gray-500">No reminders</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemindersPage;
