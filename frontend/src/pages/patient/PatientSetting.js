import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  User,
  Phone,
  Mail,
  Award,
  Scale,
  Ruler,
  Droplets,
  Save,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function PatientSetting() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    degree: "",
    patientDetails: {
      weight: "",
      height: "",
      blood: "",
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  async function fetchProfileDetails() {
    try {
      const res = await api.get("/users/get-user-details");
      if (res.data.success) {
        const u = res.data.user;
        setFormData({
          name: u.name || "",
          phone: u.phone || "",
          email: u.email || "",
          degree: u.degree || "",
          patientDetails: {
            weight: u.patientDetails?.weight || "",
            height: u.patientDetails?.height || "",
            blood: u.patientDetails?.blood || "",
          },
        });
      } else {
        setError("Failed to load profile details.");
      }
    } catch (err) {
      setError("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name.startsWith("pd_")) {
      const field = name.replace("pd_", "");
      setFormData((prev) => ({
        ...prev,
        patientDetails: { ...prev.patientDetails, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.put("/users/user-details", formData);
      if (res.data.success) {
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update profile.");
      }
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary-500 w-8 h-8" />
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-primary-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500">
            Manage your profile and health metrics
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-2xl text-sm font-medium">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="premium-card p-8">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-500" />
              Personal Information
            </h2>

            <div className="space-y-5">
              <InputGroup
                label="Full Name"
                icon={<User size={18} />}
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
              />
              <InputGroup
                label="Email Address"
                icon={<Mail size={18} />}
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                type="email"
              />
              <InputGroup
                label="Phone Number"
                icon={<Phone size={18} />}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 890"
              />
              <InputGroup
                label="Occupation/Degree"
                icon={<Award size={18} />}
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                placeholder="Student / Professional"
              />
            </div>
          </div>

          {/* Health Metrics */}
          <div className="premium-card p-8">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Scale className="w-5 h-5 text-secondary-500" />
              Health Metrics
            </h2>

            <div className="space-y-5">
              <InputGroup
                label="Weight (kg)"
                icon={<Scale size={18} />}
                name="pd_weight"
                value={formData.patientDetails.weight}
                onChange={handleChange}
                placeholder="70"
                type="number"
              />
              <InputGroup
                label="Height (cm)"
                icon={<Ruler size={18} />}
                name="pd_height"
                value={formData.patientDetails.height}
                onChange={handleChange}
                placeholder="175"
                type="number"
              />
              <InputGroup
                label="Blood Group"
                icon={<Droplets size={18} />}
                name="pd_blood"
                value={formData.patientDetails.blood}
                onChange={handleChange}
                placeholder="A+"
              />
            </div>

            <div className="mt-8 p-4 bg-secondary-50 rounded-2xl border border-secondary-100 italic text-xs text-secondary-700">
              Note: These metrics are used to personalize your therapy plan and
              track physical progress over time.
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-primary-600 disabled:opacity-50 transition-all shadow-lg shadow-primary-200 active:scale-95"
          >
            {saving ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

const InputGroup = ({ label, icon, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
        {icon}
      </div>
      <input
        {...props}
        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-primary-100 focus:ring-4 focus:ring-primary-50 transition-all outline-none rounded-2xl text-gray-700 placeholder:text-gray-300 border-2"
      />
    </div>
  </div>
);

export default PatientSetting;
