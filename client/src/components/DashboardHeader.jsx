import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { capitalizeFirstLetter } from "../Constants"
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

function DashboardHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { currentUser, logout, isAdmin } = useAuth()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      })
      navigate("/login")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      })
    }
  }

  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-blue-600"> <span className="hidden lg:block">ICSQ.sobharealty.com </span><span className="lg:hidden">ICSQ</span></span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">
              Home
            </Link>
            <Link to={`/survey`} className="text-gray-600 hover:text-blue-600 font-medium">
              Survey
            </Link>
            <Link to="/sipoc" className="text-gray-600 hover:text-blue-600 font-medium">
              SIPOC
            </Link>
            <Link to="/action-plans" className="text-gray-600 hover:text-blue-600 font-medium">
              Action Plans
            </Link>
            <Link to="/reports" className="text-gray-600 hover:text-blue-600 font-medium">
              Reports
            </Link>
            {isAdmin() && (
              <Link to="/admin" className="text-blue-600 hover:text-blue-800 font-medium">
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center">
            <div className="relative group">
              <button className="flex items-center space-x-2 focus:outline-none" onClick={()=> {setDrawerOpen(prev => !prev)}}>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                  {getInitials(currentUser?.name)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium">{currentUser?.name || "User"}</div>
                  <div className="text-xs text-gray-500">{currentUser.role || ""} {currentUser.role !== "admin" ? "- " + ( capitalizeFirstLetter(currentUser?.department?.name) || "Department") : ""}</div>
                </div>
                {drawerOpen ? <FaAngleUp/> :  <FaAngleDown/> }
              </button>

              {/* Dropdown */}
             {drawerOpen && 
             <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden ml-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden pt-4 pb-2 space-y-2">
            <Link
              to="/dashboard"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to={`/survey`}
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Survey
            </Link>
            <Link
              to="/sipoc"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              SIPOC
            </Link>
            <Link
              to="/action-plans"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Action Plans
            </Link>
            <Link
              to="/reports"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Reports
            </Link>
            {isAdmin() && (
              <Link
                to="/admin"
                className="block px-3 py-2 rounded-md text-blue-600 hover:bg-blue-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

export default DashboardHeader
