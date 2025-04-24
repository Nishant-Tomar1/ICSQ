import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import DashboardHeader from "../components/DashboardHeader"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import Textarea from "../components/ui/Textarea"
import { RadioGroup, RadioItem } from "../components/ui/RadioGroup"

function SurveyPage() {
  const { departmentId } = useParams()
  const [department, setDepartment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({})
  const [currentExpectation, setCurrentExpectation] = useState("")
  const navigate = useNavigate()
  const { toast } = useToast()
  const { currentUser } = useAuth()

  // Survey categories based on the PDF
  const categories = [
    { id: "quality", name: "Quality of Work" },
    { id: "communication", name: "Communication & Responsiveness" },
    { id: "process", name: "Process Efficiency & Timelines" },
    { id: "collaboration", name: "Collaboration & Support" },
    { id: "deadlines", name: "Meeting Deadlines and Commitments" },
    { id: "resolution", name: "Problem Resolution & Issue Handling" },
    { id: "overall", name: "Overall Satisfaction" },
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, fetch department data from API
        // const deptResponse = await axios.get(`/api/departments/${departmentId}`, { withCredentials: true });
        // setDepartment(deptResponse.data);

        // Mock department data
        const mockDepartment = {
          id: departmentId,
          name: getDepartmentName(departmentId),
          description: "Department Description",
        }
        setDepartment(mockDepartment)

        // Initialize form data
        const initialFormData = {}
        categories.forEach((category) => {
          initialFormData[category.id] = {
            rating: "",
            expectations: [],
          }
        })
        setFormData(initialFormData)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load survey data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [departmentId, toast])

  const getDepartmentName = (id) => {
    const departmentMap = {
      1: "Development",
      2: "Stay By Latinum",
      3: "Audit & Assurance",
      4: "HR & Admin",
      5: "Group IT",
      6: "Procurement",
      7: "SCM",
      8: "Marketing",
      9: "Finance & Accounts",
      10: "PNC Architects",
      11: "SOBHA PMC",
      12: "LFM",
    }

    return departmentMap[id] || "Unknown Department"
  }

  const handleRatingChange = (categoryId, value) => {
    setFormData((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        rating: value,
      },
    }))
  }

  const handleAddExpectation = (categoryId) => {
    if (!currentExpectation.trim()) return

    setFormData((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        expectations: [...prev[categoryId].expectations, currentExpectation.trim()],
      },
    }))

    setCurrentExpectation("")
  }

  const handleRemoveExpectation = (categoryId, index) => {
    setFormData((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        expectations: prev[categoryId].expectations.filter((_, i) => i !== index),
      },
    }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // Validate form data
      const invalidCategories = categories.filter((category) => !formData[category.id].rating)

      if (invalidCategories.length > 0) {
        toast({
          title: "Incomplete Survey",
          description: `Please provide ratings for all categories`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // In a real app, submit to API
      // await axios.post(
      //   "/api/surveys",
      //   {
      //     fromDepartment: currentUser.department,
      //     toDepartment: department.name,
      //     responses: formData,
      //     date: new Date(),
      //   },
      //   { withCredentials: true },
      // );

      toast({
        title: "Survey Submitted",
        description: `Your feedback for ${department.name} has been recorded`,
      })

      navigate("/dashboard")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit survey",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={currentUser} />

      <main className="container mx-auto py-6 px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>ICSQ Survey for {department.name}</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="space-y-8">
          {categories.map((category) => (
            <Card key={category.id} className="border">
              <CardHeader>
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Rating</h4>
                  <RadioGroup
                    value={formData[category.id]?.rating || ""}
                    onValueChange={(value) => handleRatingChange(category.id, value)}
                    className="flex flex-wrap gap-4"
                  >
                    <RadioItem value="20" id={`${category.id}-poor`}>
                      Poor (20)
                    </RadioItem>
                    <RadioItem value="40" id={`${category.id}-below-average`}>
                      Below Average (40)
                    </RadioItem>
                    <RadioItem value="60" id={`${category.id}-average`}>
                      Average (60)
                    </RadioItem>
                    <RadioItem value="80" id={`${category.id}-good`}>
                      Good (80)
                    </RadioItem>
                    <RadioItem value="100" id={`${category.id}-impressive`}>
                      Very Impressive (100)
                    </RadioItem>
                  </RadioGroup>
                </div>

                {(formData[category.id]?.rating === "20" ||
                  formData[category.id]?.rating === "40" ||
                  formData[category.id]?.rating === "60") && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Expectations</h4>
                    <p className="text-sm text-gray-500 mb-2">
                      Please provide reasons for the low score and your expectations
                    </p>

                    <div className="space-y-2">
                      {formData[category.id]?.expectations.map((expectation, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="flex-grow">{expectation}</span>
                          <Button
                            variant="ghost"
                            className="p-1"
                            onClick={() => handleRemoveExpectation(category.id, index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Textarea
                        placeholder="Enter your expectation..."
                        value={currentExpectation}
                        onChange={(e) => setCurrentExpectation(e.target.value)}
                        className="flex-grow"
                      />
                      <Button onClick={() => handleAddExpectation(category.id)} className="self-end">
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Survey"}
          </Button>
        </div>
      </main>
    </div>
  )
}

export default SurveyPage
