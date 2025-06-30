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
  const [expData, setExpData] = useState([])
  const [hasSurveys, setHasSurveys] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDeptId, setSelectedDeptId] = useState(null)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { currentUser, isAdmin, isHod, getHodDepartments } = useAuth()

  useEffect(() => {
    if (isHod() && getHodDepartments().length > 0) {
      setSelectedDeptId(getHodDepartments()[0]._id)
    } else if (currentUser?.department?._id) {
      setSelectedDeptId(currentUser.department._id)
    }
  }, [currentUser])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${Server}/analytics/department-scores`, { withCredentials: true })
        const data = response.data

        let filteredScores = data
        if (isAdmin()) {
          // all departments
        } else if (isHod() && selectedDeptId) {
          filteredScores = data.filter((dept) => dept._id === selectedDeptId)
        } else {
          filteredScores = data.filter((dept) => dept.name === currentUser?.department?.name)
        }

        let deptToShow = null;
        if (selectedDeptId === null) {
          deptToShow = getAllDepartmentsAggregate(data);
        } else if (isHod() && selectedDeptId) {
          deptToShow = data.find((dept) => dept._id === selectedDeptId)
        } else {
          deptToShow = data.find((dept) => dept.name === currentUser?.department?.name)
        }
        setModalDept(deptToShow || {})
        setCurrentUserDept(deptToShow || {})
        setDepartmentScores(filteredScores)
        setHasSurveys(!!(deptToShow && (deptToShow.score !== undefined && deptToShow.score !== null)))

        if (["hod", "user"].includes(currentUser.role)) {
          const partresponse = await axios.get(`${Server}/analytics/department-scores/${selectedDeptId || currentUser.department?._id}`, { withCredentials: true })
          setDepartmentScoresToParticular(partresponse.data)
        }

        try {
          const expresponse = await axios.get(`${Server}/analytics/expectation-data/${selectedDeptId || currentUser?.department?._id}`, {withCredentials: true})
          setExpData(expresponse.data || [])
        } catch (error) {
          console.error("Failed to fetch expectation data:", error)
          setExpData([])
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

    if (selectedDeptId !== undefined) {
      fetchData()
    }
  }, [currentUser, selectedDeptId])

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

  const calculateCourseOfAction = (deptname) => {
    let count = 0;
    if (!Array.isArray(expData)) return 0;

    if ((currentUser?.role === "admin") || (deptname === currentUser?.department?.name)) {
      expData.forEach((exp) => {
        count += exp.totalExpectationCount || 0;
      });
    } else {
      expData.forEach((exp) => {
        exp?.departments?.forEach((deptExp) => {
          if (deptExp?.name === deptname) {
            count += deptExp.expectationCount || 0;
          }
        });
      });
    }
    return count;
  }

  const filteredDepartments = departmentScores.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredDepartmentScores = departmetnScoresToParticaular.filter(dept =>
    dept.fromDepartmentName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <main className="container mx-auto py-8 px-4 lg:px-10">
        <div
          style={{
            transform: "scale(0.7)",
            transformOrigin: "top left",
            width: "142.857%",
            minHeight: "100vh"
          }}
        >
          <div className="flex flex-col lg:flex-row justify-between">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-200">
                Welcome,<span className="text-teal-400"> {currentUser?.name} </span>
              </h1>
              <p className="text-gray-100">
                {hasSurveys ? "Here's an overview of your ICSQ performance" : "Your ICSQ performance overview will appear here once surveys are completed"}
              </p>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-200">
                <span className="text-gray-200"> Course of Action : <span className="text-orange-400"> {calculateCourseOfAction(modalDept?.name ? modalDept?.name : modalDept?.fromDepartmentName) || 0} </span> </span>
              </h1>
            </div>
          </div>

          {isHod() && getHodDepartments().length > 1 && (
            <div className="mb-4 flex items-center gap-2">
              <label className="text-gray-200 font-medium">Select Department:</label>
              <select
                className="p-2 rounded-md bg-white/10 text-gray-200 border border-gray-600 focus:outline-none focus:border-[goldenrod]"
                value={selectedDeptId}
                onChange={e => setSelectedDeptId(e.target.value)}
              >
                {getHodDepartments().map(dept => (
                  <option key={dept._id} className="bg-[#29252c] text-gray-200" value={dept._id}>{capitalizeFirstLetter(dept.name)}</option>
                ))}
              </select>
            </div>
          )}

          {!hasSurveys && (
            <Card className="mb-8 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-amber-500/20">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-400 mb-2">No Surveys Yet</h3>
                    <p className="text-gray-300">
                      Your department hasn't been surveyed yet. The ICSQ scores and insights will appear here once surveys are completed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {hasSurveys && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 overflow-auto">
              {/* left side */}
               <Card className="h-full bg-[#29252c]/70">
                <CardHeader className="-mb-20 px-6 backdrop-brightness-25 max-h-100">
                    <CardTitle className="text-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          {capitalizeFirstLetter(modalDept?.name ? modalDept?.name : modalDept?.fromDepartmentName).toUpperCase()} ICSQ <br />
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
              <div className="flex flex-col gap-2 max-h-full overflow-auto">
                <Card className="flex-1 max-h-[160px] bg-[#29252c]/70">
                      <CardHeader>
                          <CardTitle className="text-[goldenrod] text-xl -mb-2">
                            {currentUser?.department?.name ? `${capitalizeFirstLetter(currentUser?.department?.name)} Department's average ICSQ` : "Department's average ICSQ"}
                          </CardTitle>
                        </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-6">
                            {currentUserDept?.score && <Card  
                              className={`shadow-xl cursor-pointer backdrop-brightness-125 ${(selectedDeptId === null) ? "bg-[#93725E]/80" :"bg-white/10"} p-4`}
                              onClick={() => {
                                setSelectedDeptId(null);
                                setModalDept(getAllDepartmentsAggregate(departmentScores));
                              }}
                            >
                              <div>
                                <div className="text-start text-gray-100 font-medium mb-2 flex justify-between">
                                   <span> {getDepartmentIcon(currentUser?.department?.name || "")}{(currentUser?.department?.name || "").toUpperCase()} </span>
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
                  <Card className="flex-1 overflow-y-auto bg-[#29252c]/70 max-h-[600px]">
                    <CardHeader>
                      <CardTitle className="text-[goldenrod] text-xl">Department ICSQ Scores</CardTitle>
                      <input
                        type="text"
                        placeholder="Search departments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 mt-2 rounded-md bg-white/10 text-gray-200 border border-gray-600 focus:outline-none focus:border-[goldenrod]"
                      />
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`grid grid-cols-1 gap-6 ${filteredDepartments.length > 4 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}
                        style={{ minHeight: 0 }}
                      >
                        {filteredDepartments.length > 0 &&
                          filteredDepartments.map((dept) => (
                            (currentUser?.department?._id !== dept._id) &&
                            <Card
                              key={dept._id}
                              className={`shadow-xl cursor-pointer backdrop-brightness-125 ${(selectedDeptId === dept._id) ? "bg-[#93725E]/80" :"bg-white/10"} p-4`}
                            >
                              <div onClick={() => {
                                  setSelectedDeptId(dept._id);
                                }}>
                                <div className="text-start text-gray-100 font-medium mb-2 flex justify-between">
                                  <span> {getDepartmentIcon(dept.name)} {dept.name.toUpperCase()} </span>
                                  <span className="text-gray-200">{dept?.score.toFixed(2)} %</span>
                                </div>
                                <div className="w-full mx-auto">
                                  {renderCircularProgress(dept.score)}
                                </div>
                              </div>
                            </Card>
                          ))
                          }
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="flex-1 overflow-y-auto bg-[#29252c]/70 max-h-[600px]">
                    <CardHeader>
                      <CardTitle className="text-[goldenrod]">
                        Scores Given to Your Department ({capitalizeFirstLetter(currentUser?.department?.name)})
                      </CardTitle>
                      <input
                        type="text"
                        placeholder="Search departments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 mt-2 rounded-md bg-white/10 text-gray-200 border border-gray-600 focus:outline-none focus:border-[goldenrod]"
                      />
                    </CardHeader>
                    {filteredDepartmentScores.length === 0 ? (
                      <p className="text-gray-600 text-center my-4">
                        No surveys happened for your department yet!
                      </p>
                    ) : (
                      <CardContent>
                        <div className="grid grid-cols-1 gap-6">
                          {filteredDepartmentScores.map((dept, index) => (
                            <Card  
                              key={index}
                              className={`shadow-xl cursor-pointer backdrop-brightness-125 ${(String(currentUser?.department?._id) === String(dept?.fromDepartmentId)) ? "bg-[#93725E]/80" :"bg-white/10"} p-4`}
                            >
                              <div onClick={() => {
                                  setModalDept(dept);
                                }}>
                                <div className="text-start text-gray-100 font-medium mb-2 flex justify-between">
                                  <span> 
                                    {getDepartmentIcon(dept.fromDepartmentName)} 
                                    {capitalizeFirstLetter(dept.fromDepartmentName).toUpperCase()} 
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
          )}
          
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
        </div>
      </main>
    </div>
  );
}

export default DashboardPage
