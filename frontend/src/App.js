import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import OTPVerificationPage from "./pages/auth/OTPVerificationPage";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import PatientAnalytics from "./pages/doctor/PatientAnalytics";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientAppointments from "./pages/patient/PatientAppointments";
import ChatPage from "./pages/common/ChatPage";
import RemindersPage from "./pages/common/RemindersPage";
import AvailabilityPage from "./pages/doctor/AvailabilityPage";
import SchedulePage from "./pages/doctor/SchedulePage";
import DoctorCaretakerManagement from "./pages/doctor/DoctorCaretakerManagement";

import CaretakerDashboard from "./pages/caretaker/CaretakerDashboard";
import GamePage from "./pages/game/GamePage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import CreatePatientForm from "./components/admin/CreatePatientForm";
import DoctorProfileForm from "./pages/doctor/DoctorProfileForm";
import PatientSetting from "./pages/patient/PatientSetting";
import GamePage2 from "./pages/game/GamePage2";
import DrawingGame from "./pages/game/GamePage3(boardDrawing)";
import GamePage2BallBasket from "./pages/game/GamePage4(ball&basket)";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<OTPVerificationPage />} />
          <Route
            path="/doctor/manage-caretakers"
            element={
              <ProtectedRoute allowedTypes={["doctor"]}>
                <DoctorCaretakerManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedTypes={["doctor"]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patient/:patientId"
            element={
              <ProtectedRoute allowedTypes={["doctor"]}>
                <PatientAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedTypes={["patient"]}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedTypes={["patient"]}>
                <PatientAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute allowedTypes={["doctor", "patient", "caretaker"]}>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reminders"
            element={
              <ProtectedRoute allowedTypes={["doctor", "patient", "caretaker"]}>
                <RemindersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/availability"
            element={
              <ProtectedRoute allowedTypes={["doctor"]}>
                <AvailabilityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/schedule"
            element={
              <ProtectedRoute allowedTypes={["doctor"]}>
                <SchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caretaker/dashboard"
            element={
              <ProtectedRoute allowedTypes={["caretaker"]}>
                <CaretakerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game"
            element={
              <ProtectedRoute allowedTypes={["patient", "caretaker"]}>
                <GamePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/game2"
            element={
              <ProtectedRoute allowedTypes={["patient", "caretaker"]}>
                <GamePage2 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game3"
            element={
              <ProtectedRoute allowedTypes={["patient", "caretaker"]}>
                <DrawingGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game4"
            element={
              <ProtectedRoute allowedTypes={["patient", "caretaker"]}>
                <GamePage2BallBasket />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute allowedTypes={["doctor", "patient"]}>
                <DoctorProfileForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/setting"
            element={
              <ProtectedRoute allowedTypes={["patient"]}>
                <PatientSetting />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/create-patient"
            element={
              <ProtectedRoute allowedTypes={["doctor"]}>
                {/* This page will now render your form */}
                <div className="p-6 bg-gray-100 min-h-screen">
                  <CreatePatientForm
                    onPatientCreated={() => {
                      /* optional callback */
                    }}
                  />
                </div>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
