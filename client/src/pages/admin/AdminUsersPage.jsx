import { useState, useEffect } from "react"
import { useToast } from "../../contexts/ToastContext"
import DashboardHeader from "../../components/DashboardHeader"
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card"
import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"
import Select from "../../components/ui/Select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/Table"
import Badge from "../../components/ui/Badge"

function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    department: "",
    role: "user",
    password: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, this would fetch from your API
        // const usersResponse = await axios.get("/api/admin/users", { withCredentials: true });
        // const departmentsResponse = await axios.get("/api/admin/departments", { withCredentials: true });
        // setUsers(usersResponse.data);
        // setDepartments(departmentsResponse.data);

        // Mock data for demonstration
        const mockUsers = [
          { id: 1, name: "John Doe", email: "john@sobharealty.com", department: "Development", role: "admin" },
          { id: 2, name: "Jane Smith", email: "jane@sobharealty.com", department: "HR & Admin", role: "user" },
          { id: 3, name: "Alex Johnson", email: "alex@sobharealty.com", department: "Marketing", role: "user" },
          {
            id: 4,
            name: "Sarah Williams",
            email: "sarah@sobharealty.com",
            department: "Finance & Accounts",
            role: "user",
          },
          { id: 5, name: "Michael Brown", email: "michael@sobharealty.com", department: "Procurement", role: "admin" },
        ]

        const mockDepartments = [
          { id: 1, name: "Development" },
          { id: 2, name: "Stay By Latinum" },
          { id: 3, name: "Audit & Assurance" },
          { id: 4, name: "HR & Admin" },
          { id: 5, name: "Group IT" },
          { id: 6, name: "Procurement" },
          { id: 7, name: "SCM" },
          { id: 8, name: "Marketing" },
          { id: 9, name: "Finance & Accounts" },
          { id: 10, name: "PNC Architects" },
          { id: 11, name: "SOBHA PMC" },
          { id: 12, name: "LFM" },
        ]

        setUsers(mockUsers)
        setDepartments(mockDepartments)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        [name]: value,
      })
    } else {
      setNewUser({
        ...newUser,
        [name]: value,
      })
    }
  }

  const handleSelectChange = (name, value) => {
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        [name]: value,
      })
    } else {
      setNewUser({
        ...newUser,
        [name]: value,
      })
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!newUser.name || !newUser.email || !newUser.department || !newUser.password) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, this would be an API call
      // const response = await axios.post("/api/admin/users", newUser, { withCredentials: true });
      // const addedUser = response.data;

      // Mock adding a user
      const addedUser = {
        id: users.length + 1,
        ...newUser,
        password: undefined, // Don't store password in state
      }

      setUsers([...users, addedUser])
      setNewUser({
        name: "",
        email: "",
        department: "",
        role: "user",
        password: "",
      })

      toast({
        title: "Success",
        description: "User added successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditUser = (user) => {
    setEditingUser({ ...user, password: "" }) // Don't include password when editing
  }

  const handleUpdateUser = async () => {
    if (!editingUser.name || !editingUser.email || !editingUser.department) {
      toast({
        title: "Error",
        description: "Name, email, and department are required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, this would be an API call
      // const payload = { ...editingUser };
      // if (!editingUser.password) delete payload.password; // Only send password if changed
      // await axios.put(`/api/admin/users/${editingUser.id}`, payload, { withCredentials: true });

      // Update user in state
      setUsers(
        users.map((user) => {
          if (user.id === editingUser.id) {
            const updatedUser = { ...editingUser }
            delete updatedUser.password // Don't store password in state
            return updatedUser
          }
          return user
        }),
      )

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      setEditingUser(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return
    }

    try {
      // In a real app, this would be an API call
      // await axios.delete(`/api/admin/users/${id}`, { withCredentials: true });

      // Remove user from state
      setUsers(users.filter((user) => user.id !== id))

      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Manage Users</h1>
          <p className="text-gray-600">Add, edit, or remove users in the system</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "primary" : "default"}>
                            {user.role === "admin" ? "Admin" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>{editingUser ? "Edit User" : "Add User"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingUser ? undefined : handleAddUser}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <Input
                        name="name"
                        value={editingUser ? editingUser.name : newUser.name}
                        onChange={handleInputChange}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input
                        name="email"
                        type="email"
                        value={editingUser ? editingUser.email : newUser.email}
                        onChange={handleInputChange}
                        placeholder="Email address"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <Select
                        value={editingUser ? editingUser.department : newUser.department}
                        onValueChange={(value) => handleSelectChange("department", value)}
                        options={departments.map((dept) => ({ value: dept.name, label: dept.name }))}
                        placeholder="Select department"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <Select
                        value={editingUser ? editingUser.role : newUser.role}
                        onValueChange={(value) => handleSelectChange("role", value)}
                        options={[
                          { value: "user", label: "User" },
                          { value: "admin", label: "Admin" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {editingUser ? "Password (leave blank to keep current)" : "Password"}
                      </label>
                      <Input
                        name="password"
                        type="password"
                        value={editingUser ? editingUser.password : newUser.password}
                        onChange={handleInputChange}
                        placeholder="Password"
                        required={!editingUser}
                      />
                    </div>

                    {editingUser ? (
                      <div className="flex space-x-2">
                        <Button type="button" onClick={handleUpdateUser} disabled={isSubmitting} className="flex-1">
                          {isSubmitting ? "Updating..." : "Update User"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Adding..." : "Add User"}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminUsersPage
