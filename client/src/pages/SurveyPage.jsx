import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import DashboardHeader from "../components/DashboardHeader"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import Textarea from "../components/ui/Textarea"
import { RadioGroup, RadioItem } from "../components/ui/RadioGroup"
import { capitalizeFirstLetter, Server } from "../Constants"
import axios from "axios"

function SurveyPage() {
  const { departmentId } = useParams()
  const [department, setDepartment] = useState(null)
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({})
  // const [currentExpectation, setCurrentExpectation] = useState("")
  const [currentExpectations, setCurrentExpectations] = useState({});

  const navigate = useNavigate()
  const { toast } = useToast()
  const { currentUser, checkAuth } = useAuth()

  useEffect(() => {
    const alreadySurveyed = currentUser?.surveyedDepartmentIds.includes(departmentId) || false;
    setIsLoading(true)
    const fetchData = async () => {
      try {
        const deptResponse = await axios.get(`${Server}/departments/${departmentId}`, { withCredentials: true });
        setDepartment(deptResponse.data);

        const catgResponse = await axios.get(`${Server}/categories`, { withCredentials: true });
        setCategories(catgResponse.data);
        
        const userDepartment = {
          id: deptResponse.data._id,
          name: capitalizeFirstLetter(deptResponse.data.name),
          description: deptResponse.data.description,
        }
        setDepartment(userDepartment)
        initializeFormData();

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

    if(!alreadySurveyed){
      fetchData()
    }
    else{
      setIsLoading(false)
    }
  }, [departmentId, categories?.length])

  const initializeFormData = () =>{
    const initialFormData = {}
    categories.forEach((category) => {
      initialFormData[category.name] = {
        rating: 0,
        expectations: [],
      }
    })
    setFormData(initialFormData)
  }

  const handleRatingChange = (categoryName, value) => {
    setFormData((prev) => ({
      ...prev,
      [categoryName]: {
        ...prev[categoryName],
        rating: value,
      },
    }))
  }

  const handleAddExpectation = (categoryName) => {
    const expectation = currentExpectations[categoryName]?.trim();
    if (!expectation) return;
  
    setFormData((prev) => ({
      ...prev,
      [categoryName]: {
        ...prev?.[categoryName],
        expectations: [...(prev?.[categoryName]?.expectations || []), expectation],
      },
    }));
  
    setCurrentExpectations((prev) => ({
      ...prev,
      [categoryName]: '',
    }));
  };
  

  const handleRemoveExpectation = (categoryName, index) => {
    setFormData((prev) => ({
      ...prev,
      [categoryName]: {
        ...prev[categoryName],
        expectations: prev[categoryName].expectations.filter((_, i) => i !== index),
      },
    }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // Validate form data
      const invalidCategories = categories.filter((category) => {
        const data = formData[category.name];
        const hasRating = data?.rating;
        const lowRating = hasRating && data.rating <= 60;
        const hasExpectations = Array.isArray(data?.expectations) && data.expectations.length > 0;
      
        return !hasRating || (lowRating && !hasExpectations);
      });
      
      if (invalidCategories.length > 0) {
        toast({
          title: "Incomplete Survey",
          description: "Please provide ratings for all categories. For low ratings (≤ 60), expectations are required.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      
      // In a real app, submit to API
      await axios.post(
        `${Server}/surveys`,
        {
          userId : currentUser._id,
          fromDepartmentId: currentUser.department._id,
          toDepartmentId: departmentId,
          responses: formData,
          date: new Date(),
        },
        { withCredentials: true },
      );

      toast({
        title: "Survey Submitted",
        description: `Your feedback for ${department.name} has been recorded`,
      })
      
      checkAuth();
      navigate("/dashboard")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit survey",
        variant: "destructive",
      })
      
      console.log(error);
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

  if (currentUser?.surveyedDepartmentIds.includes(departmentId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mt-4">You have already Submitted survey for this Department !</p>
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
              <span>ICSQ Survey for {department?.name}</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="space-y-8"> 
          {categories.map((category) => (
            <Card key={category.name} className="border">
              <CardHeader>
                <CardTitle className="text-lg"> {capitalizeFirstLetter(category.name)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Rating</h4>
                  <RadioGroup
                    value={formData[category.name]?.rating || ""}
                    onValueChange={(value) => handleRatingChange(category.name, value)}
                    className="flex flex-wrap gap-4"
                  >
                    <RadioItem value={20} id={`${category.name}-poor`}>
                      Poor (20)
                    </RadioItem>
                    <RadioItem value={40} id={`${category.name}-below-average`}>
                      Below Average (40)
                    </RadioItem>
                    <RadioItem value={60} id={`${category.name}-average`}>
                      Average (60)
                    </RadioItem>
                    <RadioItem value={80} id={`${category.name}-good`}>
                      Good (80)
                    </RadioItem>
                    <RadioItem value={100} id={`${category.name}-impressive`}>
                      Very Impressive (100)
                    </RadioItem>
                  </RadioGroup>
                </div>

                {(formData[category.name]?.rating === 20 ||
                  formData[category.name]?.rating === 40 ||
                  formData[category.name]?.rating === 60) && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Expectations</h4>
                    <p className="text-sm text-gray-500 mb-2">
                      Please provide reasons for the low score and your expectations
                    </p>

                    <div className="space-y-2">
                      {formData?.[category.name]?.expectations?.map((expectation, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="flex-grow">{expectation}</span>
                          <Button
                            variant="ghost"
                            className="p-1"
                            onClick={() => handleRemoveExpectation(category.name, index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-2">
                        <Textarea
                          placeholder="Enter your expectation..."
                          value={currentExpectations[category.name] || ''}
                          onChange={(e) =>
                            setCurrentExpectations((prev) => ({
                              ...prev,
                              [category.name]: e.target.value,
                            }))}
                          className="flex-grow"
                        />
                        <Button onClick={() => handleAddExpectation(category.name)} className="self-end">
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
