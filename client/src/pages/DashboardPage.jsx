import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import DashboardHeader from "../components/DashboardHeader"
import DepartmentGrid from "../components/DepartmentGrid"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import Progress from "../components/ui/Progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs"

function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [departments, setDepartments] = useState([])
  const navigate = useNavigate()
  const { toast } = useToast()
  const { currentUser } = useAuth()

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // In a real app, this would fetch from your API
        // const response = await axios.get("/api/departments", { withCredentials: true });
        // setDepartments(response.data);

        // Mock data for demonstration
        setDepartments([])
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load departments",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDepartments()
  }, [toast])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  // Mock data for demonstration
  const departmentScores = [
    { id: 1, name: "Development", score: 68 },
    { id: 2, name: "Stay By Latinum", score: 69 },
    { id: 3, name: "SOBHA PMC", score: 72 },
    { id: 4, name: "LFM", score: 75 },
    { id: 5, name: "Procurement", score: 80 },
    { id: 6, name: "Marketing", score: 73 },
    { id: 7, name: "Finance & Accounts", score: 71 },
    { id: 8, name: "HR & Admin", score: 74 },
  ]

  const totalAverage = departmentScores.reduce((sum, dept) => sum + dept.score, 0) / departmentScores.length

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={currentUser} />

      <main className="container mx-auto py-6 px-4">
        <Tabs defaultValue="home">
          <TabsList className="mb-6">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="survey">Ready for ICSQ Survey</TabsTrigger>
            {/* <TabsTrigger value="sipoc">SIPOC</TabsTrigger> */}
            {/* <TabsTrigger value="action-plans">Action Plans</TabsTrigger> */}
            {/* <TabsTrigger value="reports">Reports</TabsTrigger> */}
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Your Department ICSQ %</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-4">
                    {currentUser?.department
                      ? departmentScores.find((d) => d.name === currentUser.department)?.score || "N/A"
                      : "N/A"}
                    %
                  </div>
                  <Progress
                    value={
                      currentUser?.department
                        ? departmentScores.find((d) => d.name === currentUser.department)?.score || 0
                        : 0
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Average ICSQ %</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-4">{totalAverage.toFixed(0)}%</div>
                  <Progress value={totalAverage} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Department ICSQ Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {departmentScores.map((dept) => (
                    <Card key={dept.id} className="border">
                      <CardContent className="p-4">
                        <div className="font-medium">{dept.name}</div>
                        <div className="flex items-center justify-between mt-2">
                          <Progress value={dept.score} className="h-2 flex-grow mr-2" />
                          <span className="font-bold">{dept.score}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6">
              <Button onClick={() => navigate("/survey/1")} className="px-8 py-3 text-lg">
                Start ICSQ Survey
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="survey">
            <Card>
              <CardHeader>
                <CardTitle>Ready for ICSQ Survey</CardTitle>
              </CardHeader>
              <CardContent>
                <DepartmentGrid onDepartmentSelect={(dept) => navigate(`/survey/${dept.id}`)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sipoc">
            <Card>
              <CardHeader>
                <CardTitle>SIPOC Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Manage your department's Supplier, Input, Process, Output, Customer information here.</p>
                <Button className="mt-4" onClick={() => navigate("/sipoc")}>
                  View SIPOC Details
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="action-plans">
            <Card>
              <CardHeader>
                <CardTitle>Action Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Track and manage action plans based on ICSQ survey feedback.</p>
                <Button className="mt-4" onClick={() => navigate("/action-plans")}>
                  View Action Plans
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Generate and download ICSQ survey reports.</p>
                <Button className="mt-4" onClick={() => navigate("/reports")}>
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default DashboardPage
