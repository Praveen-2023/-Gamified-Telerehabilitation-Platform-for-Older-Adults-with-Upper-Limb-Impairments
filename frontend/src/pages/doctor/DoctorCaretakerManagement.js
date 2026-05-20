import React, { useState, useEffect } from "react";
import { userService } from "../../services/userService";

const DoctorCaretakerManagement = () => {
  const [caretakers, setCaretakers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedCaretaker, setSelectedCaretaker] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await userService.getMyPatients();
        setCaretakers(res.caretakers || []);
        setPatients(res.patients || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const handleAssign = async () => {
    if (!selectedCaretaker || !selectedPatient) {
      return alert("Please select a caretaker and a patient.");
    }
    try {
      await userService.assignPatient({
        caretakerId: selectedCaretaker,
        patientId: selectedPatient,
      });
      alert("Patient assigned successfully!");
      setSelectedPatient("");
    } catch (error) {
      alert("Assignment failed.");
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Doctor Caretaker Management
        </h1>

        {/* Assignment Form */}
        <div className="p-6 bg-white rounded shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Assign Patient to Caretaker
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 font-semibold">
                Select a Caretaker
              </label>
              <select
                value={selectedCaretaker}
                onChange={(e) => setSelectedCaretaker(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Choose Caretaker --</option>
                {caretakers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold">
                Select a Patient
              </label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleAssign}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Assign Patient
          </button>
        </div>

        {/* Caretakers List */}
        <div className="p-6 bg-white rounded shadow-md">
          <h2 className="text-xl font-semibold mb-4">Caretakers List</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Name</th>
              </tr>
            </thead>
            <tbody>
              {caretakers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-2 text-center">
                    No caretakers found
                  </td>
                </tr>
              ) : (
                caretakers.map((c, index) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="p-2 border">{index + 1}</td>
                    <td className="p-2 border">{c.email}</td>
                    <td className="p-2 border">{c.name || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Patients List */}
        <div className="p-6 bg-white rounded shadow-md">
          <h2 className="text-xl font-semibold mb-4">Patients List</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Name</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-2 text-center">
                    No patients found
                  </td>
                </tr>
              ) : (
                patients.map((p, index) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="p-2 border">{index + 1}</td>
                    <td className="p-2 border">{p.email}</td>
                    <td className="p-2 border">{p.name || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorCaretakerManagement;
