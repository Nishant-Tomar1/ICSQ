import { useState, useEffect } from "react";
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
import { FaAngleDown, FaAngleUp, FaClipboardList } from "react-icons/fa";
import { capitalizeFirstLetter, Server } from "../Constants";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../components/ui/Dialog";

// Helper component for showing expectations in a table
function ExpectationsTable({ data, categoryName }) {
  if (!data || !Array.isArray(data)) return <div>No data available.</div>;
  const categoryData = data.find(
    (item) => item.category?.toLowerCase() === categoryName?.toLowerCase()
  );
  if (!categoryData) {
    return (
      <div className="p-4 text-red-500 font-semibold">
        No data found for category: <span className="italic">{categoryName}</span>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto max-h-[400px] rounded-lg border border-muted-foreground/30 bg-[#232026]/80">
      <table className="w-full table-auto border-collapse">
        <thead className="sticky top-0 z-10 bg-[#93725E] text-[#FFF8E7] shadow-sm">
          <tr>
            <th className="p-2 border-b border-muted-foreground/30 font-semibold">Department</th>
            <th className="p-2 border-b border-muted-foreground/30 font-semibold">User</th>
            <th className="p-2 border-b border-muted-foreground/30 font-semibold">Expectations</th>
          </tr>
        </thead>
        <tbody>
          {categoryData.departments.map((dept, deptIdx) =>
            dept.users.map((user, userIdx) => (
              <tr
                key={`${deptIdx}-${userIdx}`}
                className={
                  (deptIdx + userIdx) % 2 === 0
                    ? "bg-[#232026]/60 hover:bg-[#232026]/80"
                    : "bg-[#232026]/40 hover:bg-[#232026]/60"
                }
              >
                <td className="p-2 border-b border-muted-foreground/20 text-[#FFF8E7]">{capitalizeFirstLetter(dept.name)}</td>
                <td className="p-2 border-b border-muted-foreground/20 text-[#FFF8E7]">{user.name}</td>
                <td className="p-2 border-b border-muted-foreground/20 text-[#FFF8E7]">
                  <ul className="list-disc list-inside">
                    {user.expectations.map((exp, expIdx) => exp && <li key={expIdx}>{typeof exp === 'object' ? `${exp.text} ${exp.rating !== undefined ? `(${exp.rating}%)` : ''}` : exp}</li>)}
                  </ul>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Replace ExpectationsTable with a new version for HODs that supports rating display, grouping, filtering, and assign button
function HODExpectationsTable({ data, categoryName, onAssign, ratingFilter }) {
  if (!data || !Array.isArray(data)) return <div>No data available.</div>;
  const categoryData = data.find(
    (item) => item.category?.toLowerCase() === categoryName?.toLowerCase()
  );
  if (!categoryData) {
    return (
      <div className="p-4 text-red-500 font-semibold">
        No data found for category: <span className="italic">{categoryName}</span>
      </div>
    );
  }
  // Flatten all expectations with user, dept, and rating
  let allExpectations = [];
  categoryData.departments.forEach((dept) => {
    dept.users.forEach((user) => {
      (user.expectations || []).forEach((exp, idx) => {
        if (exp) {
          allExpectations.push({
            department: dept.name,
            user: user.name,
            expectation: exp.text || exp, // support both string and {text, rating}
            rating: exp.rating !== undefined ? exp.rating : user.ratings?.[idx] || 0,
            userId: user._id,
          });
        }
      });
    });
  });
  // Group by rating
  const groups = {
    detractor: allExpectations.filter(e => e.rating <= 40),
    passive: allExpectations.filter(e => e.rating > 40 && e.rating < 80),
    promoter: allExpectations.filter(e => e.rating >= 80),
  };
  const groupOrder = [
    { key: 'detractor', label: 'Detractor (≤ 40)' },
    { key: 'passive', label: 'Passive (41-79)' },
    { key: 'promoter', label: 'Promoter (≥ 80)' },
  ];
  return (
    <div className="overflow-x-auto max-h-[500px] rounded-lg border border-muted-foreground/30 bg-[#232026]/80">
      {groupOrder.map(group => {
        if (ratingFilter && ratingFilter !== group.key) return null;
        const items = groups[group.key];
        if (!items.length) return null;
        return (
          <div key={group.key} className="mb-6 p-2"> 
            <div className="font-bold text-lg mb-2 text-[goldenrod]">{group.label}</div>
            <table className="w-full table-auto border-collapse mb-2">
              <thead className="sticky top-0 z-10 bg-[#93725E] text-[#FFF8E7] shadow-sm">
                <tr>
                  <th className="p-2 border-b border-muted-foreground/30 font-semibold">Department</th>
                  <th className="p-2 border-b border-muted-foreground/30 font-semibold">User</th>
                  <th className="p-2 border-b border-muted-foreground/30 font-semibold">Expectation</th>
                  <th className="p-2 border-b border-muted-foreground/30 font-semibold">Rating</th>
                  <th className="p-2 border-b border-muted-foreground/30 font-semibold">Assign</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-[#232026]/60 hover:bg-[#232026]/80" : "bg-[#232026]/40 hover:bg-[#232026]/60"}>
                    <td className="p-2 border-b border-muted-foreground/20 text-[#FFF8E7]">{capitalizeFirstLetter(e.department)}</td>
                    <td className="p-2 border-b border-muted-foreground/20 text-[#FFF8E7]">{e.user}</td>
                    <td className="p-2 border-b border-muted-foreground/20 text-[#FFF8E7]">{e.expectation}</td>
                    <td className="p-2 border-b border-muted-foreground/20 text-[#FFF8E7] font-semibold">{e.rating}%</td>
                    <td className="p-2 border-b border-muted-foreground/20 text-[#FFF8E7]">
                      <Button size="sm" variant="primary" onClick={() => onAssign(e)}>
                        Assign Action Plan
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      {(!groups.detractor.length && !groups.passive.length && !groups.promoter.length) && (
        <div className="p-4 text-gray-400">No expectations found.</div>
      )}
    </div>
  );
}

// 1. Add summarization for all categories when no category is selected
// Helper: summarize all expectations by category and rating
function summarizeAllExpectations(expectationData) {
  if (!Array.isArray(expectationData)) return {};
  const summary = {};
  expectationData.forEach(cat => {
    const catName = cat.category;
    if (!summary[catName]) summary[catName] = { promoter: [], passive: [], detractor: [] };
    cat.departments.forEach(dept => {
      dept.users.forEach(user => {
        (user.expectations || []).forEach((exp, idx) => {
          if (exp) {
            const rating = exp.rating !== undefined ? exp.rating : user.ratings?.[idx] || 0;
            let group = 'detractor';
            if (rating >= 80) group = 'promoter';
            else if (rating > 40) group = 'passive';
            summary[catName][group].push({
              department: dept.name,
              user: user.name,
              expectation: exp.text || exp,
              rating,
              userId: user._id,
            });
          }
        });
      });
    });
  });
  return summary;
}

function ActionPlansPage() {
  const { currentUser, getCurrentDepartment } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [actionPlans, setActionPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [expectationData, setExpectationData] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expModal, setExpModal] = useState(false);
  const [actionModal, setActionModal] = useState(false);
  const [formModal, setFormModal] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [ruleSummary, setRuleSummary] = useState([]);
  const [aiSummary, setAiSummary] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selected, setSelected] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [adminFilters, setAdminFilters] = useState({ departmentId: "", categoryId: "", assignedTo: "", status: "" });
  const [newEntry, setNewEntry] = useState({
    departmentId: getCurrentDepartment()?._id,
    categoryId: "",
    actions: [],
    assignedTo: "",
    targetDate: "",
    status: "pending",
  });
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    expectations: "",
    actions: "",
    instructions: "",
    assignedTo: "",
    targetDate: "",
    status: "pending",
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ _id: '', expectations: '', actions: '', instructions: '', assignedTo: '', targetDate: '', status: 'pending' });
  const [ratingFilter, setRatingFilter] = useState("");
  // --- Fix: Add missing states for all-summary selection and modal ---
  const [selectedAllSummary, setSelectedAllSummary] = useState({});
  const [assignAllSummaryModal, setAssignAllSummaryModal] = useState(false);
  const [assignAllSummaryData, setAssignAllSummaryData] = useState([]);
  // Add state for all-categories summary
  const [allSummary, setAllSummary] = useState([]);
  const [allAiSummary, setAllAiSummary] = useState([]);
  const [isAllSummaryLoading, setIsAllSummaryLoading] = useState(false);
  const [isAllAiSummaryLoading, setIsAllAiSummaryLoading] = useState(false);
  const [selectedAllSummaryPoints, setSelectedAllSummaryPoints] = useState([]);
  const [selectedAllAiPoints, setSelectedAllAiPoints] = useState([]);
  // Add these hooks at the top level
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionModalPlan, setActionModalPlan] = useState(null);
  const [actionInput, setActionInput] = useState("");
  // Open edit modal and prefill form
  const openEditModal = async (plan) => {
    setEditForm({
      _id: plan._id,
      expectations: plan.expectations || '',
      actions: plan.actions || '',
      instructions: plan.instructions || '',
      assignedTo: plan.assignedTo?._id || '',
      targetDate: plan.targetDate ? new Date(plan.targetDate).toISOString().split('T')[0] : '',
      status: plan.status || 'pending',
    });
    setEditModalOpen(true); // open immediately
    setDepartmentUsers([]); // clear previous users
    setUsersLoading(true);
    try {
      const res = await axios.get(`${Server}/users/by-department/${plan.department?._id}`, { withCredentials: true });
      setDepartmentUsers(res.data);
    } catch {
      setDepartmentUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };
  // Handle edit form changes
  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };
  // Handle edit action plan submit
  const handleEditActionPlan = async (e) => {
    e.preventDefault();
    if (!editForm.expectations.trim()) {
      toast({ title: 'Error', description: 'Expectations are required.', variant: 'destructive' });
      return;
    }
    if (!editForm.actions.trim()) {
      toast({ title: 'Error', description: 'Actions are required.', variant: 'destructive' });
      return;
    }
    if (!editForm.assignedTo) {
      toast({ title: 'Error', description: 'Please select a user to assign.', variant: 'destructive' });
      return;
    }
    if (!editForm.targetDate) {
      toast({ title: 'Error', description: 'Please select a target date.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.put(
        `${Server}/action-plans/${editForm._id}`,
        {
          expectations: editForm.expectations,
          actions: editForm.actions,
          instructions: editForm.instructions,
          assignedTo: editForm.assignedTo,
          targetDate: editForm.targetDate,
          status: editForm.status,
        },
        { withCredentials: true }
      );
      setEditModalOpen(false);
      setEditForm({ _id: '', expectations: '', actions: '', instructions: '', assignedTo: '', targetDate: '', status: 'pending' });
      fetchData();
      toast({ title: 'Success', description: 'Action plan updated!' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update action plan.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];
  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...allCategories.map((cat) => ({ value: cat.name, label: cat.name })),
  ];

  // Fetch action plans based on role
  const fetchData = async () => {
    setIsLoading(true);
    try {
      let response;
      if (currentUser.role === "admin") {
        response = await axios.get(`${Server}/action-plans/admin`, {
          params: adminFilters,
          withCredentials: true,
        });
      } else if (currentUser.role === "hod") {
        response = await axios.get(`${Server}/action-plans/hod`, { withCredentials: true });
      } else {
        response = await axios.get(`${Server}/action-plans/user`, { withCredentials: true });
      }
      setActionPlans(response.data);
      setFilteredPlans(response.data);
      const catresponse = await axios.get(`${Server}/categories`, { withCredentials: true });
      setAllCategories(catresponse.data);
      const depresponse = await axios.get(`${Server}/departments`, { withCredentials: true });
      setAllDepartments(depresponse.data);
      if (currentUser.role === "hod") {
        const expresponse = await axios.get(`${Server}/analytics/expectation-data/${getCurrentDepartment()?._id}`, { withCredentials: true });
        setExpectationData(expresponse.data);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load action plans", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [currentUser, JSON.stringify(adminFilters)]);

  useEffect(() => {
    let filtered = [...actionPlans];
    if (statusFilter !== "all") {
      filtered = filtered.filter((plan) => plan.status === statusFilter);
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (plan) => plan.category?.name === categoryFilter || plan.category?.[0]?.name === categoryFilter
      );
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (plan) =>
          (Array.isArray(plan.actions) && plan.actions.some((a) => a.toLowerCase().includes(query))) ||
          plan.category?.name?.toLowerCase().includes(query) ||
          plan.category?.[0]?.name?.toLowerCase().includes(query)
      );
    }
    setFilteredPlans(filtered);
  }, [statusFilter, categoryFilter, searchQuery, actionPlans]);

  // Fetch users in department for 'Assigned To' dropdown
  useEffect(() => {
    if (currentUser.role === "hod" && getCurrentDepartment()?._id) {
      setUsersLoading(true);
      axios
        .get(`${Server}/users/by-department/${getCurrentDepartment()?._id}`, {
          withCredentials: true,
        })
        .then((res) => setDepartmentUsers(res.data))
        .catch(() => setDepartmentUsers([]))
        .finally(() => setUsersLoading(false));
    }
  }, [currentUser, getCurrentDepartment]);
  // Handle create form changes
  const handleCreateFormChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };
  // Handle create action plan submit
  const handleCreateActionPlan = async (e) => {
    e.preventDefault();
    if (!createForm.expectations.trim()) {
      toast({ title: "Error", description: "Expectations are required.", variant: "destructive" });
      return;
    }
    if (!createForm.assignedTo) {
      toast({ title: "Error", description: "Please select a user to assign.", variant: "destructive" });
      return;
    }
    if (!createForm.targetDate) {
      toast({ title: "Error", description: "Please select a target date.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post(
        `${Server}/action-plans`,
        {
          departmentId: getCurrentDepartment()?._id,
          categoryId: allCategories.find((c) => c.name === selectedCategory)?._id,
          expectations: createForm.expectations,
          actions: createForm.actions,
          instructions: createForm.instructions,
          assignedTo: createForm.assignedTo,
          targetDate: createForm.targetDate,
          status: createForm.status,
        },
        { withCredentials: true }
      );
      setCreateModalOpen(false);
      setCreateForm({ expectations: '', actions: '', instructions: '', assignedTo: '', targetDate: '', status: 'pending' });
      fetchData();
      toast({ title: "Success", description: "Action plan created!" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to create action plan.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
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

  // --- CRUD and modal handlers (add, edit, delete, status update) would go here ---
  // --- Summarization handlers ---
  const fetchRuleSummary = async (categoryId) => {
    setRuleSummary([]);
    try {
      const res = await axios.get(`${Server}/analytics/summarize-expectations/rule`, {
        params: {
          departmentId: getCurrentDepartment()?._id,
          category: categoryId,
        },
        withCredentials: true,
      });
      setRuleSummary(res.data.summary);
    } catch (err) {
      setRuleSummary([]);
    }
  };
  const fetchAiSummary = async (categoryId) => {
    setIsAiLoading(true);
    setAiSummary("");
    try {
      const res = await axios.get(`${Server}/analytics/summarize-expectations/ai`, {
        params: {
          departmentId: getCurrentDepartment()?._id,
          category: categoryId,
        },
        withCredentials: true,
      });
      setAiSummary(res.data.summary);
    } catch (err) {
      setAiSummary("Failed to generate AI summary.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- Summarization selection and assignment features ---
  // Add state for selected summary points
  const [selectedRulePoints, setSelectedRulePoints] = useState([]);
  const [selectedAiPoints, setSelectedAiPoints] = useState([]);

  // Handler for toggling summary point selection
  const toggleRulePoint = (idx) => {
    setSelectedRulePoints((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };
  const toggleAiPoint = (idx) => {
    setSelectedAiPoints((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Handler to assign selected summary points as action plan
  const assignSummaryPoints = async (points, type) => {
    if (!points.length) {
      toast({ title: 'Error', description: 'Select at least one summary point.', variant: 'destructive' });
      return;
    }
    setCreateModalOpen(true);
    setCreateForm(f => ({
      ...f,
      expectations: points.map(idx => type === 'rule' ? ruleSummary[idx]?.text : aiSummary[idx]).filter(Boolean).join('; '),
      actions: '',
      instructions: '',
      assignedTo: '',
    }));
  };

  // Handler to fetch all-categories rule-based summary
  const fetchAllSummary = async () => {
    setIsAllSummaryLoading(true);
    setAllSummary([]);
    try {
      const res = await axios.get(`${Server}/analytics/summarize-expectations/rule`, {
        params: { departmentId: getCurrentDepartment()?._id },
        withCredentials: true,
      });
      setAllSummary(res.data.summary || []);
    } catch {
      setAllSummary([]);
    } finally {
      setIsAllSummaryLoading(false);
    }
  };
  // Handler to fetch all-categories AI summary
  const fetchAllAiSummary = async () => {
    setIsAllAiSummaryLoading(true);
    setAllAiSummary([]);
    try {
      const res = await axios.get(`${Server}/analytics/summarize-expectations/ai`, {
        params: { departmentId: getCurrentDepartment()?._id },
        withCredentials: true,
      });
      setAllAiSummary((res.data.summary || '').split('\n').filter(Boolean));
    } catch {
      setAllAiSummary([]);
    } finally {
      setIsAllAiSummaryLoading(false);
    }
  };

  // --- Role-based rendering ---
  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  // --- User View ---
  if (currentUser.role === "user") {
    const openActionModal = (plan) => {
      setActionModalPlan(plan);
      setActionInput(plan.actions || "");
      setActionModalOpen(true);
    };
    const handleActionSave = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await axios.put(`${Server}/action-plans/${actionModalPlan._id}`, { actions: actionInput }, { withCredentials: true });
        setActionModalOpen(false);
        fetchData();
        toast({ title: 'Success', description: 'Actions updated!' });
      } catch {
        toast({ title: 'Error', description: 'Failed to update actions.', variant: 'destructive' });
      } finally {
        setIsSubmitting(false);
      }
    };
    return (
      <div>
        <DashboardHeader title="My Action Plans" />
        <Card className="m-4">
          <CardHeader>
            <CardTitle>Assigned to Me</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Expectations</TableHead>
                  <TableHead>Instructions</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Update Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan._id}>
                    <TableCell className="max-w-[120px] truncate" title={plan.department?.name}>{capitalizeFirstLetter(plan.department?.name)}</TableCell>
                    <TableCell className="max-w-[120px] truncate" title={plan.category?.name}>{capitalizeFirstLetter(plan.category?.name)}</TableCell>
                    <TableCell className="max-w-[220px] truncate" title={plan.expectations}>{plan.expectations}</TableCell>
                    <TableCell className="max-w-[180px] truncate" title={plan.instructions}>{plan.instructions}</TableCell>
                    <TableCell className="max-w-[120px] truncate">{new Date(plan.targetDate).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-[100px]">{getStatusBadge(plan.status)}</TableCell>
                    <TableCell className="max-w-[140px]">
                      <Select
                        value={plan.status}
                        onValueChange={async (value) => {
                          setIsSubmitting(true);
                          try {
                            await axios.patch(`${Server}/action-plans/${plan._id}/status`, { status: value }, { withCredentials: true });
                            fetchData();
                            toast({ title: "Success", description: "Status updated successfully", variant: "success" });
                          } catch (e) {
                            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        options={statusOptions.filter(opt => opt.value !== "all")}
                        className="h-8"
                        disabled={isSubmitting}
                      />
                    </TableCell>
                    <TableCell className="max-w-[120px]">
                      <Button size="sm" variant="primary" onClick={() => openActionModal(plan)}>
                        {plan.actions ? "Edit Actions" : "Add Actions"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPlans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">No action plans assigned to you.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {/* Modal for adding/updating actions */}
        <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
          <DialogContent className="bg-[#232026]/90 max-w-lg">
            <DialogHeader>
              <DialogTitle>{actionModalPlan?.actions ? "Edit Actions Taken" : "Add Actions Taken"}</DialogTitle>
            </DialogHeader>
            {actionModalPlan && (
              <form onSubmit={handleActionSave} className="space-y-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Department</div>
                  <div className="font-semibold text-[#FFF8E7]">{capitalizeFirstLetter(actionModalPlan.department?.name)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Category</div>
                  <div className="font-semibold text-[#FFF8E7]">{capitalizeFirstLetter(actionModalPlan.category?.name)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Expectations</div>
                  <div className="text-[#FFF8E7]">{actionModalPlan.expectations}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Instructions</div>
                  <div className="text-[#FFF8E7]">{actionModalPlan.instructions}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Actions Taken</label>
                  <Input
                    as="textarea"
                    rows={3}
                    value={actionInput}
                    onChange={e => setActionInput(e.target.value)}
                    placeholder="Describe what actions you have taken..."
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Actions"}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // --- Admin View ---
  if (currentUser.role === "admin") {
    return (
      <div>
        <DashboardHeader title="All Action Plans (Admin)" />
        <Card className="m-4">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select
                value={adminFilters.departmentId}
                onValueChange={val => setAdminFilters(f => ({ ...f, departmentId: val }))}
                options={[{ value: "", label: "All Departments" }, ...allDepartments.map(d => ({ value: d._id, label: d.name }))]}
                className="w-48"
              />
              <Select
                value={adminFilters.categoryId}
                onValueChange={val => setAdminFilters(f => ({ ...f, categoryId: val }))}
                options={[{ value: "", label: "All Categories" }, ...allCategories.map(c => ({ value: c._id, label: c.name }))]}
                className="w-48"
              />
              <Select
                value={adminFilters.assignedTo}
                onValueChange={val => setAdminFilters(f => ({ ...f, assignedTo: val }))}
                options={[{ value: "", label: "All Assignees" }, ...[...new Set(actionPlans.map(p => p.assignedTo?._id && p.assignedTo))].filter(Boolean).map(u => ({ value: u._id, label: u.name }))]}
                className="w-48"
              />
              <Select
                value={adminFilters.status}
                onValueChange={val => setAdminFilters(f => ({ ...f, status: val }))}
                options={statusOptions}
                className="w-48"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>All Action Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Expectations</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Instructions</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan._id}>
                    <TableCell>{plan.department?.name}</TableCell>
                    <TableCell>{plan.category?.name}</TableCell>
                    <TableCell>{plan.expectations}</TableCell>
                    <TableCell>
                      <span>{plan.actions}</span>
                    </TableCell>
                    <TableCell>{plan.instructions}</TableCell>
                    <TableCell>{plan.assignedBy?.name}</TableCell>
                    <TableCell>{plan.assignedTo?.name}</TableCell>
                    <TableCell>{new Date(plan.targetDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(plan.status)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="mr-2" disabled>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={async () => {
                        if (window.confirm("Are you sure you want to delete this action plan?")) {
                          setIsSubmitting(true);
                          try {
                            await axios.delete(`${Server}/action-plans/${plan._id}`, { withCredentials: true });
                            fetchData();
                          } catch (e) {
                            toast({ title: "Error", description: "Failed to delete action plan", variant: "destructive" });
                          } finally {
                            setIsSubmitting(false);
                          }
                        }
                      }}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPlans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">No action plans found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- HOD View ---
  if (currentUser.role === "hod") {
    return (
      <div className="min-h-screen text-foreground">
        <DashboardHeader user={currentUser} />
         {/* HOD's Assigned Action Plans Table (at the top) */}
         {actionPlans.filter(plan => plan.assignedBy?._id === currentUser._id).length > 0 && (
              <Card className="m-4 lg:m-6">
                <CardHeader>
                  <CardTitle>Action Plans Assigned by You</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full overflow-x-auto rounded-lg shadow-lg bg-[#232026]/80 border border-[goldenrod]/30 max-h-96 overflow-y-auto">
                    <table className="w-full min-w-[700px] rounded-lg overflow-hidden">
                      <thead className="bg-[#93725E] text-[#232026]">
                        <tr>
                          <th className="p-3 font-semibold">Department</th>
                          <th className="p-3 font-semibold">Category</th>
                          <th className="p-3 font-semibold">Expectations</th>
                          <th className="p-3 font-semibold">Actions</th>
                          <th className="p-3 font-semibold">Instructions</th>
                          <th className="p-3 font-semibold">Assigned To</th>
                          <th className="p-3 font-semibold">Target Date</th>
                          <th className="p-3 font-semibold">Status</th>
                          <th className="p-3 font-semibold">Update Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actionPlans.filter(plan => plan.assignedBy?._id === currentUser._id).map((plan, idx) => (
                          <tr key={plan._id} className={idx % 2 === 0 ? "bg-[#232026]/60" : "bg-[#232026]/40"}>
                            <td className="p-3 text-[#FFF8E7]">{capitalizeFirstLetter(plan.department?.name)}</td>
                            <td className="p-3 text-[#FFF8E7]">{capitalizeFirstLetter(plan.category?.name)}</td>
                            <td className="p-3 text-[#FFF8E7]">{plan.expectations}</td>
                            <td className="p-3 text-[#FFF8E7]">
                              <span>{plan.actions}</span>
                            </td>
                            <td className="p-3 text-[#FFF8E7]">{plan.instructions}</td>
                            <td className="p-3 text-[#FFF8E7]">{plan.assignedTo?.name}</td>
                            <td className="p-3 text-[#FFF8E7]">{new Date(plan.targetDate).toLocaleDateString()}</td>
                            <td className="p-3">{getStatusBadge(plan.status)}</td>
                            <td className="p-3">
                              <Select
                                value={plan.status}
                                onValueChange={async (value) => {
                                  setIsSubmitting(true);
                                  try {
                                    await axios.put(
                                      `${Server}/action-plans/${plan._id}`,
                                      { status: value },
                                      { withCredentials: true }
                                    );
                                    fetchData();
                                    toast({ title: "Success", description: "Status updated successfully", variant: "success" });
                                  } catch (e) {
                                    toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
                                  } finally {
                                    setIsSubmitting(false);
                                  }
                                }}
                                options={statusOptions.filter(opt => opt.value !== "all")}
                                className="h-8"
                                disabled={isSubmitting}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
        <main className="container mx-auto  flex flex-col md:flex-row gap-8 mt-6">
          {/* Category List */}
          <aside className="w-full md:w-1/4">
            <Card className="mb-4 bg-[#232026]/90">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {allCategories
                    .filter(
                      (cat) =>
                        !cat.department ||
                        String(cat.department) === String(getCurrentDepartment()?._id)
                    )
                    .map((category) => (
                      <li key={category._id}>
                        <Button
                          variant={selectedCategory === category.name ? "primary" : "outline"}
                          className="w-full justify-start"
                          onClick={() => {
                            setSelectedCategory(category.name);
                            setRuleSummary([]);
                            setAiSummary("");
                          }}
                        >
                          {capitalizeFirstLetter(category.name)}
                        </Button>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <section className="flex-1 flex flex-col gap-6">
            {/* Placeholder when no category is selected */}
            {!selectedCategory && (
              <Card className="bg-[#232026]/90 flex flex-col items-center justify-center border-dashed border-2 border-muted-foreground/30">
                <CardContent className="flex flex-col items-center justify-center w-full">
                  <FaClipboardList className="text-4xl text-gray-400 mb-4" />
                  <h2 className="text-xl font-semibold mb-2 text-[goldenrod]">Summarize All Categories</h2>
                  <p className="text-center max-w-md text-gray-400 mb-4">
                    Generate a concise summary (10-20 bullet points) of all expectations across all categories. Select points to assign as action plans.
                  </p>
                  <div className="flex gap-4 mb-4">
                    <Button variant="primary" onClick={fetchAllSummary} disabled={isAllSummaryLoading}>
                      {isAllSummaryLoading ? 'Summarizing...' : 'Summarize All (Rule-Based)'}
                    </Button>
                    <Button variant="outline" onClick={fetchAllAiSummary} disabled={isAllAiSummaryLoading}>
                      {isAllAiSummaryLoading ? 'Summarizing...' : 'Summarize All (AI)'}
                    </Button>
                  </div>
                  {/* Rule-Based Summary */}
                  {allSummary.length > 0 && (
                    <div className="w-full max-w-2xl mb-6 bg-[#232026]/90">
                      <h3 className="text-lg font-semibold text-[goldenrod] mb-2">Rule-Based Summary</h3>
                      <ul className="list-disc ml-6 mt-2">
                        {allSummary.map((item, idx) => (
                          <li key={idx} className="mb-1 text-gray-300 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedAllSummaryPoints.includes(idx)}
                              onChange={() => setSelectedAllSummaryPoints(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
                              className="accent-[goldenrod] w-4 h-4"
                            />
                            <span className="font-medium">{item.text}</span>
                            {item.count !== undefined && <Badge variant="secondary">{item.count}</Badge>}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="mt-3"
                        variant="primary"
                        onClick={() => {
                          setAssignAllSummaryData(selectedAllSummaryPoints.map(idx => allSummary[idx]?.text).filter(Boolean));
                          setAssignAllSummaryModal(true);
                        }}
                        disabled={!selectedAllSummaryPoints.length}
                      >
                        Assign Selected as Action Plan
                      </Button>
                    </div>
                  )}
                  {/* AI Summary */}
                  {allAiSummary.length > 0 && (
                    <div className="w-full max-w-2xl mb-6">
                      <h3 className="text-lg font-semibold text-[goldenrod] mb-2">AI-Powered Summary</h3>
                      <ul className="list-disc ml-6 mt-2">
                        {allAiSummary.map((item, idx) => (
                          <li key={idx} className="mb-1 text-gray-300 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedAllAiPoints.includes(idx)}
                              onChange={() => setSelectedAllAiPoints(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
                              className="accent-[goldenrod] w-4 h-4"
                            />
                            <span className="font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="mt-3"
                        variant="primary"
                        onClick={() => {
                          setAssignAllSummaryData(selectedAllAiPoints.map(idx => allAiSummary[idx]).filter(Boolean));
                          setAssignAllSummaryModal(true);
                        }}
                        disabled={!selectedAllAiPoints.length}
                      >
                        Assign Selected as Action Plan
                      </Button>
                    </div>
                  )}
                  {/* Modal for assigning selected summary points */}
                  <Dialog open={assignAllSummaryModal} onOpenChange={setAssignAllSummaryModal}>
                    <DialogContent className="bg-[#232026]/90">
                      <DialogHeader>
                        <DialogTitle>Assign Action Plan from Summary</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateActionPlan} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Expectations</label>
                          <Input
                            value={assignAllSummaryData.join('; ')}
                            disabled
                          />
                        </div>
                        <div className="flex gap-4 items-center mb-2">
                          <span className="text-sm font-semibold text-gray-400">Department:</span>
                          <span className="text-base font-bold text-[#FFF8E7]">{getCurrentDepartment()?.name || ""}</span>
                          <span className="text-sm font-semibold text-gray-400 ml-6">Category:</span>
                          <span className="text-base font-bold text-[#FFF8E7]">{selectedCategory}</span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Instructions (optional)</label>
                          <Input
                            value={createForm.instructions}
                            onChange={e => handleCreateFormChange('instructions', e.target.value)}
                            placeholder="Any extra instructions from HOD"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Assign To</label>
                          <Select
                            value={createForm.assignedTo}
                            onValueChange={(val) => handleCreateFormChange("assignedTo", val)}
                            options={departmentUsers.map((u) => ({ value: u._id, label: u.name, className: "text-[#FFF8E7]" }))}
                            placeholder={usersLoading ? "Loading users..." : "Select user"}
                            required
                            disabled={usersLoading || departmentUsers.length === 0}
                          />
                          {!usersLoading && departmentUsers.length === 0 && (
                            <div className="text-xs text-red-400 mt-1">No users available to assign in this department.</div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Target Date</label>
                          <Input
                            type="date"
                            value={createForm.targetDate}
                            onChange={(e) => handleCreateFormChange("targetDate", e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            required
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Action Plan"}
                          </Button>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">
                              Cancel
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}
            {/* Expectations Table */}
            {selectedCategory && (
              <Card className="bg-[#232026]/90">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Expectations for {capitalizeFirstLetter(selectedCategory)}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCategory("")}
                      >
                        Deselect
                      </Button>
                      <Button
                        size="sm"
                        variant={ratingFilter === "" ? "primary" : "outline"}
                        onClick={() => setRatingFilter("")}
                      >
                        All
                      </Button>
                      <Button
                        size="sm"
                        variant={ratingFilter === "detractor" ? "primary" : "outline"}
                        onClick={() => setRatingFilter("detractor")}
                      >
                        Detractor
                      </Button>
                      <Button
                        size="sm"
                        variant={ratingFilter === "passive" ? "primary" : "outline"}
                        onClick={() => setRatingFilter("passive")}
                      >
                        Passive
                      </Button>
                      <Button
                        size="sm"
                        variant={ratingFilter === "promoter" ? "primary" : "outline"}
                        onClick={() => setRatingFilter("promoter")}
                      >
                        Promoter
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <HODExpectationsTable
                    data={expectationData}
                    categoryName={selectedCategory}
                    ratingFilter={ratingFilter}
                    onAssign={(expObj) => {
                      setCreateModalOpen(true);
                      setCreateForm(f => ({
                        ...f,
                        expectations: expObj.expectation,
                        actions: '',
                        instructions: '',
                        assignedTo: expObj.userId || '',
                      }));
                    }}
                  />
                </CardContent>
              </Card>
            )}
            {/* Create Action Plan Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
              <DialogContent className="bg-[#232026]/90">
                <DialogHeader>
                  <DialogTitle>Create Action Plan</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateActionPlan} className="space-y-4">
                  <div className="flex gap-4 items-center mb-2">
                    <span className="text-sm font-semibold text-gray-400">Department:</span>
                    <span className="text-base font-bold text-[#FFF8E7]">{getCurrentDepartment()?.name || ""}</span>
                    <span className="text-sm font-semibold text-gray-400 ml-6">Category:</span>
                    <span className="text-base font-bold text-[#FFF8E7]">{selectedCategory}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Expectations</label>
                    <Input
                      value={createForm.expectations}
                      onChange={e => handleCreateFormChange('expectations', e.target.value)}
                      placeholder="Expectations for this action plan"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Instructions (optional)</label>
                    <Input
                      value={createForm.instructions}
                      onChange={e => handleCreateFormChange('instructions', e.target.value)}
                      placeholder="Any extra instructions from HOD"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Assign To</label>
                    <Select
                      value={createForm.assignedTo}
                      onValueChange={(val) => handleCreateFormChange("assignedTo", val)}
                      options={departmentUsers.map((u) => ({ value: u._id, label: u.name, className: "text-[#FFF8E7]" }))}
                      placeholder={usersLoading ? "Loading users..." : "Select user"}
                      required
                      disabled={usersLoading || departmentUsers.length === 0}
                    />
                    {!usersLoading && departmentUsers.length === 0 && (
                      <div className="text-xs text-red-400 mt-1">No users available to assign in this department.</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Date</label>
                    <Input
                      type="date"
                      value={createForm.targetDate}
                      onChange={(e) => handleCreateFormChange("targetDate", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Action Plan"}
                    </Button>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Action Plan Modal (Admin) */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
              <DialogContent className="bg-[#232026]/90">
                <DialogHeader>
                  <DialogTitle>Edit Action Plan</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditActionPlan} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Expectations</label>
                    <Input
                      value={editForm.expectations}
                      onChange={e => handleEditFormChange('expectations', e.target.value)}
                      placeholder="Expectations for this action plan"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Actions</label>
                    <Input
                      value={editForm.actions}
                      onChange={e => handleEditFormChange('actions', e.target.value)}
                      placeholder="Actions to be taken"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Instructions (optional)</label>
                    <Input
                      value={editForm.instructions}
                      onChange={e => handleEditFormChange('instructions', e.target.value)}
                      placeholder="Any extra instructions from HOD"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Assign To</label>
                    <Select
                      value={editForm.assignedTo}
                      onValueChange={(val) => handleEditFormChange('assignedTo', val)}
                      options={departmentUsers.map((u) => ({ value: u._id, label: u.name, className: 'text-[#FFF8E7]' }))}
                      placeholder={usersLoading ? "Loading users..." : "Select user"}
                      required
                      disabled={usersLoading || departmentUsers.length === 0}
                    />
                    {!usersLoading && departmentUsers.length === 0 && (
                      <div className="text-xs text-red-400 mt-1">No users available to assign in this department.</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Date</label>
                    <Input
                      type="date"
                      value={editForm.targetDate}
                      onChange={(e) => handleEditFormChange('targetDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <Select
                      value={editForm.status}
                      onValueChange={(val) => handleEditFormChange('status', val)}
                      options={statusOptions.filter(opt => opt.value !== 'all')}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Updating...' : 'Update Action Plan'}
                    </Button>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Summaries */}
            {selectedCategory && (
              <div className="flex flex-col md:flex-row gap-6 max-h-[600px] overflow-y-auto">
                {/* Rule-Based Summary */}
                <Card className="flex-1 bg-[#232026]/90">
                  <CardHeader>
                    <CardTitle>Rule-Based Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => fetchRuleSummary(selectedCategory)}
                      variant="primary"
                      className="mb-2"
                    >
                      Generate Rule-Based Summary
                    </Button>
                    <ul className="list-disc ml-6 mt-2">
                      {ruleSummary.map((item, idx) => (
                        <li key={idx} className="mb-1 text-gray-300 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRulePoints.includes(idx)}
                            onChange={() => toggleRulePoint(idx)}
                            className="accent-[goldenrod] w-4 h-4"
                          />
                          <span className="font-medium">{item.text}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-3"
                      variant="primary"
                      onClick={() => assignSummaryPoints(selectedRulePoints, 'rule')}
                      disabled={!selectedRulePoints.length}
                    >
                      Assign Selected as Action Plan
                    </Button>
                  </CardContent>
                </Card>
                {/* AI Summary */}
                <Card className="flex-1 bg-gradient-to-br bg-[#232026]/90 border-0 shadow-xl relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <span className="text-2xl">🤖</span>
                    <CardTitle className="flex items-center gap-2 text-[goldenrod]">
                      AI-Powered Summary
                      <span className="ml-2 px-4 py-1 text-xs rounded-full bg-[goldenrod]/20 text-[goldenrod] font-semibold border border-[goldenrod]/40">Gemini</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => fetchAiSummary(selectedCategory)}
                      variant="outline"
                      className="mb-2"
                      disabled={isAiLoading}
                    >
                      {isAiLoading ? "Generating..." : "Generate AI Summary"}
                    </Button>
                    {aiSummary && (
                      <>
                        <ul className="list-disc ml-6 mt-2">
                          {aiSummary.split('\n').map((item, idx) => (
                            <li key={idx} className="mb-1 text-gray-300 flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedAiPoints.includes(idx)}
                                onChange={() => toggleAiPoint(idx)}
                                className="accent-[goldenrod] w-4 h-4"
                              />
                              <span className="font-medium">{item}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className="mt-3"
                          variant="primary"
                          onClick={() => assignSummaryPoints(selectedAiPoints, 'ai')}
                          disabled={!selectedAiPoints.length}
                        >
                          Assign Selected as Action Plan
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }
}

export default ActionPlansPage;