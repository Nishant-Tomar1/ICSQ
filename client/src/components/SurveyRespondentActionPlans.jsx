import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card"
import  Badge  from "./ui/Badge"
import { capitalizeFirstLetter, Server } from "../Constants"
import axios from "axios"
import { useToast } from "../contexts/ToastContext"

function SurveyRespondentActionPlans() {
  const [actionPlans, setActionPlans] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchActionPlans()
  }, [])

  const fetchActionPlans = async () => {
    try {
      const response = await axios.get(`${Server}/action-plans/survey-respondent`, {
        withCredentials: true
      })
      setActionPlans(response.data)
    } catch (error) {
      console.error("Error fetching action plans:", error)
      toast({
        title: "Error",
        description: "Failed to load action plans",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "in-progress":
        return "bg-yellow-500"
      case "pending":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Completed"
      case "in-progress":
        return "In Progress"
      case "pending":
        return "Pending"
      default:
        return "Unknown"
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const isOverdue = (targetDate, status) => {
    if (status === "completed") return false
    return new Date(targetDate) < new Date()
  }

  if (isLoading) {
    return (
      <Card className="bg-[#29252c]/70">
        <CardHeader>
          <CardTitle className="text-teal-400">Action Plans from Your Survey Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (actionPlans.length === 0) {
    return (
      <Card className="bg-[#29252c]/70">
        <CardHeader>
          <CardTitle className="text-teal-400">Action Plans from Your Survey Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-300 text-lg mb-2">No Action Plans Yet</p>
            <p className="text-gray-400">
              Action plans based on your survey responses will appear here once they are created by department heads.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#29252c]/70">
      <CardHeader>
        <CardTitle className="text-teal-400 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Action Plans from Your Survey Responses
        </CardTitle>
        <p className="text-gray-400 text-sm">
          These action plans were created based on expectations you provided in surveys
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[600px] overflow-auto">
          {actionPlans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-teal-400/30 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">
                    {capitalizeFirstLetter(plan.department?.name)} - {plan.category?.name}
                  </h3>
                  <p className="text-gray-300 text-sm mb-2">
                    Your original expectation: <span className="text-teal-300 italic">"{plan.respondentData?.originalExpectation}"</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`${getStatusColor(plan.status)} text-white`}>
                    {getStatusText(plan.status)}
                  </Badge>
                  {isOverdue(plan.targetDate, plan.status) && (
                    <Badge className="bg-red-500 text-white text-xs">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Action Plan:</p>
                  <p className="text-gray-200">{plan.expectations}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Assigned To:</p>
                  <p className="text-gray-200">{plan.assignedTo?.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Target Date:</p>
                  <p className={`${isOverdue(plan.targetDate, plan.status) ? 'text-red-400' : 'text-gray-200'}`}>
                    {formatDate(plan.targetDate)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Created By:</p>
                  <p className="text-gray-200">{plan.assignedBy?.name}</p>
                </div>
              </div>

              {plan.actions && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-gray-400 mb-1">Actions Taken:</p>
                  <p className="text-gray-200">{plan.actions}</p>
                </div>
              )}

              {plan.instructions && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-gray-400 mb-1">Instructions:</p>
                  <p className="text-gray-200">{plan.instructions}</p>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400">
                Created: {formatDate(plan.createdAt)} • Last Updated: {formatDate(plan.updatedAt)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default SurveyRespondentActionPlans
