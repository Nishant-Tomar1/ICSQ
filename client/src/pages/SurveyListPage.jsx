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
  const [selectedDepartments, setSelectedDepartments] = useState([])
  const navigate = useNavigate()
  const { toast } = useToast()
  const { currentUser } = useAuth()

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${Server}/departments`, { withCredentials: true });
        const data = response.data;
        
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
    if (department._id === currentUser.department?._id){
      toast({
        title : "Selection not Allowed",
        description : "Cannot survey for your own department",
      })
      return
    } else if (currentUser?.surveyedDepartmentIds.includes(department._id) ){
      toast({
        title : "Selection not Allowed",
        description : "You already added survey for this department"
      })
      return
    }
    if (selectedDepartments.includes(department._id)){
      setSelectedDepartments(prev => prev.filter(dept => dept !== department._id ));
    }
    else setSelectedDepartments(prev => [...prev,department._id])
  }

  const handleStartSurvey = () => {
    if (selectedDepartments.length) {
      localStorage.setItem("selectedDepartments", JSON.stringify(selectedDepartments));
      navigate(`/survey/${selectedDepartments[0]}`)
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
              Select departments to evaluate. Your feedback helps improve internal customer satisfaction.
            </p>

            {/* Legend */}
          <div className="flex flex-wrap justify-center items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-100" />
              <span className="text-sm text-gray-600">Already Surveyed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-yellow-400 bg-yellow-100" />
              <span className="text-sm text-gray-600">Your Department</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-100" />
              <span className="text-sm text-gray-600">Selected Department(s)</span>
            </div>
          </div>



            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {departments.map((department) => (
                    <div
                    key={department._id}
                    className={`bg-white border rounded-lg shadow-sm cursor-pointer transition-all p-4 text-center ${
                      selectedDepartments.includes(department._id)
                        ? "border-2 border-blue-500 shadow-md"
                        : "hover:shadow-md hover:border-blue-300"
                    } ${currentUser?.surveyedDepartmentIds.includes(department._id)
                        && "border-2 border-green-500 shadow-md hover:shadow-md hover:border-green-300"
                    } ${currentUser?.department?._id === department?._id
                        && "border-2 border-yellow-400 shadow-md hover:shadow-md hover:border-yellow-300"
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
                <Button onClick={handleStartSurvey} disabled={!selectedDepartments.length} className="px-8 py-3 text-lg">
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
