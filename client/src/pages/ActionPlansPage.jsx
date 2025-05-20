import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import DashboardHeader from "../components/DashboardHeader";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/Table";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import axios from "axios";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import { capitalizeFirstLetter, Server, getDepartmentName } from "../Constants";

function ActionPlansPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [actionPlans, setActionPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [expectationData, setExpectationData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expModal, setExpModal] = useState(false);
  const [expModal2, setExpModal2] = useState(false);
  const [actionModal, setActionModal] = useState(false);
  const [formModal, setFormModal] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [newEntry, setNewEntry] = useState({
    departmentId: currentUser?.department?._id,
    categoryId: "",
    actions: [],
    ownerId: currentUser?._id,
    targetDate: Date.now(),
    status: "pending",
  });

  const [selected, setSelected] = useState({})
  const [selectedCategory, setSelectedCategory] = useState({})

  const fetchData = async () => {
    try {
      const response = await axios.get(`${Server}/action-plans`, {
        params: { departmentId: currentUser?.department._id },
        withCredentials: true,
      });
      setActionPlans(response.data);
      setFilteredPlans(response.data);

      const catresponse = await axios.get(`${Server}/categories`, {
        withCredentials: true,
      });
      setAllCategories(catresponse.data);

      const depresponse = await axios.get(`${Server}/departments`, {
        withCredentials: true,
      });
      setAllDepartments(depresponse.data);

      const expresponse = await axios.get(`${Server}/analytics/expectation-data/${currentUser?.department?._id}`, {withCredentials: true})
      setExpectationData(expresponse.data)
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load action plans",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  useEffect(() => {
    // Apply filters
    let filtered = [...actionPlans];

    if (statusFilter !== "all") {
      filtered = filtered.filter((plan) => plan.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (plan) => plan.category?.[0].name === categoryFilter
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (plan) =>
          (Array.isArray(plan.actions) &&
            plan.actions.some((a) => a.toLowerCase().includes(query))) ||
          (Array.isArray(plan.expectations) &&
            plan.expectations.some((e) => e.toLowerCase().includes(query))) ||
          plan.owner?.[0]?.name.toLowerCase().includes(query) ||
          plan.category?.[0]?.name.toLowerCase().includes(query)
      );
    }

    setFilteredPlans(filtered);
  }, [statusFilter, categoryFilter, searchQuery, actionPlans]);

  const handleStatusChange = (id, status) => {
    setActionPlans((prev) =>
      prev.map((plan) => (plan._id === id ? { ...plan, status } : plan))
    );
  };

  const handleInputChange = (field, value) => {
    setNewEntry((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    const reqData = actionPlans.map((plan) => ({
      ...plan,
      category: plan?.category?.[0]?._id,
      owner: plan?.owner?.[0]?._id,
    }));
    try {
      await axios.put(
        `${Server}/action-plans`,
        {
          plans: reqData,
        },
        { withCredentials: true }
      );

      toast({
        title: "Action Plans Saved",
        description: "Your action plans have been updated successfully",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save action plans",
        variant: "destructive",
      });
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "in-progress":
        return <Badge variant="primary">In Progress</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const addExpectation = () => {
    const updated = [...(newEntry.expectations || [])];
    updated.push("");
    handleInputChange("expectations", updated);
  };

  const removeExpectation = (index) => {
    const updated = [...(newEntry.expectations || [])];
    updated.splice(index, 1);
    handleInputChange("expectations", updated);
  };

  const handleExpectationsChange = (index, value) => {
    const updated = [...(newEntry.expectations || [])];
    updated[index] = value;
    handleInputChange("expectations", updated);
  };

  const addAction = () => {
    const updated = [...(newEntry.actions || [])];
    updated.push("");
    handleInputChange("actions", updated);
  };

  const removeAction = (index) => {
    const updated = [...(newEntry.actions || [])];
    updated.splice(index, 1);
    handleInputChange("actions", updated);
  };

  const handleActionsChange = (index, value) => {
    const updated = [...(newEntry.actions || [])];
    updated[index] = value;
    handleInputChange("actions", updated);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  const categories = [
    "all",
    ...new Set(actionPlans.map((plan) => plan.category?.[0]?.name)),
  ];

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  const categoryOptions = categories.map((category) => ({
    value: category,
    label: category === "all" ? "All Categories" : category,
  }));

  const handleSubmitAdd = async (e) => {
    e.preventDefault()
    if (!newEntry.actions?.length){
      return toast({
        title: "Warning",
        description: "At least one Action is required!",
        variant: "destructive",
      })
    }
    setIsSubmitting(true)
    try {
      const response = await axios.post(`${Server}/action-plans`, {...newEntry}, {withCredentials : true});
      setFormModal(false)
      fetchData()
      toast({
        title: "Success",
        description: "Action Plan added successfully",
        variant: "informative",
      });
      
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to Add Action Plan",
        variant: "destructive",
      });
    } finally{
      setIsSubmitting(false)
    }
  }

  const ExpectationsTable = ({ data, categoryName }) => {    
      const categoryData = data.find(
        (item) => item.category.toLowerCase() === categoryName?.toLowerCase()
      );

      if (!categoryData) {
        return (
          <div className="p-4 text-red-500 font-semibold">
            No data found for category: <span className="italic">{categoryName}</span>
          </div>
        );
      }

      return (
        <div className="p-4">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-2 border">Department</th>
                <th className="p-2 border">User</th>
                <th className="p-2 border">Expectations</th>
              </tr>
            </thead>
            <tbody>
              {categoryData.departments.map((dept, deptIdx) =>
                dept.users.map((user, userIdx) => (
                  <tr key={`${deptIdx}-${userIdx}`} className="hover:bg-gray-50">
                    <td className="p-2 border">{capitalizeFirstLetter(dept.name)}</td>
                    <td className="p-2 border">{user.name}</td>
                    <td className="p-2 border">
                      <ul className="list-disc list-inside">
                        {user.expectations.map((exp, expIdx) => (
                          <li key={expIdx}>{exp}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={currentUser} />

      <main className="container mx-auto py-6 px-4">

       {["admin", "manager"].includes(currentUser.role) && 
        <Card className="mb-6">
          <CardHeader >
            <CardTitle className="flex items-center justify-between">
              <span className="cursor-pointer flex items-center" onClick={()=>{setShowTable(prev=>!prev)}}>
                Expectations (by other departments)  {showTable ? <FaAngleUp/> : <FaAngleDown/> }
              </span>        
            </CardTitle>
          </CardHeader>
          {showTable &&<CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Expectations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allCategories.map((category, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {capitalizeFirstLetter(category.name)}
                    </TableCell>
                    <TableCell>
                      {" "}
                      <span
                        onClick={() => {
                          setExpModal2(true);
                          setSelectedCategory(category.name)
                        }}
                        className="underline cursor-pointer"
                      >
                        Click to see
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
                {expModal2 && (
                  <div
                    className="font-normal text-md fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                  >
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl relative p-4">
                      <button
                        className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-3 px-4 rounded-[50px]"
                        onClick={() => {setExpModal2(false);setSelectedCategory({});}}
                      >
                        X
                      </button>
                      <Card className="shadow-none border-none">
                        <CardHeader>
                          <CardTitle>Expectations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ExpectationsTable data={expectationData} categoryName={selectedCategory}/>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
            </Table>
             
          </CardContent>}
        </Card>
        }

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Action Plans -{" "}
                {capitalizeFirstLetter(currentUser?.department?.name)}
              </span>
              {["admin", "manager"].includes(currentUser.role) && (
                <>
                  {["admin", "manager"].includes(currentUser?.role) && (
                    <>
                      <Button onClick={() => setFormModal(true)}>
                        Add Action Plan
                      </Button>
                      {formModal && (
                        <div className="font-normal text-sm fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl relative p-4 overflow-auto max-h-[95%]">
                            {/* Close Button */}
                            <button
                              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-3 px-4 rounded-[40px]"
                              onClick={() => setFormModal(false)}
                            >
                              X
                            </button>

                            <Card className="shadow-none border-none">
                              <CardHeader>
                                <CardTitle>Add Action Plan</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <form onSubmit={handleSubmitAdd}>
                                  <div className="space-y-4">
                                    {/* Department */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Department
                                      </label>
                                      <Input
                                        disabled
                                        name="department"
                                        value={currentUser?.department?.name}
                                        placeholder="Department"
                                        required
                                      />
                                    </div>

                                    {/* Category */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                      </label>
                                      <Select
                                        value={newEntry.categoryId}
                                        onValueChange={(value) =>
                                          handleInputChange("categoryId", value)
                                        }
                                        options={allCategories?.map(
                                          (cat, index) => ({
                                            value: cat._id,
                                            label: cat.name,
                                            key: index,
                                          })
                                        )}
                                        placeholder="Select Category"
                                      />
                                    </div>

                                    {/* <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Expectations
                                      </label>
                                      {newEntry.expectations?.map(
                                        (exp, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center space-x-2 mb-2"
                                          >
                                            <Input
                                              value={exp}
                                              onChange={(e) =>
                                                handleExpectationsChange(
                                                  index,
                                                  e.target.value
                                                )
                                              }
                                              placeholder={`Expectation ${
                                                index + 1
                                              }`}
                                              required
                                            />
                                            <Button
                                              type="button"
                                              variant="destructive"
                                              onClick={() =>
                                                removeExpectation(index)
                                              }
                                            >
                                              X
                                            </Button>
                                          </div>
                                        )
                                      )}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addExpectation}
                                      >
                                        + Add Expectation
                                      </Button>
                                    </div> */}

                                    {/* Actions */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Actions
                                      </label>
                                      {newEntry.actions?.map((act, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center space-x-2 mb-2"
                                        >
                                          <Input
                                            value={act}
                                            onChange={(e) =>
                                              handleActionsChange(
                                                index,
                                                e.target.value
                                              )
                                            }
                                            placeholder={`Action ${index + 1}`}
                                            required
                                          />
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => removeAction(index)}
                                          >
                                            X
                                          </Button>
                                        </div>
                                      ))}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addAction}
                                      >
                                        + Add Action
                                      </Button>
                                    </div>

                                      <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Target Date
                                      </label>
                                    <input
                                      type="date"
                                      name="targetDate"
                                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                                      value={newEntry?.targetDate ? new Date(newEntry.targetDate).toISOString().split("T")[0] : ""}
                                      min={new Date().toISOString().split("T")[0]}
                                      onChange={(e) => {
                                        const selectedDate = new Date(e.target.value);
                                        handleInputChange("targetDate", selectedDate.getTime());
                                      }}
                                      required
                                    />

                                    </div>

                                    {/* Submit */}
                                    <div className="flex space-x-2">
                                      <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full"
                                      >
                                        {isSubmitting
                                          ? "Adding..."
                                          : "Add Action Plan"}
                                      </Button>
                                    </div>
                                  </div>
                                </form>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )}
                    </>
                  )}
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
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="w-full sm:w-1/3">
                <label className="text-sm font-medium mb-1 block">
                  Filter by Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  options={statusOptions}
                />
              </div>

              <div className="w-full sm:w-1/3">
                <label className="text-sm font-medium mb-1 block">
                  Filter by Category
                </label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                  options={categoryOptions}
                />
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
                  <TableHead>Department</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Expectations</TableHead>
                  <TableHead>Action Plans</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Status</TableHead>
                  {currentUser.role === "admin" && (
                    <TableHead className="w-[120px]">Update Status</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan, index) => (
                  <TableRow key={plan._id + index}>
                    <TableCell>
                      {capitalizeFirstLetter(currentUser.department?.name)}
                    </TableCell>
                    <TableCell>
                      {capitalizeFirstLetter(plan.category?.[0]?.name)}
                    </TableCell>
                    <TableCell>
                      {" "}
                      <span
                        onClick={() => {
                          setExpModal(true);
                          setSelected(plan)
                        }}
                        className="underline cursor-pointer"
                      >
                        Click to see
                      </span>
                    </TableCell>
                    <TableCell>
                      {" "}
                      <span
                        onClick={() => {
                          setActionModal(true);
                          setSelected(plan)
                        }}
                        className="underline cursor-pointer"
                      >
                        Click to see
                      </span>{" "}
                    </TableCell>
                    <TableCell>
                      {capitalizeFirstLetter(plan.owner?.[0]?.name)}
                    </TableCell>
                    <TableCell>
                      {new Date(plan.targetDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(plan.status)}</TableCell>
                    {currentUser.role === "admin" && (
                      <TableCell>
                        <Select
                          value={plan.status}
                          onValueChange={(value) =>
                            handleStatusChange(plan._id, value)
                          }
                          options={[
                            { value: "pending", label: "Pending" },
                            { value: "in-progress", label: "In Progress" },
                            { value: "completed", label: "Completed" },
                          ]}
                          className="h-8"
                        />
                      </TableCell>
                    )}
                    {/* Expectations Modal */}
                    {expModal && (
                      <div
                        key={plan._id}
                        className="font-normal text-md fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                      >
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl relative p-4">
                          <button
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-3 px-4 rounded-[50px]"
                            onClick={() => {setExpModal(false);setSelected({});}}
                          >
                            X
                          </button>
                          <Card className="shadow-none border-none">
                            <CardHeader>
                              <CardTitle>Expectations</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ExpectationsTable data={expectationData} categoryName={plan.category?.[0]?.name}/>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {/* Actions Modal */}
                    {actionModal && (
                      <div
                        key={plan._id}
                        className="font-normal text-md fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                      >
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl relative p-4">
                          <button
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-3 px-4 rounded-[50px]"
                            onClick={() => {setActionModal(false);setSelected({})}}
                          >
                            X
                          </button>
                          <Card className="shadow-none border-none">
                            <CardHeader>
                              <CardTitle>Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {selected?.actions?.map((exp, index) => (
                                <span key={plan._id + index}>
                                  {index + 1}. {exp} <br />
                                </span>
                              ))}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}
                  </TableRow>
                ))}
                {filteredPlans.length === 0 && currentUser.role === "user" && (
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
  );
}
export default ActionPlansPage;



            // <Table>
            //   <TableHeader>
            //     <TableRow>
            //       <TableHead>Category</TableHead>
            //       <TableHead>Expectations</TableHead>
            //     </TableRow>
            //   </TableHeader>
            //   <TableBody>
            //     {filteredPlans.map((plan, index) => (
            //       <TableRow key={plan._id + index}>
            //         <TableCell>
            //           {capitalizeFirstLetter(plan.category?.[0]?.name)}
            //         </TableCell>
            //         <TableCell>
            //           {" "}
            //           <span
            //             onClick={() => {
            //               setExpModal(true);
            //               setSelected(plan)
            //             }}
            //             className="underline cursor-pointer"
            //           >
            //             Click to see
            //           </span>
            //         </TableCell>
            //         {/* Expectations Modal */}
            //         {expModal && (
            //           <div
            //             key={plan._id}
            //             className="font-normal text-md fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            //           >
            //             <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl relative p-4">
            //               <button
            //                 className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-3 px-4 rounded-[50px]"
            //                 onClick={() => {setExpModal(false);setSelected({});}}
            //               >
            //                 X
            //               </button>
            //               <Card className="shadow-none border-none">
            //                 <CardHeader>
            //                   <CardTitle>Expectations</CardTitle>
            //                 </CardHeader>
            //                 <CardContent>
            //                   {selected?.expectations?.map((exp, index) => (
            //                     <span key={plan._id + index}>
            //                       {index + 1}. {exp} <br />
            //                     </span>
            //                   ))}
            //                 </CardContent>
            //               </Card>
            //             </div>
            //           </div>
            //         )}
            //       </TableRow>
            //     ))}
            //     {filteredPlans.length === 0 && currentUser.role === "user" && (
            //       <TableRow>
            //         <TableCell colSpan={7} className="text-center py-4">
            //           No action plans found matching the current filters
            //         </TableCell>
            //       </TableRow>
            //     )}
            //   </TableBody>
            // </Table>