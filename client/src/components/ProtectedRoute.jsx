import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth()
  const location = useLocation()

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

  if (!currentUser) {
    // Redirect to login page but save the current location they were trying to access
    // return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
