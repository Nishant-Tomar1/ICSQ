import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import DashboardHeader from "../components/DashboardHeader"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import { capitalizeFirstLetter,
  // getDepartmentIcon,
  getTagandEmoji, 
  Server } from "../Constants"
import axios from "axios"
import "react-circular-progressbar/dist/styles.css"
import WebChart from "../components/WebChart"
import Progress from "../components/ui/Progress"

function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [modalDept, setModalDept] = useState({})
  const [departmentScores, setDepartmentScores] = useState([])
  const [departmetnScoresToParticaular, setDepartmentScoresToParticular] = useState([])
  const [totalAverage, setTotalAverage] = useState(0)
  const [expCount, setExpCount] = useState(0);
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

        data.map((dept) => {if (dept.name === currentUser?.department?.name){setModalDept(dept); return;}})
        
        setDepartmentScores(filteredScores)

        const avg = (data.reduce((sum, dept) => sum + dept.score, 0) / data.length) || "N/A"
        setTotalAverage(avg)

        if (["manager", "user"].includes(currentUser.role)) {
          const partresponse = await axios.get(`${Server}/analytics/department-scores/${currentUser.department?._id}`, { withCredentials: true })
          setDepartmentScoresToParticular(partresponse.data)
        }

        const expresponse = await axios.get(`${Server}/analytics/expectation-data/${currentUser?.department?._id}`, {withCredentials: true})
        const expData = expresponse.data;
        setExpCount(()=>{
          let count = 0;
          expData.map((exp)=> {
            count += exp.totalExpectationCount;
          })
          return count;
        })

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
    value={value}
    />
  )

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
              <span className="text-gray-200"> Course of Action : <span className="text-orange-400"> {expCount || 0} </span> </span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           <Card>
            <CardHeader className="-mb-20 px-6 backdrop-brightness-50">
                <CardTitle className="text-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      {capitalizeFirstLetter(modalDept?.name ? modalDept?.name : modalDept?.fromDepartmentName)} ICSQ <br />
                      <span className="text-teal-400 text-xl">{(modalDept?.score ? modalDept?.score : modalDept?.averageScore)?.toFixed(2) || 0} %</span>
                    </div>
                    <div className="text-yellow-500">
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

          {/* {typeof userDepartmentScore === "number" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Your Department ICSQ %
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-24 h-24 mx-auto mb-4">
                  {typeof userDepartmentScore === "number"
                    ? renderCircularProgress(userDepartmentScore)
                    : "N/A"}
                </div>
              </CardContent>
            </Card>
          )} */}

         
{/* 
          {currentUser.role === "admin" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Average ICSQ %</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-24 h-24 mx-auto mb-4">
                  {typeof totalAverage === "number"
                    ? renderCircularProgress(totalAverage)
                    : "N/A"}
                </div>
              </CardContent>
            </Card>
          )} */}
        {isAdmin() ? (
          <Card className="mb-8 min-h-full max-h-[400px] overflow-y-scroll backdrop-brightness-75">
            <CardHeader>
              <CardTitle className="text-yellow-500 text-xl">Department ICSQ Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                {departmentScores.length > 0 &&
                  departmentScores.map((dept) => (
                    <Card  
                      key={dept._id}
                      className="shadow-xl cursor-pointer backdrop-brightness-125 bg-white/10 p-4"
                    >
                      <div onClick={() => {
                          setModalDept(dept);
                        }}>
                      <div className="text-start text-gray-100 font-medium mb-2 flex justify-between">
                        {capitalizeFirstLetter(dept.name)}
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
          <Card className="mb-8 min-h-full max-h-[400px] overflow-y-scroll backdrop-brightness-75">
            <CardHeader>
              <CardTitle className="text-yellow-500">
                Scores Given to Your Department ({currentUser.department?.name})
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
                      className="shadow-xl cursor-pointer backdrop-brightness-125 bg-white/10 p-4"
                    >
                      <div onClick={() => {
                          setModalDept(dept);
                        }}>
                      <div className="text-start text-gray-100 font-medium mb-2 flex justify-between">
                        <span> 
                          {/* {getDepartmentIcon(dept.fromDepartmentName)}  */}
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


        <div className="flex justify-center mt-6">
          <Button
            onClick={() => navigate("/survey")}
            className="px-8 py-3 text-lg"
          >
            Start ICSQ Survey
          </Button>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage
