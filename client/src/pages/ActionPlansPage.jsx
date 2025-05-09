import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import DashboardHeader from "../components/DashboardHeader"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table"
import Select from "../components/ui/Select"
import Badge from "../components/ui/Badge"
import axios from "axios"
import { capitalizeFirstLetter, Server } from "../Constants"

function ActionPlansPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [actionPlans, setActionPlans] = useState([])
  const [filteredPlans, setFilteredPlans] = useState([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()
  const { toast } = useToast()
  const { currentUser } = useAuth()

  const fetchData = async () => {
    try {
      const response = await axios.get(`${Server}/action-plans`, {
        params: { departmentId: currentUser?.department._id },
        withCredentials: true,
      });
      // console.log("response :",response.data);
      setActionPlans(response.data);
      setFilteredPlans(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load action plans",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentUser])

  useEffect(() => {
    // Apply filters
    let filtered = [...actionPlans]

    if (statusFilter !== "all") {
      filtered = filtered.filter((plan) => plan.status === statusFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((plan) => plan.category?.[0].name === categoryFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (plan) =>
          plan.action.toLowerCase().includes(query) ||
          plan.expectation.toLowerCase().includes(query) ||
          plan.owner?.[0]?.name.toLowerCase().includes(query) || 
          plan.category?.[0]?.name.toLowerCase().includes(query),
      )
    }

    setFilteredPlans(filtered)
  }, [statusFilter, categoryFilter, searchQuery, actionPlans])

  const handleStatusChange = (id, status) => {
    setActionPlans((prev) => prev.map((plan) => (plan._id === id ? { ...plan, status } : plan)))
  }

  const handleSaveAll = async () => {
    setIsLoading(true)
    const reqData = actionPlans.map((plan) => ({...plan, category : plan?.category?.[0]?._id, owner : plan?.owner?.[0]?._id}));
    // console.log(reqData);
    try {
      await axios.put(
        `${Server}/action-plans`,
        {
          plans: reqData,
        },
        { withCredentials: true },
      );

      toast({
        title: "Action Plans Saved",
        description: "Your action plans have been updated successfully",
      })
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save action plans",
        variant: "destructive",
      })
      console.log(error);
      
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">Pending</Badge>
      case "in-progress":
        return <Badge variant="primary">In Progress</Badge>
      case "completed":
        return <Badge variant="success">Completed</Badge>
      default:
        return <Badge>Unknown</Badge>
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

  const categories = ["all", ...new Set(actionPlans.map((plan) => plan.category?.[0]?.name))]

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ]

  const categoryOptions = categories.map((category) => ({
    value: category,
    label: category === "all" ? "All Categories" : category,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={currentUser} />

      <main className="container mx-auto py-6 px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Action Plans - {currentUser?.department?.name}</span>
              <Button onClick={handleSaveAll} disabled={isLoading}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                </svg>
                Save Changes
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="w-full sm:w-1/3">
                <label className="text-sm font-medium mb-1 block">Filter by Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter} options={statusOptions} />
              </div>

              <div className="w-full sm:w-1/3">
                <label className="text-sm font-medium mb-1 block">Filter by Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter} options={categoryOptions} />
              </div>

              <div className="w-full sm:w-1/3">
                <label className="text-sm font-medium mb-1 block">Search</label>
                <Input
                  placeholder="Search action plans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Expectation</TableHead>
                  <TableHead>Action Plan</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Update Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan._id}>
                    <TableCell>{capitalizeFirstLetter(plan.category?.[0]?.name)}</TableCell>
                    <TableCell>{plan.expectation}</TableCell>
                    <TableCell>{plan.action}</TableCell>
                    <TableCell>{capitalizeFirstLetter(plan.owner?.[0]?.name)}</TableCell>
                    <TableCell>{new Date(plan.targetDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(plan.status)}</TableCell>
                    <TableCell>
                      <Select
                        value={plan.status}
                        onValueChange={(value) => handleStatusChange(plan._id, value)}
                        options={[
                          { value: "pending", label: "Pending" },
                          { value: "in-progress", label: "In Progress" },
                          { value: "completed", label: "Completed" },
                        ]}
                        className="h-8"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPlans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No action plans found matching the current filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default ActionPlansPage
