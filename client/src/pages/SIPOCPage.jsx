import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import DashboardHeader from "../components/DashboardHeader"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table"

function SIPOCPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [sipocEntries, setSipocEntries] = useState([])
  const [newEntry, setNewEntry] = useState({
    supplier: "",
    input: "",
    process: "",
    output: "",
    customer: "",
  })
  const navigate = useNavigate()
  const { toast } = useToast()
  const { currentUser } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (currentUser?.department) {
          try {
            // In a real app, fetch SIPOC data from API
            // const response = await axios.get(`/api/sipoc?department=${currentUser.department}`, {
            //   withCredentials: true,
            // });
            // setSipocEntries(response.data.entries || []);

            // Mock SIPOC data
            const mockSipocData = [
              {
                id: "1",
                supplier: "HR & Admin",
                input: "Employee onboarding documents",
                process: "Employee integration",
                output: "Trained team members",
                customer: "Development Team",
              },
              {
                id: "2",
                supplier: "Finance & Accounts",
                input: "Budget approvals",
                process: "Financial planning",
                output: "Project budgets",
                customer: "Project Managers",
              },
              {
                id: "3",
                supplier: "Marketing",
                input: "Market research data",
                process: "Market analysis",
                output: "Market insights",
                customer: "Sales Team",
              },
            ]

            setSipocEntries(mockSipocData)
          } catch (error) {
            if (error.response?.status === 404) {
              // No SIPOC found for this department, that's okay
              setSipocEntries([])
            } else {
              throw error
            }
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load SIPOC data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser, toast])

  const handleInputChange = (field, value) => {
    setNewEntry((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddEntry = () => {
    // Validate all fields are filled
    if (!Object.values(newEntry).every((value) => value.trim())) {
      toast({
        title: "Incomplete Entry",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // Add new entry with a generated ID
    const newId = Date.now().toString()
    setSipocEntries((prev) => [...prev, { ...newEntry, id: newId }])

    // Reset form
    setNewEntry({
      supplier: "",
      input: "",
      process: "",
      output: "",
      customer: "",
    })

    toast({
      title: "Entry Added",
      description: "New SIPOC entry has been added",
    })
  }

  const handleDeleteEntry = (id) => {
    setSipocEntries((prev) => prev.filter((entry) => entry.id !== id))

    toast({
      title: "Entry Deleted",
      description: "SIPOC entry has been removed",
    })
  }

  const handleSaveAll = async () => {
    setIsLoading(true)

    try {
      // In a real app, save to API
      // await axios.put(
      //   "/api/sipoc",
      //   {
      //     department: currentUser.department,
      //     entries: sipocEntries,
      //   },
      //   { withCredentials: true },
      // );

      toast({
        title: "SIPOC Saved",
        description: "Your SIPOC data has been saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save SIPOC data",
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
              <span>SIPOC Management - {currentUser?.department}</span>
              <Button onClick={handleSaveAll} disabled={isLoading}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                </svg>
                Save All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              SIPOC (Supplier, Input, Process, Output, Customer) is a tool that summarizes the inputs and outputs of one
              or more processes in table form. It is used to define a business process before work begins.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Input</TableHead>
                  <TableHead>Process</TableHead>
                  <TableHead>Output</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sipocEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.supplier}</TableCell>
                    <TableCell>{entry.input}</TableCell>
                    <TableCell>{entry.process}</TableCell>
                    <TableCell>{entry.output}</TableCell>
                    <TableCell>{entry.customer}</TableCell>
                    <TableCell>
                      <Button variant="ghost" className="p-2" onClick={() => handleDeleteEntry(entry.id)}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>
                    <Input
                      placeholder="Supplier"
                      value={newEntry.supplier}
                      onChange={(e) => handleInputChange("supplier", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Input"
                      value={newEntry.input}
                      onChange={(e) => handleInputChange("input", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Process"
                      value={newEntry.process}
                      onChange={(e) => handleInputChange("process", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Output"
                      value={newEntry.output}
                      onChange={(e) => handleInputChange("output", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Customer"
                      value={newEntry.customer}
                      onChange={(e) => handleInputChange("customer", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" className="p-2" onClick={handleAddEntry}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default SIPOCPage
