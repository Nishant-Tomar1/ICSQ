import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import DashboardHeader from "../components/DashboardHeader"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import { capitalizeFirstLetter,
  getDepartmentIcon,
  getTagandEmoji, 
  Server } from "../Constants"
import axios from "axios"
import "react-circular-progressbar/dist/styles.css"
import WebChart from "../components/WebChart"
import Progress from "../components/ui/Progress"

function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [modalDept, setModalDept] = useState({})
  const [currentUserDept, setCurrentUserDept] = useState({})
  const [departmentScores, setDepartmentScores] = useState([])
  const [departmetnScoresToParticaular, setDepartmentScoresToParticular] = useState([])
  const [expData, setExpData] = useState(0);
  const navigate = useNavigate()
  const { toast } = useToast()
  const { currentUser, isAdmin } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${Server}/analytics/department-scores`, { withCredentials: true })
        const data = response.data

        let filteredScores = data
        if (!isAdmin()) {
          filteredScores = data.filter((dept) => {dept.name === currentUser?.department?.name})
        }

        data.map((dept) => {if (dept.name === currentUser?.department?.name){setModalDept(dept);setCurrentUserDept(dept); return;}})
        
        setDepartmentScores(filteredScores)

        if (["manager", "user"].includes(currentUser.role)) {
          const partresponse = await axios.get(`${Server}/analytics/department-scores/${currentUser.department?._id}`, { withCredentials: true })
          setDepartmentScoresToParticular(partresponse.data)
        }

        const expresponse = await axios.get(`${Server}/analytics/expectation-data/${currentUser?.department?._id}`, {withCredentials: true})
        setExpData(expresponse.data)

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
      <div className="min-h-screen">
        <DashboardHeader />
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(131,114,94)]"></div>
          </div>
        </div>
      </div>
    )
  }

  const renderCircularProgress = (value) => (
    <Progress 
    value={value || 0}
    />
  )

  const calculateCourseOfAction = (deptname)=> {
      let count = 0;
      if ((currentUser?.role === "admin") ||(deptname === currentUser?.department?.name)){
        expData.map((exp)=> {
          count += exp.totalExpectationCount;
        })
      }
      else{
        expData.map((exp)=> {
          exp?.departments?.map((deptExp)=>{
            if (deptExp?.name === deptname){
              count+=deptExp.expectationCount
            }
          })
        })
      }
      return count;
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col lg:flex-row justify-between">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-200">
              Welcome,<span className="text-teal-400"> {currentUser?.name} </span>
            </h1>
            <p className="text-gray-100">
              Here's an overview of your ICSQ performance
            </p>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-200">
              <span className="text-gray-200"> Course of Action : <span className="text-orange-400"> {calculateCourseOfAction(modalDept?.name ? modalDept?.name : modalDept?.fromDepartmentName) || 0} </span> </span>
            </h1>
          </div>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* left side */}
           <Card className="h-full bg-[#29252c]/70">
            <CardHeader className="-mb-20 px-6 backdrop-brightness-25 max-h-full">
                <CardTitle className="text-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      {capitalizeFirstLetter(modalDept?.name ? modalDept?.name : modalDept?.fromDepartmentName)} ICSQ <br />
                      <span className="text-teal-400 text-xl">{(modalDept?.score ? modalDept?.score : modalDept?.averageScore)?.toFixed(2) || 0} %</span>
                    </div>
                    <div className="text-[goldenrod]">
                      {getTagandEmoji(modalDept?.score ? modalDept?.score : modalDept?.averageScore)?.tag} <br />
                      <span className="text-3xl flex justify-center">{getTagandEmoji(modalDept?.score ? modalDept?.score : modalDept?.averageScore)?.emoji}</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
            <CardContent>
            <WebChart detailedScores={modalDept?.detailedScores || {}} />
            </CardContent>
          </Card>

          {/* Right side */}
          <div className="flex flex-col gap-2 h-full">
            <Card className="flex-1 max-h-[200px] bg-[#29252c]/70">
              <CardHeader>
                  <CardTitle className="text-[goldenrod] text-xl -mb-2">Your Department's average ICSQ</CardTitle>
                </CardHeader>
            <CardContent>
                  <div className="grid grid-cols-1 gap-6">
                        {currentUserDept?.score && <Card  
                          className={`shadow-xl cursor-pointer backdrop-brightness-125 ${(modalDept._id === currentUserDept._id) ? "bg-[#93725E]/80" :"bg-white/10"} p-4`}
                        >
                          <div onClick={() => {
                              setModalDept(currentUserDept);
                            }}>
                          <div className="text-start text-gray-100 font-medium mb-2 flex justify-between">
                             <span> {getDepartmentIcon(currentUser.department?.name || "")}{capitalizeFirstLetter(currentUser?.department?.name || "")} </span>
                            <span className="text-gray-200">{currentUserDept?.score?.toFixed(2)} %</span>
                          </div>
                          <div
                            className="w-full mx-auto"
                          >
                            {renderCircularProgress(currentUserDept.score)}
                          </div>
                          </div>
                        </Card>}
                  </div>
                </CardContent>
            
            </Card>


            {isAdmin() ? (
              <Card className="flex-1 overflow-y-auto bg-[#29252c]/70">
                <CardHeader>
                  <CardTitle className="text-[goldenrod] text-xl">Department ICSQ Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6">
                    {departmentScores.length > 0 &&
                      departmentScores.map((dept) => (
                       (currentUser?.department?._id !== dept._id) &&  
                        <Card  
                          key={dept._id}
                          className={`shadow-xl cursor-pointer backdrop-brightness-125 ${(modalDept._id === dept._id) ? "bg-[#93725E]/80" :"bg-white/10"} p-4`}
                        >
                          <div onClick={() => {
                              setModalDept(dept);
                            }}>
                          <div className="text-start text-gray-100 font-medium mb-2 flex justify-between">
                            <span> {getDepartmentIcon(dept.name)} {capitalizeFirstLetter(dept.name)} </span>
                            <span className="text-gray-200">{dept?.score.toFixed(2)} %</span>
                          </div>
                          <div
                            className="w-full mx-auto"
                          >
                            {renderCircularProgress(dept.score)}
                          </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex-1 overflow-y-auto bg-[#29252c]/70">
                <CardHeader>
                  <CardTitle className="text-[goldenrod]">
                    Scores Given to Your Department ({capitalizeFirstLetter(currentUser.department?.name)})
                  </CardTitle>
                </CardHeader>
                {departmetnScoresToParticaular.length === 0 ? (
                  <p className="text-gray-600 text-center my-4">
                    No surveys happened for your department yet!
                  </p>
                ) : (
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6">
                      {departmetnScoresToParticaular.map((dept, index) => (
                        <Card  
                          key={index}
                          className={`shadow-xl cursor-pointer backdrop-brightness-125 ${(String(modalDept?.fromDepartmentId) === String(dept?.fromDepartmentId)) ? "bg-[#93725E]/80" :"bg-white/10"} p-4`}
                        >
                          <div onClick={() => {
                              setModalDept(dept);
                            }}>
                          <div className="text-start text-gray-100 font-medium mb-2 flex justify-between">
                            <span> 
                              {getDepartmentIcon(dept.fromDepartmentName)} 
                              {capitalizeFirstLetter(dept.fromDepartmentName)} 
                            </span>
                            <span className="text-gray-200">{dept?.averageScore.toFixed(2)} %</span>
                          </div>
                          <div
                            className="w-full mx-auto"
                          >
                            {renderCircularProgress(dept.averageScore)}
                          </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </div>
        
        <div className="flex justify-center mt-6 gap-4">
          <Button
            onClick={() => navigate("/survey")}
            className="px-8 py-3 text-lg"
          >
            Start ICSQ Survey
          </Button>
          <Button
            onClick={() => navigate("/sipoc")}
            className="px-8 py-3 text-lg"
          >
            Know Your SIPOC
          </Button>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage
