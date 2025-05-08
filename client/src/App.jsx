import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import SurveyPage from "./pages/SurveyPage"
import SurveyListPage from "./pages/SurveyListPage"
import SIPOCPage from "./pages/SIPOCPage"
import ActionPlansPage from "./pages/ActionPlansPage"
import ReportsPage from "./pages/ReportsPage"
import AdminDashboardPage from "./pages/admin/AdminDashboardPage"
import AdminDepartmentsPage from "./pages/admin/AdminDepartmentsPage"
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage"
import AdminUsersPage from "./pages/admin/AdminUsersPage"
import ProfilePage from "./pages/ProfilePage"
import ProtectedRoute from "./components/ProtectedRoute"
import AdminRoute from "./components/AdminRoute"
import Toast from "./components/ui/Toast"

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected routes for all users */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/survey"
          element={
            <ProtectedRoute>
              <SurveyListPage />
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
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <AdminRoute>
              <AdminDepartmentsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <AdminCategoriesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
      </Routes>
      <Toast />
    </>
  )
}

export default App
