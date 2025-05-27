import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import DashboardHeader from "../components/DashboardHeader"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import { capitalizeFirstLetter, Server } from "../Constants"
import axios from "axios"
import { CircularProgressbar, buildStyles } from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css"
// import WebChart from "../components/WebChart"

function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDept, setModalDept] = useState({})
  const [departmentScores, setDepartmentScores] = useState([])
  const [departmetnScoresToParticaular, setDepartmentScoresToParticular] = useState([])
  const [totalAverage, setTotalAverage] = useState(0)
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
          filteredScores = data.filter((dept) => dept.name === currentUser?.department?.name)
        }
        setDepartmentScores(filteredScores)

        const avg = (data.reduce((sum, dept) => sum + dept.score, 0) / data.length) || "N/A"
        setTotalAverage(avg)

        if (["manager", "user"].includes(currentUser.role)) {
          const partresponse = await axios.get(`${Server}/analytics/department-scores/${currentUser.department?._id}`, { withCredentials: true })
          setDepartmentScoresToParticular(partresponse.data)
        }

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#83725E]"></div>
          </div>
        </div>
      </div>
    )
  }

  const userDepartmentScore = departmentScores.find((dept) => dept.name === currentUser?.department?.name)?.score || "N/A"

  const renderCircularProgress = (value) => (
    <CircularProgressbar
      value={value}
      maxValue={100}
      text={`${value.toFixed(1)}%`}
      styles={buildStyles({
        textColor: "#83725E",
        pathColor: "#83725E",
        trailColor: "#f0f0f0",
        textSize: "16px"
      })}
    />
  )

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
              <div className="w-24 h-24 mx-auto mb-4">
                {typeof userDepartmentScore === "number" ? renderCircularProgress(userDepartmentScore) : "N/A"}
              </div>
            </CardContent>
          </Card>

          {currentUser.role === "admin" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Average ICSQ %</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-24 h-24 mx-auto mb-4">
                  {typeof totalAverage === "number" ? renderCircularProgress(totalAverage) : "N/A"}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {isAdmin() ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Department ICSQ Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {departmentScores.map((dept) => (
                  <Card key={dept._id} className="border p-4">
                    <div className="text-center font-medium mb-2">
                      {capitalizeFirstLetter(dept.name)}
                    </div>
                    <div  onClick={()=>{setModalDept(dept);setModalOpen(true)}} className="w-20 h-20 mx-auto">
                      {renderCircularProgress(dept.score)}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Scores Given to Your Department ({currentUser.department?.name})</CardTitle>
            </CardHeader>
            {!departmetnScoresToParticaular.length && (
              <p className="text-gray-600 text-center mt-4">No surveys happened for your department yet!</p>
            )}
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {departmetnScoresToParticaular.map((dept) => (
                  <Card key={dept?.fromDepartmentId} className="border p-4">
                    <div onClick={()=>{setModalDept(dept);setModalOpen(true)}} className="text-center font-medium mb-2">
                      {capitalizeFirstLetter(dept?.fromDepartmentName)}
                    </div>
                    <div className="w-20 h-20 mx-auto">
                      {renderCircularProgress(dept?.averageScore)}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center mt-6">
          <Button onClick={() => navigate("/survey")} className="px-8 py-3 text-lg">
            Start ICSQ Survey
          </Button>
        </div>

        {/* {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 w-full">
                  <div className="bg-white rounded-lg shadow-lg lg:w-[60%] max-w-lg p-6 relative">
                    <WebChart detailedScores={modalDept?.detailedScores || {}}/>
                    <div className="mt-4 text-right">
                      <button onClick={() => {setModalOpen(false);setModalDept({})}} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Close</button>
                    </div>
                  </div>
                </div>
          )} */}

      </main>
    </div>
  )
}

export default DashboardPage
