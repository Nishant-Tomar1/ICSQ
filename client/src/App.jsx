import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import SurveyPage from "./pages/SurveyPage"
import SIPOCPage from "./pages/SIPOCPage"
import ActionPlansPage from "./pages/ActionPlansPage"
import ReportsPage from "./pages/ReportsPage"
import ProtectedRoute from "./components/ProtectedRoute"
import Toast from "./components/ui/Toast"

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/survey/:departmentId"
          element={
            <ProtectedRoute>
              <SurveyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sipoc"
          element={
            <ProtectedRoute>
              <SIPOCPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/action-plans"
          element={
            <ProtectedRoute>
              <ActionPlansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toast />
    </>
  )
}

export default App
