import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import DashboardHeader from "../components/DashboardHeader"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import { capitalizeFirstLetter, Server } from "../Constants"
import axios from "axios"

function SurveyListPage() {
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { currentUser } = useAuth()

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${Server}/departments`, { withCredentials: true });
        const data = response.data;

        // // Mock data for demonstration
        // const mockDepartments = [
        //   { id: 1, name: "Development", description: "Real Estate Development" },
        //   { id: 2, name: "Stay By Latinum", description: "Hospitality Services" },
        //   { id: 3, name: "Audit & Assurance", description: "Internal Audit" },
        //   { id: 4, name: "HR & Admin", description: "Human Resources" },
        //   { id: 5, name: "Group IT", description: "Information Technology" },
        //   { id: 6, name: "Procurement", description: "Procurement Services" },
        //   { id: 7, name: "SCM", description: "Supply Chain Management" },
        //   { id: 8, name: "Marketing", description: "Marketing Services" },
        //   { id: 9, name: "Finance & Accounts", description: "Financial Services" },
        //   { id: 10, name: "PNC Architects", description: "Architecture Services" },
        //   { id: 11, name: "SOBHA PMC", description: "Project Management" },
        //   { id: 12, name: "LFM", description: "Facilities Management" },
        // ]

        // Filter out user's own department
        const filteredDepartments = data.filter((dept) => dept.name !== currentUser?.department)
        setDepartments(filteredDepartments)
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
  }, [toast, currentUser])

  const handleDepartmentClick = (department) => {
    setSelectedDepartment(department)
  }

  const handleStartSurvey = () => {
    if (selectedDepartment) {
      navigate(`/survey/${selectedDepartment._id}`)
    } else {
      toast({
        title: "Selection Required",
        description: "Please select a department to proceed",
        variant: "destructive",
      })
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="container mx-auto py-8 px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ready for ICSQ Survey</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-gray-600">
              Select a department to evaluate. Your feedback helps improve internal customer satisfaction.
            </p>

            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {departments.map((department) => (
                  (department._id !== currentUser?.department._id) &&
                    <div
                    key={department._id}
                    className={`bg-white border rounded-lg shadow-sm cursor-pointer transition-all p-4 text-center ${
                      selectedDepartment?._id === department._id
                        ? "border-2 border-blue-500 shadow-md"
                        : "hover:shadow-md hover:border-blue-300"
                    } ${currentUser?.surveyedDepartmentIds.includes(department._id)
                        ? "border-2 border-green-500 shadow-md hover:shadow-md hover:border-green-300"
                        : ""
                    }`}
                    onClick={() => handleDepartmentClick(department)}
                  >
                    <div className="h-16 flex items-center justify-center">
                      <span className="font-medium">{capitalizeFirstLetter(department.name)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-8">
                <Button onClick={handleStartSurvey} disabled={!selectedDepartment} className="px-8 py-3 text-lg">
                  Start Survey
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default SurveyListPage
