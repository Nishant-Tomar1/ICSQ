import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import DashboardHeader from "../components/DashboardHeader"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import Progress from "../components/ui/Progress"
import { capitalizeFirstLetter, Server } from "../Constants"
import axios from "axios"

function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [departmentScores, setDepartmentScores] = useState([])
  const [totalAverage, setTotalAverage] = useState(0)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { currentUser, isAdmin } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${Server}/analytics/department-scores`, { withCredentials: true });
        const data = response.data;
        // Filter scores based on user role
        let filteredScores = data
        if (!isAdmin()) {
          filteredScores = data.filter((dept) => dept.name === currentUser?.department?.name)
        }
        setDepartmentScores(filteredScores)

        // Calculate total average
        const avg = data.reduce((sum, dept) => sum + dept.score, 0) / data.lengthv || "N/A"
        setTotalAverage(avg)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  // Get user's department score
  const userDepartmentScore = departmentScores.find((dept) => dept.name === currentUser?.department?.name)?.score || "N/A"

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {currentUser?.name}</h1>
          <p className="text-gray-600">Here's an overview of your ICSQ performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Department ICSQ %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-4 text-blue-600">
                {typeof userDepartmentScore === "number" ? `${userDepartmentScore}%` : userDepartmentScore}
              </div>
              <Progress value={typeof userDepartmentScore === "number" ? userDepartmentScore : 0} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Average ICSQ %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-4 text-blue-600">{typeof totalAverage === "number" ? `${totalAverage}%` : totalAverage}</div>
              <Progress value={typeof totalAverage === "number" ? totalAverage : 0} />
            </CardContent>
          </Card>
        </div>

        {isAdmin() && <Card className="mb-8">
          <CardHeader>
            <CardTitle>Department ICSQ Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {departmentScores.map((dept) => (
                <Card key={dept._id} className="border">
                  <CardContent className="p-4">
                    <div className="font-medium">{capitalizeFirstLetter(dept.name)}</div>
                    <div className="flex items-center justify-between mt-2">
                      <Progress value={dept.score} className="h-2 flex-grow mr-2" />
                      <span className="font-bold text-blue-600">{dept.score}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>}

        <div className="flex justify-center mt-6">
          <Button onClick={() => navigate("/survey")} className="px-8 py-3 text-lg">
            Start ICSQ Survey
          </Button>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
