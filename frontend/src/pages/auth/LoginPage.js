import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { LogIn, Mail, Lock, User, Stethoscope, Shield } from "lucide-react";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.login(formData);
      login(response.user, response.token);

      if (response.user.type === "doctor") {
        navigate("/doctor/dashboard");
      } else if (response.user.type === "patient") {
        navigate("/patient/dashboard");
      } else if (response.user.type === "caretaker") {
        navigate("/caretaker/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email, password) => {
    setError("");
    setLoading(true);
    setFormData({ email, password });

    try {
      const response = await authService.login({ email, password });
      login(response.user, response.token);

      if (response.user.type === "doctor") {
        navigate("/doctor/dashboard");
      } else if (response.user.type === "patient") {
        navigate("/patient/dashboard");
      } else if (response.user.type === "caretaker") {
        navigate("/caretaker/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-200 rounded-lg p-8 w-full max-w-md shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#69CBEE] text-white mb-3">
            <LogIn className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-1">Sign in to continue</p>
        </div>

        <div className="text-center text-xs uppercase text-gray-400 my-6 flex items-center">
          <span className="border-t  border-gray-300 flex-grow mr-2"></span>
          Quick Demo Logins
          <span className="border-t border-gray-300 flex-grow ml-2"></span>
        </div>

        {/* Demo Buttons Section - 3 in a row */}
        <div className="mb-5">
          {/* <p className="text-center text-sm text-gray-600 mb-4">Quick Demo Logins</p> */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() =>
                handleDemoLogin("patient@gmail.com", "a@gmail.com")
              }
              disabled={loading}
              className="flex items-center px-2 justify-center w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md text-sm font-medium transition disabled:opacity-50"
            >
              <User className="" />
              Demo as Patient
            </button>

            <button
              onClick={() =>
                handleDemoLogin("doctor@gmail.com", "vipul%colab25")
              }
              disabled={loading}
              className="flex items-center px-2 justify-center w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md text-sm font-medium transition disabled:opacity-50"
            >
              <Stethoscope className="" />
              Demo as Doctor
            </button>

            <button
              onClick={() =>
                handleDemoLogin("caretaker@gmail.com", "aa@gmail.com")
              }
              disabled={loading}
              className="flex items-center px-2 justify-center w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md text-sm font-medium transition disabled:opacity-50"
            >
              <Shield className="" />
              Demo as Caretaker
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="text-center text-xs text-gray-400 my-6 flex items-center">
          <span className="border-t border-gray-300 flex-grow mr-2"></span>
          OR SIGN IN MANUALLY
          <span className="border-t border-gray-300 flex-grow ml-2"></span>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#2F71EB] focus:border-[#2F71EB] text-sm outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#2F71EB] focus:border-[#2F71EB] text-sm outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Error Box */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2F71EB] hover:bg-[#2763CF] text-white py-2 rounded-md text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-5 text-center space-y-2">
          <Link
            to="/forgot-password"
            className="text-[#2F71EB] hover:underline text-sm"
          >
            Forgot your password?
          </Link>

          <div className="text-xs text-gray-400 flex items-center justify-center">
            <span className="border-t border-gray-300 flex-grow mr-2"></span>
            New here?
            <span className="border-t border-gray-300 flex-grow ml-2"></span>
          </div>

          <Link
            to="/register"
            className="text-[#2F71EB] hover:underline text-sm"
          >
            Create a Doctor Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
