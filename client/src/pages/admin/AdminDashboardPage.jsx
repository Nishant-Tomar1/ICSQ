import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useToast } from "../../contexts/ToastContext"
import DashboardHeader from "../../components/DashboardHeader"
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card"
import Button from "../../components/ui/Button"
import { Server } from "../../Constants"
import axios from "axios"

function AdminDashboardPage() {
  const [stats, setStats] = useState({
    departments: 0,
    users: 0,
    surveys: 0,
    actionPlans: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${Server}/analytics/stats`, { withCredentials: true });
        setStats(response.data);

      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load admin statistics",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen ">
        <DashboardHeader />
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen ">
      <DashboardHeader />

      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[goldenrod]">Admin Dashboard</h1>
          <p className="text-gray-200">Manage departments, categories, users and view system statistics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#1a1a1f]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">Total Departments</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.departments}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1f]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">Total Users</p>
                  <p className="text-3xl font-bold text-green-600">{stats.users}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1f]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">Surveys Completed</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.surveys}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1f]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">Action Plans</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.actionPlans}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-orange-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-[#1a1a1f]">
            <CardHeader>
              <CardTitle className="text-[goldenrod]">Manage Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Add, edit, or remove departments in the system.</p>
              <Link to="/admin/departments">
                <Button className="w-full">Manage Departments</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1f]">
            <CardHeader>
              <CardTitle className="text-[goldenrod]">Department Mappings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Configure which departments can review other departments.</p>
              <Link to="/admin/department-mappings">
                <Button className="w-full">Manage Mappings</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1f]">
            <CardHeader>
              <CardTitle className="text-[goldenrod]">Manage Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Configure survey categories and questions. Add, edit or remove categories.</p>
              <Link to="/admin/categories">
                <Button className="w-full">Manage Categories</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1f]">
            <CardHeader>
              <CardTitle className="text-[goldenrod]">Manage Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Add, edit, or remove users and set permissions.</p>
              <Link to="/admin/users">
                <Button className="w-full">Manage Users</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1f]">
            <CardHeader>
              <CardTitle className="text-[goldenrod]">Survey Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">View detailed survey responses, feedback, and department-wise analytics.</p>
              <Link to="/admin/survey-analytics">
                <Button className="w-full">View Analytics</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboardPage
