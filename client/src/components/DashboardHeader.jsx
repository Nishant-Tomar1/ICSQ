import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/Avatar"
import Button from "./ui/Button"
import { Dropdown } from "./ui/dropdown-menu"

function DashboardHeader({ user }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()
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
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-gray-800">ICSQ.sobharealty.com</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link to="/survey/1" className="text-gray-600 hover:text-gray-900">
              Survey
            </Link>
            <Link to="/sipoc" className="text-gray-600 hover:text-gray-900">
              SIPOC
            </Link>
            <Link to="/action-plans" className="text-gray-600 hover:text-gray-900">
              Action Plans
            </Link>
            <Link to="/reports" className="text-gray-600 hover:text-gray-900">
              Reports
            </Link>
          </nav>

          <div className="flex items-center">
            <Dropdown
              trigger={
                <button className="relative h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" alt={user?.name || "User"} />
                    <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
                  </Avatar>
                </button>
              }
              items={[
                {
                  label: (
                    <div>
                      <p className="font-medium">{user?.name || "User"}</p>
                      <p className="text-xs text-gray-500">{user?.department || "Department"}</p>
                    </div>
                  ),
                  type: "label",
                },
                { type: "separator" },
                {
                  label: "Profile",
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  ),
                  onClick: () => navigate("/profile"),
                },
                {
                  label: "Logout",
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7z"
                        clipRule="evenodd"
                      />
                      <path d="M4 8a1 1 0 011-1h5a1 1 0 110 2H5a1 1 0 01-1-1z" />
                    </svg>
                  ),
                  onClick: handleLogout,
                },
              ]}
            />

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="md:hidden ml-2 p-2"
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
            </Button>
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
              to="/survey/1"
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
          </nav>
        )}
      </div>
    </header>
  )
}

export default DashboardHeader
