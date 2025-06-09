import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import DashboardHeader from "../components/DashboardHeader"
import { Card, CardContent, CardHeader } from "../components/ui/Card"
import Button from "../components/ui/Button"
import Textarea from "../components/ui/Textarea"
import { capitalizeFirstLetter,getDepartmentIcon,getDepartmentName, Server } from "../Constants"
import axios from "axios"

function SurveyPage() {
  const { departmentId } = useParams()
  const [department, setDepartment] = useState(null)
  const [departments, setDepartments] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({})

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

        const departmentsResponse = await axios.get(`${Server}/departments`, { withCredentials: true });
        setDepartments(departmentsResponse.data)
        
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

    fetchData()
  }, [departmentId, categories?.length])

  const initializeFormData = () =>{
    const initialFormData = {}
    categories.forEach((category) => {
      if ((!category.department) || (String(category.department) === String(departmentId)) ){
        initialFormData[category.name] = {
          rating: 0,
          expectations: "",
        }
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

  const handleExpectationChange = (categoryName, value) => {
    setFormData((prev) => ({
      ...prev,
      [categoryName]: {
        ...prev[categoryName],
        expectations: value,
      },
    }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // Validate form data
        const invalidCategories = categories.filter((category) => {
        const match = ((!category.department) || (String(category.department) === String(departmentId)) )
        const data = formData[category.name];
        const hasRating = data?.rating;
        const lowRating = hasRating && data.rating <= 60;
        const hasExpectations = data?.expectations
      
        return match && (!hasRating || (lowRating && !hasExpectations));
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

  return (
    <div className="min-h-screen">
      <DashboardHeader user={currentUser} />

      <main className="container mx-auto py-2 px-4">
        <Card className="mb-2 bg-black/40">
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {JSON.parse(localStorage.getItem("selectedDepartments"))?.map((dept, index) => (
                  <div
                  key={dept}
                  className={` border rounded-lg shadow-sm cursor-pointer transition-all p-4 text-center ${
                    dept === departmentId
                    ? "border-2 border-[goldenrod] shadow-md"
                    : "hover:shadow-md hover:bg-white/5"
                  }`}
                  onClick={() => navigate(`/survey/${dept}`, {replace :true})}
                  >
                    <div className="h-16 flex items-center justify-center">
                      <span className="font-medium text-sm">{getDepartmentIcon(getDepartmentName(dept, departments)?.toUpperCase())}{getDepartmentName(dept, departments)?.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {
        (currentUser?.surveyedDepartmentIds.includes(departmentId)) ?
            <div className="min-h-[50vh] flex items-center justify-center">
              <div className="text-center">
                <p className="mt-4">You have already Submitted survey for this Department !</p>
              </div>
            </div>
          
        :
      <main className="container mx-auto py-4 px-4 text-gray-200">
      <Card className="rounded-b-none text-center text-[goldenrod] text-md">
        <CardHeader className="bg-black/40 border-b py-6 border-b-gray-400 text-xl font-semibold">{getDepartmentIcon(getDepartmentName(departmentId, departments))} ICSQ SURVEY FOR {getDepartmentName(departmentId, departments)?.toUpperCase()}</CardHeader>
     
        <div className="overflow-x-auto bg-black/40">
          <table className="min-w-full border border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-black/20 text-left hidden md:table-header-group">
              <tr className="md:table-row flex flex-col md:flex-row">
                <th className="px-4 py-3 text-sm font-semibold text-gray-200">Category</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-200 text-center">Rating</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-200">Expectations</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-700">
              {categories.map((category) => 
              {if ( ((!category.department) || (String(category.department) === String(departmentId)) ) )
              return (
                <tr key={category.name} className="border-t border-gray-500 text-left md:table-row flex flex-col md:flex-row">
                  {/* Category Name */}
                  <td className="px-4 py-4 align-top font-medium text-slate-200 max-w-60">
                    {capitalizeFirstLetter(category.name)}
                    <div className="text-xs font-light text-gray-500"> {capitalizeFirstLetter(category.description)}</div>
                  </td>
                 
                  {/* Ratings with Emojis */}
                  <td className="px-4 py-4 align-middle">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                      {[20, 40, 60, 80, 100].map((value, index) => {
                        const emojiList = ["😞", "😕", "😐", "🙂", "🤩"];
                        const titles = ["Poor", "Below Avg", "Average", "Good", "Impressive"];
                        const isSelected = formData[category.name]?.rating === value;

                        return (
                          <div className="flex flex-col items-center">
                            <button
                              key={value}
                              type="button"
                              onClick={() => handleRatingChange(category.name, value)}
                              title={titles[index]}
                              className={`text-xl sm:text-3xl p-1.5 sm:p-2 rounded-full border transition 
                                ${isSelected ? "bg-green-700 border-green-500" : "border-transparent hover:border-gray-300"}`}
                            >
                              {emojiList[index]}
                            </button>
                            <span className="text-gray-400 text-[10px] sm:text-[12px] text-center font-thin mt-1">{titles[index]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </td>

                  {/* Expectations Section */}
                  <td className="px-4 py-4 align-top">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-300 mb-1">
                        {formData[category.name]?.rating <= 60 ? "* Required - " : ""} 
                        Reason for the score and your expectations:
                      </p>

                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Your expectations..."
                          value={formData[category.name]?.expectations || ''}
                          onChange={(e) => handleExpectationChange(category.name, e.target.value)}
                          className="flex-grow h-16 text-gray-200 placeholder-gray-500"
                          required={formData[category.name]?.rating <= 60}
                          maxLength={300}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </Card>


        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Survey"}
          </Button>
        </div>
      </main>}
      
    </div>
  )
}

export default SurveyPage



// <div className="space-y-8"> 
//           {categories.map((category) => (
//             <Card key={category.name} className="border">
//               <CardHeader>
//                 <CardTitle className="text-lg"> {capitalizeFirstLetter(category.name)}</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div>
//                   <h4 className="font-medium mb-2">Rating</h4>
//                   <RadioGroup
//                     value={formData[category.name]?.rating || ""}
//                     onValueChange={(value) => handleRatingChange(category.name, value)}
//                     className="flex flex-wrap gap-4"
//                   >
//                     <RadioItem value={20} id={`${category.name}-poor`}>
//                       Poor (20)
//                     </RadioItem>
//                     <RadioItem value={40} id={`${category.name}-below-average`}>
//                       Below Average (40)
//                     </RadioItem>
//                     <RadioItem value={60} id={`${category.name}-average`}>
//                       Average (60)
//                     </RadioItem>
//                     <RadioItem value={80} id={`${category.name}-good`}>
//                       Good (80)
//                     </RadioItem>
//                     <RadioItem value={100} id={`${category.name}-impressive`}>
//                       Very Impressive (100)
//                     </RadioItem>
//                   </RadioGroup>
//                 </div>

//                 {(formData[category.name]?.rating === 20 ||
//                   formData[category.name]?.rating === 40 ||
//                   formData[category.name]?.rating === 60) && (
//                   <div className="mt-4">
//                     <h4 className="font-medium mb-2">Expectations</h4>
//                     <p className="text-sm text-gray-500 mb-2">
//                       Please provide reasons for the low score and your expectations
//                     </p>

//                     <div className="space-y-2">
//                       {formData?.[category.name]?.expectations?.map((expectation, index) => (
//                         <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
//                           <span className="flex-grow">{expectation}</span>
//                           <Button
//                             variant="ghost"
//                             className="p-1"
//                             onClick={() => handleRemoveExpectation(category.name, index)}
//                           >
//                             Remove
//                           </Button>
//                         </div>
//                       ))}
//                     </div>

//                     <div className="flex gap-2 mt-2">
//                         <Textarea
//                           placeholder="Enter your expectation..."
//                           value={currentExpectations[category.name] || ''}
//                           onChange={(e) =>
//                             setCurrentExpectations((prev) => ({
//                               ...prev,
//                               [category.name]: e.target.value,
//                             }))}
//                           className="flex-grow"
//                         />
//                         <Button onClick={() => handleAddExpectation(category.name)} className="self-end">
//                           Add
//                         </Button>
//                     </div>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           ))}
//         </div>