import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  Loader2,
  Shield,
  Mail,
  Phone,
  BookOpen,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function DoctorProfileForm({ initialData, isDarkMode, onProfileUpdate }) {
  const [formData, setFormData] = useState({
    degree: "",
    name: "",
    phone: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        degree: initialData.degree || "",
        name: initialData.name || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
      });
    }
  }, [initialData]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.put("/users/user-details", formData);
      if (res.data.success) {
        setSuccess("Profile updated successfully.");
        if (onProfileUpdate) onProfileUpdate();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update profile.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  const InputField = ({
    label,
    icon: Icon,
    name,
    type = "text",
    placeholder,
  }) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
          <Icon size={18} />
        </div>
        <input
          name={name}
          type={type}
          value={formData[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border-none rounded-3xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold dark:text-gray-200"
          required
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-2xl border border-transparent dark:border-gray-800/50 animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-4 bg-blue-500 rounded-[2rem] shadow-lg shadow-blue-500/30">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black dark:text-white tracking-tighter">
            Manage <span className="text-blue-500">Profile</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Keep your professional information up to date
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="flex items-center gap-3 p-5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-3xl border border-red-100 dark:border-red-900/30 text-sm font-bold">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 p-5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-3xl border border-green-100 dark:border-green-900/30 text-sm font-bold">
            <CheckCircle2 size={20} />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputField
            label="Full Name"
            icon={User}
            name="name"
            placeholder="Dr. John Smith"
          />
          <InputField
            label="Medical Degree"
            icon={BookOpen}
            name="degree"
            placeholder="MD, Neurology"
          />
          <InputField
            label="Contact Phone"
            icon={Phone}
            name="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
          />
          <InputField
            label="Public Email"
            icon={Mail}
            name="email"
            type="email"
            placeholder="doctor@clinic.com"
          />
        </div>

        <div className="flex justify-end pt-4 border-t dark:border-gray-800">
          <button
            type="submit"
            disabled={saving}
            className="px-10 py-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:shadow-2xl hover:shadow-blue-500/40 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Synchronizing...
              </>
            ) : (
              "Update Professional Info"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DoctorProfileForm;
