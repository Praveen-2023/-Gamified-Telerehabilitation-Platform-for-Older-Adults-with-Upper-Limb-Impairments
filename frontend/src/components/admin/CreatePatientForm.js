import React, { useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const CreatePatientForm = ({ onPatientCreated }) => {
  const { user } = useAuth();

  console.log(user);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
    weight: "",
    height: "",
    blood: "",
    diagnosis: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      type: "patient",
      patientDetails: {
        weight: parseFloat(formData.weight) || null,
        height: parseFloat(formData.height) || null,
        blood: formData.blood,
        diagnosis: formData.diagnosis,
      },
    };

    try {
      await api.post("/users/create", payload);
      alert("Patient created and assigned successfully!");
      // Reset form and notify parent component
      setFormData({
        email: "",
        password: "",
        phone: "",
        weight: "",
        height: "",
        blood: "",
        diagnosis: "",
      });
      if (onPatientCreated) onPatientCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create patient.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 bg-white rounded-lg shadow-lg"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Create New Patient
      </h3>
      {error && (
        <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          name="email"
          type="email"
          placeholder="Patient Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="border p-2 rounded w-full"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="border p-2 rounded w-full"
        />
        <input
          name="phone"
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
          className="border p-2 rounded w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          name="weight"
          type="number"
          step="0.1"
          placeholder="Weight (kg)"
          value={formData.weight}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />
        <input
          name="height"
          type="number"
          step="0.1"
          placeholder="Height (cm)"
          value={formData.height}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />
        <input
          name="blood"
          type="text"
          placeholder="Blood Type"
          value={formData.blood}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />
        <input
          name="diagnosis"
          type="text"
          placeholder="Initial Diagnosis"
          value={formData.diagnosis}
          onChange={handleChange}
          className="border p-2 rounded w-full col-span-1 md:col-span-4"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Creating..." : "Create Patient"}
      </button>
    </form>
  );
};

export default CreatePatientForm;
