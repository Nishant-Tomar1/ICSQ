import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs";
import axios from "axios";
import { FaAngleDown, FaAngleUp, FaClipboardList, FaInfoCircle } from "react-icons/fa";
import { capitalizeFirstLetter, Server } from "../Constants";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "../components/ui/Dialog";
import Textarea from "../components/ui/Textarea";

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
    { key: 'detractor', label: 'Detractor (≤ 40)', color: 'from-red-500 to-orange-500' },
    { key: 'passive', label: 'Passive (41-79)', color: 'from-yellow-500 to-orange-500' },
    { key: 'promoter', label: 'Promoter (≥ 80)', color: 'from-green-500 to-emerald-500' },
  ];
  return (
    <div className="space-y-6">
      {groupOrder.map(group => {
        if (ratingFilter && ratingFilter !== group.key) return null;
        const items = groups[group.key];
        if (!items.length) return null;
        return (
          <div key={group.key} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"> 
            <div className={`px-4 py-3 bg-gradient-to-r ${group.color} text-white font-semibold`}>
              {group.label} ({items.length} expectations)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Department</th>
                    {/* <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">User</th> */}
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Expectation</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Rating</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((e, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-4 py-3 text-sm text-slate-200 font-medium">{capitalizeFirstLetter(e.department)}</td>
                      {/* <td className="px-4 py-3 text-sm text-slate-200">{e.user}</td> */}
                      <td className="px-4 py-3 text-sm text-slate-300 max-w-md truncate" title={e.expectation}>{e.expectation?.length > 20 ? (e.expectation.substring(0, 20) + "...") : e.expectation}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge 
                          variant="secondary" 
                          className={`${
                            e.rating <= 40 ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                            e.rating < 80 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
                            'bg-green-500/20 text-green-300 border-green-400/30'
                          }`}
                        >
                          {e.rating}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Button 
                          size="sm" 
                          variant="primary" 
                          onClick={() => onAssign(e)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white shadow-lg"
                        >
                          <span className="mr-1">📋</span>
                          Assign
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {(!groups.detractor.length && !groups.passive.length && !groups.promoter.length) && (
        <div className="p-6 text-slate-400 text-center bg-white/5 rounded-lg border border-white/10">
          No expectations found for this category.
        </div>
      )}
    </div>
  );
}

         // Department Expectations Table Component
         function DepartmentExpectationsTable({ data, departmentId, allDepartments, onAssign, ratingFilter }) {
  if (!data || !Array.isArray(data)) {
    console.log("DepartmentExpectationsTable - No data or not an array:", data);
    return <div className="p-6 text-slate-400 text-center bg-white/5 rounded-lg border border-white/10">No data available.</div>;
  }
  
             console.log("DepartmentExpectationsTable - Raw data:", data);
           console.log("DepartmentExpectationsTable - departmentId:", departmentId);
           console.log("DepartmentExpectationsTable - allDepartments:", allDepartments);
           console.log("DepartmentExpectationsTable - Data length:", data.length);
  
  // Flatten all expectations from the selected department across all categories
  let allExpectations = [];
  
  // data is now an array of arrays (one array per department)
  data.forEach((departmentData, deptIndex) => {
    console.log(`Processing department data ${deptIndex}:`, departmentData);
    if (!Array.isArray(departmentData)) {
      console.log(`Department data ${deptIndex} is not an array:`, departmentData);
      return;
    }
    
    departmentData.forEach((category, catIndex) => {
      console.log(`Processing category ${catIndex}:`, category);
      if (!category.departments || !Array.isArray(category.departments)) {
        console.log("No departments array found in category:", category);
        return;
      }
      
      category.departments.forEach((dept, deptIdx) => {
        console.log(`Processing department ${deptIdx}:`, dept);
        console.log("Department object keys:", Object.keys(dept));
        console.log("Department _id:", dept._id, "Department id:", dept.id);
        
                         // Since departments don't have IDs, match by name
                 // We need to find the department name from the selectedDepartment ID
                 const selectedDept = allDepartments.find(d => d._id === departmentId);
                 const selectedDeptName = selectedDept ? selectedDept.name.toLowerCase() : '';
                 const currentDeptName = dept.name.toLowerCase();
                 
                 console.log("Selected department name:", selectedDeptName);
                 console.log("Current department name:", currentDeptName);
                 
                 if (selectedDeptName && currentDeptName === selectedDeptName) {
          console.log("Match found! Processing users for department:", dept.name);
          if (!dept.users || !Array.isArray(dept.users)) {
            console.log("No users array found in department:", dept);
            return;
          }
          
          dept.users.forEach((user, userIdx) => {
            console.log(`Processing user ${userIdx}:`, user);
            if (!user.expectations || !Array.isArray(user.expectations)) {
              console.log("No expectations array found in user:", user);
              return;
            }
            
            user.expectations.forEach((exp, expIdx) => {
              if (exp) {
                console.log(`Processing expectation ${expIdx}:`, exp);
                console.log(`Expectation type:`, typeof exp);
                console.log(`Expectation keys:`, exp && typeof exp === 'object' ? Object.keys(exp) : 'N/A');
                
                // Handle different expectation data structures
                let expectationText = '';
                let expectationRating = 0;
                
                if (typeof exp === 'string') {
                  expectationText = exp;
                  expectationRating = user.ratings?.[expIdx] || 0;
                } else if (exp && typeof exp === 'object') {
                  expectationText = exp.text || exp.expectation || exp.message || JSON.stringify(exp);
                  expectationRating = exp.rating !== undefined ? exp.rating : user.ratings?.[expIdx] || 0;
                } else {
                  expectationText = String(exp);
                  expectationRating = user.ratings?.[expIdx] || 0;
                }
                
                console.log(`Final expectation text:`, expectationText);
                console.log(`Final expectation rating:`, expectationRating);
                
                allExpectations.push({
                  department: dept.name,
                  user: user.name,
                  expectation: expectationText,
                  rating: expectationRating,
                  userId: user._id || user.id,
                  category: category.category,
                });
              }
            });
          });
        }
      });
    });
  });

  console.log("All expectations found:", allExpectations);

  // Group by rating
  const groups = {
    detractor: allExpectations.filter(e => e.rating <= 40),
    passive: allExpectations.filter(e => e.rating > 40 && e.rating < 80),
    promoter: allExpectations.filter(e => e.rating >= 80),
  };

  const groupOrder = [
    { key: 'detractor', label: 'Detractor (≤ 40)', color: 'from-red-500 to-orange-500' },
    { key: 'passive', label: 'Passive (41-79)', color: 'from-yellow-500 to-orange-500' },
    { key: 'promoter', label: 'Promoter (≥ 80)', color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {groupOrder.map(group => {
        if (ratingFilter && ratingFilter !== group.key) return null;
        const items = groups[group.key];
        if (!items.length) return null;
        return (
          <div key={group.key} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"> 
            <div className={`px-4 py-3 bg-gradient-to-r ${group.color} text-white font-semibold`}>
              {group.label} ({items.length} expectations)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Expectation</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Rating</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((e, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-4 py-3 text-sm text-slate-200 font-medium">{capitalizeFirstLetter(e.category)}</td>
                      <td className="px-4 py-3 text-sm text-slate-200">{e.user}</td>
                      <td className="px-4 py-3 text-sm text-slate-300 max-w-md truncate" title={String(e.expectation || '')}>
                        {String(e.expectation || '').length > 20 ? (String(e.expectation || '').substring(0, 20) + "...") : String(e.expectation || '')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge 
                          variant="secondary" 
                          className={`${
                            e.rating <= 40 ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                            e.rating < 80 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
                            'bg-green-500/20 text-green-300 border-green-400/30'
                          }`}
                        >
                          {e.rating}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Button 
                          size="sm" 
                          variant="primary" 
                          onClick={() => onAssign(e)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white shadow-lg"
                        >
                          <span className="mr-1">📋</span>
                          Assign
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {(!groups.detractor.length && !groups.passive.length && !groups.promoter.length) && (
        <div className="p-6 text-slate-400 text-center bg-white/5 rounded-lg border border-white/10">
          No expectations found for this department.
        </div>
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
  const [allCategories, setAllCategories] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [expectationData, setExpectationData] = useState([]);
  const [allDepartmentsExpectationData, setAllDepartmentsExpectationData] = useState([]);
  const [isLoadingExpectationData, setIsLoadingExpectationData] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState("");
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
  const [isTyping, setIsTyping] = useState(false);
  const [typedSummary, setTypedSummary] = useState("");
  const [selected, setSelected] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCategoryForForm, setSelectedCategoryForForm] = useState(""); // For category selection in modal when no category is selected
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
  const [allAiSummary, setAllAiSummary] = useState('');
  const [isAllSummaryLoading, setIsAllSummaryLoading] = useState(false);
  const [isAllAiSummaryLoading, setIsAllAiSummaryLoading] = useState(false);
  const [selectedAllSummaryPoints, setSelectedAllSummaryPoints] = useState([]);
  const [selectedAllAiPoints, setSelectedAllAiPoints] = useState([]);
  // State for assignAllSummaryModal form
  const [assignAllSummaryForm, setAssignAllSummaryForm] = useState({
    expectations: '',
    instructions: '',
    assignedTo: '',
    targetDate: '',
    categoryId: '',
    status: 'pending'
  });
  // Add these hooks at the top level
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionModalPlan, setActionModalPlan] = useState(null);
  const [actionInput, setActionInput] = useState("");
  // AI Suggestion Animation States
  const [showAiSuggestion, setShowAiSuggestion] = useState(true);
  const [aiSuggestionDismissed, setAiSuggestionDismissed] = useState(false);
  const [aiTooltipVisible, setAiTooltipVisible] = useState(false);
  const [aiTooltipPosition, setAiTooltipPosition] = useState({ x: 0, y: 0 });
  // Enhanced AI features state
  const [trendAnalysis, setTrendAnalysis] = useState("");
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [detailedActionPlans, setDetailedActionPlans] = useState("");
  const [isGeneratingPlans, setIsGeneratingPlans] = useState(false);
  const [showTrendAnalysis, setShowTrendAnalysis] = useState(false);
  const [showDetailedPlans, setShowDetailedPlans] = useState(false);
  // Detailed Action Plans Management States
  const [detailedPlansData, setDetailedPlansData] = useState([]);
  const [selectedDetailedPlan, setSelectedDetailedPlan] = useState(null);
  const [detailedPlanEditModal, setDetailedPlanEditModal] = useState(false);
  const [detailedPlanPreviewModal, setDetailedPlanPreviewModal] = useState(false);
  const [detailedPlanAssignModal, setDetailedPlanAssignModal] = useState(false);
  
  // New state variables for view mode and department selection
  const [viewMode, setViewMode] = useState("categories"); // "categories" or "departments"
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [detailedPlanEditForm, setDetailedPlanEditForm] = useState({
    title: '',
    description: '',
    steps: '',
    timeline: '',
    resources: '',
    successMetrics: '',
    priority: 'medium'
  });
  const [detailedPlanAssignForm, setDetailedPlanAssignForm] = useState({
    assignedTo: '',
    categoryId: '',
    targetDate: '',
    status: 'pending',
    instructions: ''
  });
  // State for expanded view modal
  const [expandedViewModal, setExpandedViewModal] = useState(false);
  const [selectedPlanForExpandedView, setSelectedPlanForExpandedView] = useState(null);

  // NEW: Add UX improvement states
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "categories", "ai-action-plans"
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Check localStorage to see if user has seen the tutorial
    return localStorage.getItem('actionPlansTutorialSeen') !== 'true';
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [showHelpGuide, setShowHelpGuide] = useState(false);

  // AI Action Plans state variables
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiGeneratedPlans, setAiGeneratedPlans] = useState([]);
  const [aiAnalysisScope, setAiAnalysisScope] = useState("all");
  const [aiPriorityFocus, setAiPriorityFocus] = useState("all");
  
  // AI Plan Editing state variables
  const [editingPlan, setEditingPlan] = useState(null);
  const [aiPlanEditModalOpen, setAiPlanEditModalOpen] = useState(false);

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
    
    // Only fetch users if the plan's department is different from current department
    if (plan.department?._id !== getCurrentDepartment()?._id) {
      setUsersLoading(true);
      try {
        const res = await axios.get(`${Server}/users/by-department/${plan.department?._id}`, { withCredentials: true });
        setDepartmentUsers(res.data || []);
      } catch (error) {
        console.error("Error fetching users for edit modal:", error);
        setDepartmentUsers([]);
      } finally {
        setUsersLoading(false);
      }
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

  const statusOptions = useMemo(() => [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ], []);
  const categoryOptions = useMemo(() => [
    { value: "all", label: "All Categories" },
    ...allCategories.map((cat) => ({ value: cat.name, label: cat.name })),
  ], [allCategories]);

  // Fetch action plans based on role
  const fetchData = async () => {
    setIsLoading(true);
    try {
      let response;
      if (currentUser.role === "admin") {
        response = await axios.get(`${Server}/action-plans`, { withCredentials: true });
      } else {
        response = await axios.get(`${Server}/action-plans/user`, { withCredentials: true });
      }
      setActionPlans(response.data);
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

  // Fetch expectation data for all departments when needed
  const fetchAllDepartmentsExpectationData = async () => {
    if (isLoadingExpectationData) return;
    
    console.log("Fetching all departments expectation data...");
    console.log("All departments:", allDepartments);
    
    setIsLoadingExpectationData(true);
    try {
      const promises = allDepartments.map(dept => {
        console.log(`Fetching data for department: ${dept.name} (${dept._id})`);
        return axios.get(`${Server}/analytics/expectation-data/${dept._id}`, { withCredentials: true });
      });
      
      const responses = await Promise.all(promises);
      console.log("All responses received:", responses);
      
      const allData = responses.map(response => {
        console.log("Response data:", response.data);
        return response.data;
      }).filter(Boolean);
      
      console.log("Final allData:", allData);
      setAllDepartmentsExpectationData(allData);
    } catch (error) {
      console.error("Error fetching all departments expectation data:", error);
      toast({ title: "Error", description: "Failed to load department expectations", variant: "destructive" });
    } finally {
      setIsLoadingExpectationData(false);
    }
  };

  // Fetch all departments expectation data when viewMode changes to "departments"
  useEffect(() => {
    if (viewMode === "departments" && allDepartments.length > 0 && allDepartmentsExpectationData.length === 0) {
      fetchAllDepartmentsExpectationData();
    }
  }, [viewMode, allDepartments, allDepartmentsExpectationData.length]);

  // Also fetch data when a department is selected
  useEffect(() => {
    if (selectedDepartment && viewMode === "departments" && allDepartmentsExpectationData.length === 0) {
      fetchAllDepartmentsExpectationData();
    }
  }, [selectedDepartment, viewMode, allDepartmentsExpectationData.length]);

  // Memoize adminFilters to prevent unnecessary re-renders
  const memoizedAdminFilters = useMemo(() => adminFilters, [adminFilters.departmentId, adminFilters.categoryId, adminFilters.assignedTo, adminFilters.status]);

  useEffect(() => {
    fetchData();
  }, [currentUser, memoizedAdminFilters]);

  // Memoize filtered plans to prevent unnecessary re-computations
  const filteredPlans = useMemo(() => {
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
    return filtered;
  }, [statusFilter, categoryFilter, searchQuery, actionPlans]);

  // Fetch users in department for 'Assigned To' dropdown
  useEffect(() => {
    if (currentUser.role === "hod" && getCurrentDepartment()?._id) {
      setUsersLoading(true);
      axios
        .get(`${Server}/users/by-department/${getCurrentDepartment()?._id}`, {
          withCredentials: true,
        })
        .then((res) => {
          setDepartmentUsers(res.data || []);
        })
        .catch((error) => {
          console.error("Error fetching users:", error);
          setDepartmentUsers([]);
        })
        .finally(() => setUsersLoading(false));
    } else {
      // Clear users if not HOD or no department
      setDepartmentUsers([]);
      setUsersLoading(false);
    }
  }, [currentUser, getCurrentDepartment]);
  
  // AI Suggestion Animation useEffect
  useEffect(() => {
    // Show AI suggestion after 3 seconds if not dismissed
    const timer = setTimeout(() => {
      if (!aiSuggestionDismissed && showAiSuggestion) {
        setShowAiSuggestion(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [aiSuggestionDismissed, showAiSuggestion]);

  // Simplified AI tooltip handler
  const handleAiSectionMouseEnter = () => {
    setAiTooltipVisible(true);
  };

  const handleAiSectionMouseLeave = () => {
    setAiTooltipVisible(false);
  };

  const dismissAiSuggestion = () => {
    setShowAiSuggestion(false);
    setAiSuggestionDismissed(true);
  };

  // Function to open expanded view modal
  const openExpandedView = (plan) => {
    setSelectedPlanForExpandedView(plan);
    setExpandedViewModal(true);
  };
  
  // Handle create form changes
  const handleCreateFormChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle assignAllSummary form changes
  const handleAssignAllSummaryFormChange = (field, value) => {
    setAssignAllSummaryForm((prev) => ({ ...prev, [field]: value }));
  };
  // Handle create action plan submit
  const handleCreateActionPlan = async (e) => {
    e.preventDefault();
    if (!createForm.expectations.trim()) {
      toast({ title: "Error", description: "Expectations are required.", variant: "destructive" });
      return;
    }
    if (!selectedCategoryForForm.trim()) {
      toast({ title: "Error", description: "Please select or enter a category.", variant: "destructive" });
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
      // Find existing category or use the category name for new category creation
      const existingCategory = allCategories.find((c) => c.name.toLowerCase() === selectedCategoryForForm.toLowerCase());
      
      await axios.post(
        `${Server}/action-plans`,
        {
          departmentId: getCurrentDepartment()?._id,
          categoryId: existingCategory?._id,
          categoryName: selectedCategoryForForm, // Send category name for backend to handle
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
      setSelectedCategoryForForm(""); // Reset category selection
      fetchData();
      toast({ title: "Success", description: "Action plan created!" });
    } catch (err) {
      console.error("Error creating action plan:", err);
      toast({ title: "Error", description: err.response?.data?.message || "Failed to create action plan.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle assignAllSummary action plan submit
  const handleAssignAllSummaryActionPlan = async (e) => {
    e.preventDefault();
    if (!assignAllSummaryForm.expectations.trim()) {
      toast({ title: "Error", description: "Expectations are required.", variant: "destructive" });
      return;
    }
    if (!assignAllSummaryForm.categoryId) {
      toast({ title: "Error", description: "Please select a category.", variant: "destructive" });
      return;
    }
    if (!assignAllSummaryForm.assignedTo) {
      toast({ title: "Error", description: "Please select a user to assign.", variant: "destructive" });
      return;
    }
    if (!assignAllSummaryForm.targetDate) {
      toast({ title: "Error", description: "Please select a target date.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post(
        `${Server}/action-plans`,
        {
          departmentId: getCurrentDepartment()?._id,
          categoryId: assignAllSummaryForm.categoryId,
          expectations: assignAllSummaryForm.expectations,
          actions: assignAllSummaryForm.actions || '',
          instructions: assignAllSummaryForm.instructions,
          assignedTo: assignAllSummaryForm.assignedTo,
          targetDate: assignAllSummaryForm.targetDate,
          status: assignAllSummaryForm.status,
        },
        { withCredentials: true }
      );
      setAssignAllSummaryModal(false);
      setAssignAllSummaryForm({ expectations: '', instructions: '', assignedTo: '', targetDate: '', categoryId: '', status: 'pending' });
      setAssignAllSummaryData([]);
      fetchData();
      toast({ title: "Success", description: "Action plan created!" });
    } catch (err) {
      console.error("Error creating action plan:", err);
      toast({ title: "Error", description: err.response?.data?.message || "Failed to create action plan.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = useCallback((status) => {
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
  }, []);

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
    setTypedSummary("");
    setIsTyping(false);
    try {
      const res = await axios.get(`${Server}/analytics/summarize-expectations/ai`, {
        params: {
          departmentId: getCurrentDepartment()?._id,
          category: categoryId,
        },
        withCredentials: true,
      });
      setAiSummary(res.data.summary);
      
      // Start typing effect
      setIsTyping(true);
      const summaryLines = res.data.summary.split('\n');
      let currentIndex = 0;
      
      const typeNextLine = () => {
        if (currentIndex < summaryLines.length) {
          setTypedSummary(prev => prev + (prev ? '\n' : '') + summaryLines[currentIndex]);
          currentIndex++;
          setTimeout(typeNextLine, 100); // Type each line with 100ms delay
        } else {
          setIsTyping(false);
        }
      };
      
      setTimeout(typeNextLine, 500); // Start typing after 500ms delay
      
    } catch (err) {
      setAiSummary("Failed to generate AI summary.");
    } finally {
      setIsAiLoading(false);
    }
  };

  
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
    // Set the category for form - use selectedCategory if available, otherwise leave empty for user to select
    setSelectedCategoryForForm(selectedCategory || "");
    
    // Get expectations text based on type
    let expectationsText = '';
    if (type === 'rule') {
      expectationsText = points.map(idx => ruleSummary[idx]?.text).filter(Boolean).join('; ');
    } else if (type === 'ai') {
      // Handle grouped AI responses
      const groupedResponses = parseGroupedAIResponses(aiSummary);
      if (groupedResponses.length > 0) {
        // Extract text from grouped responses (only responses, no action items)
        const selectedTexts = points.map(point => {
          if (typeof point === 'string' && point.includes('-')) {
            const [groupIdx, itemIdx] = point.split('-');
            const group = groupedResponses[parseInt(groupIdx)];
            if (group) {
              // Only handle responses, skip action items
              if (!itemIdx.startsWith('action')) {
                const respIdx = parseInt(itemIdx);
                return group.responses[respIdx] || '';
              }
            }
          }
          return '';
        }).filter(Boolean);
        expectationsText = selectedTexts.join('; ');
      } else {
        // Fallback to old format
        const aiSummaryArray = aiSummary.split('\n').filter(Boolean);
        expectationsText = points.map(idx => aiSummaryArray[idx]).filter(Boolean).join('; ');
      }
    }
    
    setCreateForm(f => ({
      ...f,
      expectations: expectationsText,
      actions: '',
      instructions: '',
      assignedTo: '',
    }));
  };

  // Function to parse grouped AI responses
  const parseGroupedAIResponses = (aiSummaryText) => {
    if (!aiSummaryText) return [];
    
    const lines = aiSummaryText.split('\n');
    const groups = [];
    let currentGroup = null;
    let currentSection = null;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if this is a group header (starts with ===)
      if (trimmedLine.startsWith('===') && trimmedLine.endsWith('===')) {
        // Save previous group if exists
        if (currentGroup) {
          groups.push(currentGroup);
        }
        
        // Start new group
        const groupName = trimmedLine.replace(/===/g, '').trim();
        currentGroup = {
          name: groupName,
          summary: '',
          responses: []
        };
        currentSection = null;
      } else if (trimmedLine.startsWith('Summary:')) {
        currentSection = 'summary';
        currentGroup.summary = trimmedLine.replace('Summary:', '').trim();
      } else if (trimmedLine.startsWith('Responses:')) {
        currentSection = 'responses';
      } else if (trimmedLine.startsWith('•') && currentGroup) {
        const content = trimmedLine.substring(1).trim();
        if (currentSection === 'responses') {
          currentGroup.responses.push(content);
        }
      } else if (trimmedLine && currentGroup && currentSection === 'summary' && !currentGroup.summary) {
        // Handle summary that might be on the next line
        currentGroup.summary = trimmedLine;
      }
    });
    
    // Add the last group
    if (currentGroup) {
      groups.push(currentGroup);
    }
    
    return groups;
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
    setAllAiSummary(''); // Initialize as empty string
    try {
      const res = await axios.get(`${Server}/analytics/summarize-expectations/ai`, {
        params: { departmentId: getCurrentDepartment()?._id },
        withCredentials: true,
      });
      // Store the raw text for grouping
      setAllAiSummary(res.data.summary || '');
    } catch {
      setAllAiSummary('');
    } finally {
      setIsAllAiSummaryLoading(false);
    }
  };

  // Enhanced AI features
  const fetchTrendAnalysis = async () => {
    setIsTrendLoading(true);
    setTrendAnalysis("");
    try {
      const res = await axios.get(`${Server}/analytics/analyze-trends`, {
        params: { departmentId: getCurrentDepartment()?._id },
        withCredentials: true,
      });
      setTrendAnalysis(res.data.analysis);
      setShowTrendAnalysis(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to analyze trends', variant: 'destructive' });
    } finally {
      setIsTrendLoading(false);
    }
  };

  const generateDetailedActionPlans = async (selectedInsights) => {
    if (!selectedInsights || selectedInsights.length === 0) {
      toast({ title: 'Error', description: 'Please select insights to generate action plans', variant: 'destructive' });
      return;
    }

    setIsGeneratingPlans(true);
    setDetailedActionPlans("");
    try {
      const res = await axios.post(`${Server}/analytics/generate-action-plans`, {
        departmentId: getCurrentDepartment()?._id,
        selectedInsights: selectedInsights
      }, { withCredentials: true });
      
      setDetailedActionPlans(res.data.actionPlans);
      setShowDetailedPlans(true);
      
      // Parse the detailed action plans into structured data
      const parsedPlans = parseDetailedActionPlans(res.data.actionPlans);
      setDetailedPlansData(parsedPlans);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate detailed action plans', variant: 'destructive' });
    } finally {
      setIsGeneratingPlans(false);
    }
  };
  // Helper function to parse detailed action plans from text
  const parseDetailedActionPlans = (actionPlansText) => {
    if (!actionPlansText) return [];
    
    const plans = [];
    const planBlocks = actionPlansText.split(/(?=ACTION PLAN \d+:)/);
    
    planBlocks.forEach((block, index) => {
      if (!block.trim()) return;
      
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      const plan = {
        id: index,
        expectation: ''
      };
      
      lines.forEach(line => {
        if (line.includes('[Expectation]')) {
          // Get the text after [Expectation]
          const expectationMatch = line.match(/\[Expectation\](.*)/);
          if (expectationMatch) {
            plan.expectation = expectationMatch[1].trim();
          }
          // If expectation is on next line
          else if (lines[lines.indexOf(line) + 1]) {
            plan.expectation = lines[lines.indexOf(line) + 1].trim();
          }
        }
      });
      
      if (plan.expectation) {
        plan.expectation = plan.expectation.includes(":**") ? plan.expectation.split(":**")[1].trim() : plan.expectation;
        plans.push(plan);
      }
    });
    
    return plans;
  };

  // Function to open detailed plan edit modal
  const openDetailedPlanEdit = (plan) => {
    setSelectedDetailedPlan(plan);
    setDetailedPlanEditForm({
      expectation: plan.expectation || ''
    });
    setDetailedPlanEditModal(true);
  };

  // Function to open detailed plan preview modal
  const openDetailedPlanPreview = (plan) => {
    setSelectedDetailedPlan(plan);
    setDetailedPlanPreviewModal(true);
  };

  // Function to open detailed plan assign modal
  const openDetailedPlanAssign = (plan) => {
    setSelectedDetailedPlan(plan);
    setDetailedPlanAssignForm({
      assignedTo: '',
      categoryId: '',
      targetDate: '',
      status: 'pending',
      instructions: ''
    });
    setDetailedPlanAssignModal(true);
  };

  // Function to handle detailed plan edit form changes
  const handleDetailedPlanEditChange = (field, value) => {
    setDetailedPlanEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to handle detailed plan assign form changes
  const handleDetailedPlanAssignChange = (field, value) => {
    setDetailedPlanAssignForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to save edited detailed plan
  const handleDetailedPlanEditSave = () => {
    if (!selectedDetailedPlan) return;
    
    const updatedPlans = detailedPlansData.map(plan => 
      plan.id === selectedDetailedPlan.id 
        ? { ...plan, ...detailedPlanEditForm }
        : plan
    );
    
    setDetailedPlansData(updatedPlans);
    setDetailedPlanEditModal(false);
    setSelectedDetailedPlan(null);
    toast({ title: 'Success', description: 'Action plan updated successfully!' });
  };

  // Function to assign detailed plan
  const handleDetailedPlanAssign = async () => {
    if (!selectedDetailedPlan || !detailedPlanAssignForm.assignedTo) {
      toast({ title: 'Error', description: 'Please select an assignee', variant: 'destructive' });
      return;
    }

    if (!detailedPlanAssignForm.categoryId) {
      toast({ title: 'Error', description: 'Please select a category', variant: 'destructive' });
      return;
    }

    // Use the category ID from the form
    const categoryId = detailedPlanAssignForm.categoryId;

    setIsSubmitting(true);
    try {
      const actionPlanData = {
        departmentId: getCurrentDepartment()?._id,
        categoryId: categoryId,
        expectations: selectedDetailedPlan.expectation,
        actions: selectedDetailedPlan.description,
        instructions: detailedPlanAssignForm.instructions || selectedDetailedPlan.steps,
        assignedTo: detailedPlanAssignForm.assignedTo,
        targetDate: detailedPlanAssignForm.targetDate,
        status: detailedPlanAssignForm.status || "pending",
      };

      await axios.post(`${Server}/action-plans`, actionPlanData, { withCredentials: true });
      
      setDetailedPlanAssignModal(false);
      setSelectedDetailedPlan(null);
      fetchData(); // Refresh the action plans list
      toast({ title: 'Success', description: 'Action plan assigned successfully!' });
    } catch (error) {
      console.error('Error assigning action plan:', error);
      toast({ title: 'Error', description: 'Failed to assign action plan', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
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
                options={[
                  { value: "", label: "All Assignees" }, 
                  ...actionPlans
                    .filter(p => p.assignedTo && p.assignedTo._id)
                    .map(p => ({ value: p.assignedTo._id, label: p.assignedTo.name }))
                    .filter((item, index, self) => self.findIndex(t => t.value === item.value) === index)
                ]}
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

  // AI Action Plans Functions
  const handleGenerateAIActionPlans = async () => {
    setIsGeneratingAI(true);
    setAiProgress(0);
    setAiGeneratedPlans([]);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAiProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Fetch survey data for AI analysis
      const response = await axios.get(`${Server}/analytics/summarize-expectations/ai`, {
        params: { 
          departmentId: getCurrentDepartment()?._id,
          scope: aiAnalysisScope,
          priority: aiPriorityFocus
        },
        withCredentials: true,
      });

      clearInterval(progressInterval);
      setAiProgress(100);

      // Process AI response and generate action plans
      const aiSummary = response.data.summary || '';
      const generatedPlans = await processAIResponse(aiSummary);
      setAiGeneratedPlans(generatedPlans);

      toast({ 
        title: "Success", 
        description: `Generated ${generatedPlans.length} AI action plans`, 
        variant: "success" 
      });

    } catch (error) {
      console.error('Error generating AI action plans:', error);
      toast({ 
        title: "Error", 
        description: "Failed to generate AI action plans", 
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingAI(false);
      setAiProgress(0);
    }
  };

  const processAIResponse = async (aiSummary) => {
    if (!aiSummary) return [];

    // Parse AI summary and group similar feedback
    const groupedResponses = parseGroupedAIResponses(aiSummary);
    
    if (groupedResponses.length === 0) {
      // Fallback to old format if grouping fails
      return generateFallbackPlans(aiSummary);
    }

    // Generate structured action plans based on grouped responses
    const plans = [];
    
    groupedResponses.forEach((group, index) => {
      if (group.responses.length === 0) return;
      
      // Determine priority based on group type and response count
      let priority = 'medium';
      let impactScore = 7;
      
      if (group.name.toLowerCase().includes('communication') || group.name.toLowerCase().includes('support')) {
        priority = 'high';
        impactScore = 9;
      } else if (group.name.toLowerCase().includes('quality') || group.name.toLowerCase().includes('process')) {
        priority = 'high';
        impactScore = 8;
      } else if (group.name.toLowerCase().includes('time') || group.name.toLowerCase().includes('deadline')) {
        priority = 'high';
        impactScore = 8;
      } else if (group.name.toLowerCase().includes('resource')) {
        priority = 'medium';
        impactScore = 7;
      }

      // Generate specific action items based on group type
      const recommendedActions = generateActionItems(group);
      
      const plan = {
        title: `${group.name}`,
        category: group.name,
        priority: priority,
        impactScore: impactScore,
        summary: group.summary || `Address ${group.name.toLowerCase()} to improve overall performance`,
        recommendedActions: recommendedActions,
        supportingData: `Based on ${group.responses.length} survey responses: ${group.responses.slice(0, 3).join('; ')}${group.responses.length > 3 ? '...' : ''}`,
        groupData: group
      };
      
      plans.push(plan);
    });

    return plans;
  };

  // Helper function to generate specific action items based on group type
  const generateActionItems = (group) => {
    const actions = [];
    const groupName = group.name.toLowerCase();
    
    if (groupName.includes('communication') || groupName.includes('support')) {
      actions.push(
        "Establish regular team communication channels (weekly meetings, chat groups)",
        "Implement feedback collection system for ongoing improvement",
        "Create communication guidelines and best practices document",
        "Schedule regular one-on-one meetings between team members and supervisors",
        "Develop escalation procedures for urgent communication needs"
      );
    } else if (groupName.includes('quality') || groupName.includes('standards')) {
      actions.push(
        "Review and update quality standards and procedures",
        "Implement quality control checkpoints in workflows",
        "Provide quality-focused training sessions for team members",
        "Establish quality metrics and regular monitoring",
        "Create quality improvement feedback loop"
      );
    } else if (groupName.includes('process') || groupName.includes('efficiency')) {
      actions.push(
        "Conduct process audit to identify bottlenecks and inefficiencies",
        "Streamline workflows and eliminate redundant steps",
        "Implement process automation where possible",
        "Establish clear process documentation and training",
        "Create process improvement team with regular review meetings"
      );
    } else if (groupName.includes('time') || groupName.includes('deadline')) {
      actions.push(
        "Implement project management tools for better timeline tracking",
        "Establish realistic deadline setting process with buffer time",
        "Create priority matrix for task management",
        "Implement regular progress check-ins and milestone reviews",
        "Develop contingency plans for potential delays"
      );
    } else if (groupName.includes('resource')) {
      actions.push(
        "Conduct resource needs assessment and gap analysis",
        "Optimize resource allocation and utilization",
        "Implement resource tracking and monitoring systems",
        "Develop resource planning and forecasting processes",
        "Create resource sharing and collaboration opportunities"
      );
    } else {
      // Generic actions for other categories
      actions.push(
        "Conduct detailed analysis of identified issues",
        "Develop specific improvement strategies",
        "Implement monitoring and measurement systems",
        "Create feedback mechanisms for continuous improvement",
        "Establish regular review and update processes"
      );
    }
    
    return actions;
  };

  // Fallback function for old format
  const generateFallbackPlans = (aiSummary) => {
    const summaryLines = aiSummary.split('\n').filter(line => line.trim());
    if (summaryLines.length === 0) return [];
    
    return [{
      title: "AI Generated Action Plan",
      category: "General",
      priority: 'high',
      impactScore: 8,
      summary: summaryLines.slice(0, 3).join(' '),
      recommendedActions: summaryLines.slice(3, 6).map(line => line.trim()).filter(Boolean),
      supportingData: aiSummary
    }];
  };

  const handleAssignFromAI = async (aiPlan) => {
    console.log('handleAssignFromAI called with:', aiPlan);
    try {
      // Pre-fill the create form with AI-generated content for assignment
      setCreateForm({
        expectations: aiPlan.summary,
        actions: aiPlan.recommendedActions.join('; '),
        instructions: `AI Generated Plan: ${aiPlan.title}\nPriority: ${aiPlan.priority}\nImpact Score: ${aiPlan.impactScore}/10`,
        assignedTo: '',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        status: 'pending',
      });

      // Set the category for the form
      setSelectedCategoryForForm(aiPlan.category);

      // Open the create modal for assignment
      setCreateModalOpen(true);

      toast({ 
        title: "Success", 
        description: "AI plan loaded for assignment. You can now assign it to a team member.", 
        variant: "success" 
      });

    } catch (error) {
      console.error('Error assigning from AI plan:', error);
      toast({ 
        title: "Error", 
        description: "Failed to load AI plan for assignment", 
        variant: "destructive" 
      });
    }
  };

  const handleEditAI = async (aiPlan, index) => {
    console.log('handleEditAI called with:', aiPlan, 'index:', index);
    try {
      // Open edit modal with current plan data
      setAiPlanEditModalOpen(true);
      setEditingPlan({ ...aiPlan, originalIndex: index });

      toast({ 
        title: "Edit Mode", 
        description: "You can now edit the action plan", 
        variant: "success" 
      });

    } catch (error) {
      console.error('Error editing AI plan:', error);
      toast({ 
        title: "Error", 
        description: "Failed to open edit mode", 
        variant: "destructive" 
      });
    }
  };

  // Handle saving edited AI plan
  const handleSaveEditedAI = async (editedPlan) => {
    try {
      const updatedPlans = [...aiGeneratedPlans];
      updatedPlans[editedPlan.originalIndex] = {
        ...editedPlan,
        title: editedPlan.title,
        category: editedPlan.category,
        priority: editedPlan.priority,
        impactScore: editedPlan.impactScore,
        summary: editedPlan.summary,
        recommendedActions: editedPlan.recommendedActions,
        supportingData: editedPlan.supportingData,
        groupData: editedPlan.groupData
      };
      
      setAiGeneratedPlans(updatedPlans);
      setAiPlanEditModalOpen(false);
      setEditingPlan(null);

      toast({ 
        title: "Success", 
        description: "AI action plan updated successfully", 
        variant: "success" 
      });

    } catch (error) {
      console.error('Error saving edited AI plan:', error);
      toast({ 
        title: "Error", 
        description: "Failed to save edited AI plan", 
        variant: "destructive" 
      });
    }
  };

  // Helper function to generate refined action items
  const generateRefinedActionItems = (group) => {
    const actions = [];
    const groupName = group.name.toLowerCase();
    
    if (groupName.includes('communication') || groupName.includes('support')) {
      actions.push(
        "Schedule bi-weekly team communication workshops focusing on active listening and feedback techniques",
        "Implement a digital communication platform with dedicated channels for different project types",
        "Create a communication protocol document with response time expectations and escalation procedures",
        "Establish monthly cross-department communication sessions to improve collaboration",
        "Develop a feedback collection system with anonymous and identified options for different scenarios"
      );
    } else if (groupName.includes('quality') || groupName.includes('standards')) {
      actions.push(
        "Conduct a comprehensive quality audit with external consultants to identify improvement areas",
        "Implement Six Sigma methodology with certified practitioners leading quality initiatives",
        "Establish quality circles with representatives from each team level for continuous improvement",
        "Create quality dashboards with real-time metrics and automated alerting systems",
        "Develop quality training programs with certification requirements for team members"
      );
    } else if (groupName.includes('process') || groupName.includes('efficiency')) {
      actions.push(
        "Perform value stream mapping to identify and eliminate non-value-added activities",
        "Implement Lean methodology with 5S workplace organization and visual management",
        "Establish process automation using RPA tools for repetitive tasks",
        "Create process improvement teams with dedicated time allocation for improvement projects",
        "Implement Kaizen events for rapid process improvement with measurable outcomes"
      );
    } else if (groupName.includes('time') || groupName.includes('deadline')) {
      actions.push(
        "Implement Agile project management with 2-week sprint cycles and daily stand-ups",
        "Establish critical path analysis for all major projects with buffer time calculations",
        "Create a project portfolio management system with resource allocation optimization",
        "Implement milestone tracking with automated notifications and escalation procedures",
        "Develop risk management protocols with contingency planning for potential delays"
      );
    } else if (groupName.includes('resource')) {
      actions.push(
        "Conduct comprehensive resource capacity planning with demand forecasting",
        "Implement resource optimization software for workload balancing and skill matching",
        "Establish resource sharing agreements between departments with clear ownership",
        "Create resource development programs with skill gap analysis and training plans",
        "Implement resource performance metrics with regular review and optimization cycles"
      );
    } else {
      // Generic refined actions for other categories
      actions.push(
        "Conduct root cause analysis using 5-Why methodology for identified issues",
        "Implement PDCA (Plan-Do-Check-Act) cycle for systematic improvement",
        "Establish benchmarking with industry leaders to identify best practices",
        "Create continuous improvement culture with regular innovation workshops",
        "Implement change management protocols with stakeholder engagement strategies"
      );
    }
    
    return actions;
  };

  // --- HOD View ---
  if (currentUser.role === "hod") {
    return (
      <div className="min-h-screen bg-[#29252c]">
        <DashboardHeader user={currentUser} />
        
        {/* Onboarding Guide */}
        {showOnboarding && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-300 rounded-lg max-w-2xl w-full p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Action Plans!</h2>
                <p className="text-gray-600">Let's get you started with managing action plans effectively.</p>
              </div>
              
              <div className="space-y-4 mb-6">
                {currentStep === 1 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">📋 Step 1: Overview</h3>
                    <p className="text-blue-800 text-sm">Start here to see all your action plans and their current status. You can filter, search, and manage existing plans.</p>
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">📊 Step 2: Expectations</h3>
                    <p className="text-green-800 text-sm">Select a category to view expectations and create action plans based on survey responses.</p>
                  </div>
                )}
                {currentStep === 3 && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">🤖 Step 3: AI Action Plans</h3>
                    <p className="text-purple-800 text-sm">Use AI to automatically analyze survey responses, group similar feedback, and generate actionable plans.</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {[1, 2, 3].map(step => (
                    <div
                      key={step}
                      className={`w-3 h-3 rounded-full ${
                        step === currentStep ? 'bg-blue-600' : 'bg-gray-100'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                    >
                      Previous
                    </Button>
                  )}
                  {currentStep < 3 ? (
                    <Button
                      onClick={() => setCurrentStep(prev => prev + 1)}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowOnboarding(false);
                        localStorage.setItem('actionPlansTutorialSeen', 'true');
                      }}
                    >
                      Get Started
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Simplified AI Suggestion */}
        {/* {showAiSuggestion && !aiSuggestionDismissed && (
          <div className="fixed top-20 right-6 z-50">
            <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg max-w-xs">
              <div className="flex items-start gap-2">
                <span className="text-lg">🤖</span>
                <div className="flex-1">
                  <h3 className="text-white font-medium text-sm mb-1">AI Assistant</h3>
                  <p className="text-slate-300 text-xs">
                    Use AI to analyze and group action plans
                  </p>
                </div>
                <button
                  onClick={dismissAiSuggestion}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )} */}

        {/* Simplified AI Tooltip */}
        {aiTooltipVisible && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-lg max-w-sm">
              <div className="flex items-start gap-2">
                <span className="text-lg">💡</span>
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm mb-2">AI Summary</h4>
                  <p className="text-slate-300 text-xs">
                    AI analyzes expectations and groups similar responses together to help organize your data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced Header Section */}
        <div className="px-6 py-8 bg-gradient-to-r from-[#29252c]/80 to-[#29252c]/60 border-b border-gray-700/30">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Action Plans Management</h1>
            <p className="text-slate-300 text-lg">Create, manage, and track action plans for your department</p>
            
            {/* Navigation Tabs */}
            <div className="flex space-x-1 mt-6 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === "overview"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-white hover:bg-white/20"
                }`}
              >
                📋 Overview
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === "categories"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-white hover:bg-white/20"
                }`}
              >
                📊 Expectations
              </button>
              <button
                onClick={() => setActiveTab("ai-action-plans")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === "ai-action-plans"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-white hover:bg-white/20"
                }`}
              >
                🤖 AI Action Plans
              </button>
            </div>
          </div>
        </div>

        {/* Overview Section */}
        {activeTab === "overview" && (
          <div className="px-6 py-6">
            <div className="max-w-7xl mx-auto">
              {/* Welcome Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {currentUser.name}!</h2>
                    <p className="text-slate-300">Here's an overview of your action plans and quick actions you can take.</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowHelpGuide(!showHelpGuide)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    {showHelpGuide ? 'Hide Help' : 'Learn How to Use'}
                  </Button>
                </div>
                
                {/* Help Guide */}
                {showHelpGuide && (
                  <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-6">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span>💡</span>
                        Quick Guide to Action Plans
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                            <h4 className="text-blue-300 font-medium">View & Manage</h4>
                          </div>
                          <p className="text-slate-300 text-sm">Check your assigned action plans, update status, and track progress in the table below.</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                            <h4 className="text-green-300 font-medium">Create New Plans</h4>
                          </div>
                          <p className="text-slate-300 text-sm">Go to "Expectations" tab to select a category and create action plans based on survey responses.</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                            <h4 className="text-purple-300 font-medium">Use AI Action Plans</h4>
                          </div>
                          <p className="text-slate-300 text-sm">Use "AI Action Plans" tab to automatically generate action plans by analyzing survey responses and grouping similar feedback.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 text-center hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-xl">
                      📋
                    </div>
                    <div className="text-2xl font-bold text-white">{actionPlans.length}</div>
                    <div className="text-sm text-gray-400">Total Plans</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 text-center hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-xl">
                      ⏳
                    </div>
                    <div className="text-2xl font-bold text-white">{actionPlans.filter(p => p.status === "pending").length}</div>
                    <div className="text-sm text-gray-400">Pending</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 text-center hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-xl">
                      🔄
                    </div>
                    <div className="text-2xl font-bold text-white">{actionPlans.filter(p => p.status === "in-progress").length}</div>
                    <div className="text-sm text-gray-400">In Progress</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 text-center hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-xl">
                      ✅
                    </div>
                    <div className="text-2xl font-bold text-white">{actionPlans.filter(p => p.status === "completed").length}</div>
                    <div className="text-sm text-gray-400">Completed</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 text-center hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-xl">
                      ⚠️
                    </div>
                    <div className="text-2xl font-bold text-white">{actionPlans.filter(p => new Date(p.targetDate) < new Date() && p.status !== "completed").length}</div>
                    <div className="text-sm text-gray-400">Overdue</div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-200 cursor-pointer" onClick={() => setActiveTab("categories")}>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl">
                      📊
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Manage Categories</h3>
                    <p className="text-slate-300 text-sm">View expectations by category and create new action plans</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-200 cursor-pointer" onClick={() => setActiveTab("ai-tools")}>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl">
                      🤖
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">AI Analysis</h3>
                    <p className="text-slate-300 text-sm">Use AI to analyze data and generate action plans automatically</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 hover:border-green-400/40 transition-all duration-200 cursor-pointer" onClick={() => setCreateModalOpen(true)}>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl">
                      ➕
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Create Plan</h3>
                    <p className="text-slate-300 text-sm">Quickly create a new action plan from scratch</p>
                  </CardContent>
                </Card>
              </div> */}
            </div>
          </div>
        )}

        {/* HOD's Assigned Action Plans Table (Enhanced) */}
        {activeTab === "overview" && (
          <div className="px-6 py-6">
            <div className="max-w-7xl mx-auto">
              <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 shadow-2xl">
                <CardHeader className="border-b border-gray-700">
                  <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-[goldenrod] to-amber-500 rounded-full"></div>
                    Action Plans Assigned by You
                    <Badge variant="secondary" className="ml-auto bg-[goldenrod]/20 text-gray-600 border-[goldenrod]/30">
                      {actionPlans.filter(plan => plan.assignedBy?._id === currentUser._id).length} Plans
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {actionPlans.filter(plan => plan.assignedBy?._id === currentUser._id).length > 0 ? (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-800 to-gray-700 sticky top-0 z-10">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">Department</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">Category</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">Expectations</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">Instructions</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">Assigned To</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">Target Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">Update Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">View</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {actionPlans.filter(plan => plan.assignedBy?._id === currentUser._id).map((plan, idx) => (
                            <tr key={plan._id} className="hover:bg-gray-800/50 transition-colors duration-200">
                              <td className="px-6 py-4 text-sm text-slate-200 font-medium">{capitalizeFirstLetter(plan.department?.name)}</td>
                              <td className="px-6 py-4 text-sm text-slate-200">{capitalizeFirstLetter(plan.category?.name)}</td>
                              <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate" title={plan.expectations}>{plan.expectations}</td>
                              <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate" title={plan.actions}>
                                <span>{plan.actions || "No actions yet"}</span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate" title={plan.instructions}>{plan.instructions || "No instructions"}</td>
                              <td className="px-6 py-4 text-sm text-slate-200 font-medium">{plan.assignedTo?.name}</td>
                              <td className="px-6 py-4 text-sm text-slate-200">{new Date(plan.targetDate).toLocaleDateString()}</td>
                              <td className="px-6 py-4">{getStatusBadge(plan.status)}</td>
                              <td className="px-6 py-4">
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
                                  className="h-9 bg-gray-700 border-gray-600 text-white"
                                  disabled={isSubmitting}
                                />
                              </td>
                              <td className="px-6 py-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openExpandedView(plan)}
                                  className="bg-[goldenrod] hover:bg-gray-600 border-[goldenrod] text-teal-500 font-medium"
                                >
                                  👁️ View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-300">
                      Action plans assigned by you will appear here
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {activeTab !== "overview" && activeTab !== "ai-action-plans" && <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Sidebar */}
              <aside className="w-full lg:w-1/4">
                {/* View Mode Selection */}
                <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 shadow-xl mb-4">
                  <CardHeader className="border-b border-gray-700">
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-gradient-to-b from-[goldenrod] to-amber-500 rounded-full"></div>
                      View Mode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Button
                        variant={viewMode === "categories" ? "primary" : "outline"}
                        className={`w-full justify-start transition-all duration-200 ${
                          viewMode === "categories" 
                            ? 'bg-gradient-to-r from-[goldenrod] to-amber-500 border-0 text-black font-medium shadow-lg' 
                            : 'bg-gray-800/50 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-[goldenrod]/30'
                        }`}
                        onClick={() => {
                          setViewMode("categories");
                          setSelectedCategory("");
                          setSelectedDepartment("");
                          setRuleSummary([]);
                          setAiSummary("");
                        }}
                      >
                        📊 By Categories
                      </Button>
                      <Button
                        variant={viewMode === "departments" ? "primary" : "outline"}
                        className={`w-full justify-start transition-all duration-200 ${
                          viewMode === "departments" 
                            ? 'bg-gradient-to-r from-[goldenrod] to-amber-500 border-0 text-black font-medium shadow-lg' 
                            : 'bg-gray-800/50 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-[goldenrod]/30'
                        }`}
                        onClick={() => {
                          setViewMode("departments");
                          setSelectedCategory("");
                          setSelectedDepartment("");
                          setDepartmentSearch("");
                          setRuleSummary([]);
                          setAiSummary("");
                        }}
                      >
                        🏢 By Department
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Categories Section */}
                {viewMode === "categories" && (
                  <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 shadow-xl">
                    <CardHeader className="border-b border-gray-700">
                      <CardTitle className="text-lg font-semibold text-white flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-[goldenrod] to-amber-500 rounded-full"></div>
                        Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <ul className="space-y-3">
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
                                className={`w-full justify-start transition-all duration-200 ${
                                  selectedCategory === category.name 
                                    ? 'bg-gradient-to-r from-[goldenrod] to-amber-500 border-0 text-black font-medium shadow-lg' 
                                    : 'bg-gray-800/50 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-[goldenrod]/30'
                                }`}
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
                )}

                {/* Departments Section */}
                {viewMode === "departments" && (
                  <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 shadow-xl">
                    <CardHeader className="border-b border-gray-700">
                      <CardTitle className="text-lg font-semibold text-white flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-[goldenrod] to-amber-500 rounded-full"></div>
                        Departments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {/* Search Input */}
                      <div className="relative mb-4">
                        <input
                          type="text"
                          placeholder="Search departments..."
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[goldenrod] transition-colors"
                          value={departmentSearch}
                          onChange={(e) => setDepartmentSearch(e.target.value)}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                      
                      {isLoadingExpectationData ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-[goldenrod] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-slate-300 text-sm">Loading departments...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                          {/* Results count */}
                          {departmentSearch && (
                            <div className="text-xs text-slate-400 mb-3 px-1">
                              {allDepartments.filter(dept => 
                                dept.name.toLowerCase().includes(departmentSearch.toLowerCase())
                              ).length} department{allDepartments.filter(dept => 
                                dept.name.toLowerCase().includes(departmentSearch.toLowerCase())
                              ).length !== 1 ? 's' : ''} found
                            </div>
                          )}
                          <ul className="space-y-3">
                            {allDepartments
                              .filter(dept => 
                                dept.name.toLowerCase().includes(departmentSearch.toLowerCase())
                              )
                              .map((department) => (
                                <li key={department._id}>
                                  <Button
                                    variant={selectedDepartment === department._id ? "primary" : "outline"}
                                    className={`w-full justify-start transition-all duration-200 ${
                                      selectedDepartment === department._id 
                                        ? 'bg-gradient-to-r from-[goldenrod] to-amber-500 border-0 text-black font-medium shadow-lg' 
                                        : 'bg-gray-800/50 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-[goldenrod]/30'
                                    }`}
                                    onClick={() => {
                                      setSelectedDepartment(department._id);
                                      setSelectedCategory("");
                                      setRuleSummary([]);
                                      setAiSummary("");
                                    }}
                                  >
                                    {capitalizeFirstLetter(department.name)}
                                  </Button>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </aside>

                      {/* Main Content */}
            <section className="flex-1 flex flex-col gap-6">
               
            {/* Enhanced Detailed Action Plans Section */}
            {showDetailedPlans && !selectedCategory && (detailedPlansData.length  > 0) && (
              <div className="w-full max-w-6xl mb-8">
                <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl">
                  <CardHeader className="border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                        AI-Generated Action Plans
                        <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-300 border-green-400/30">
                          {detailedPlansData.length} Plans
                        </Badge>
                      </CardTitle>
                    </div>
                    <p className="text-slate-300 text-sm mt-2">
                      Review, edit, and assign these AI-generated action plans.
                    </p>
                  </CardHeader>
                  <CardContent className="p-6 max-h-[600px] overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {detailedPlansData.map((plan, index) => (
                        <Card 
                          key={plan.id} 
                          className="group bg-white/5 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 relative overflow-hidden"
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-white group-hover:text-green-300 transition-colors">
                              Action Plan {index + 1}
                            </CardTitle>
                          </CardHeader>
                          
                          <CardContent className="pt-0">
                            <p className="text-sm text-slate-300 mb-4">
                              {plan.expectation}
                            </p>

                            <div className="flex gap-2 pt-3 border-t border-white/10">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDetailedPlanPreview(plan)}
                                className="flex-1 bg-white/5 border-white/20 text-slate-200 hover:bg-blue-500/20 hover:border-blue-400/50 hover:text-blue-200 text-xs"
                              >
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDetailedPlanEdit(plan)}
                                className="flex-1 bg-white/5 border-white/20 text-slate-200 hover:bg-yellow-500/20 hover:border-yellow-400/50 hover:text-yellow-200 text-xs"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => openDetailedPlanAssign(plan)}
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0 text-white text-xs"
                              >
                                Assign
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
              {/* Placeholder when no category/department is selected - Shows for both view modes when nothing is selected */}
              {!selectedCategory && !selectedDepartment && (
                <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 shadow-xl flex flex-col items-center justify-center min-h-[400px]">
                  <CardContent className="flex flex-col items-center justify-center w-full p-8">
                    <div className="absolute top-4 right-4 group">
                      <div className="w-8 h-8 rounded-full bg-gray-800/50 border border-gray-600 flex items-center justify-center cursor-help">
                        <FaInfoCircle className="text-gray-400 group-hover:text-[goldenrod] transition-colors duration-200" />
                      </div>
                      <div className="absolute right-0 w-96 p-4 bg-[#29252c]/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <span className="text-lg">📋</span>
                          How to Use AI Features - Step by Step
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                            <div className="flex-1">
                              <h5 className="text-cyan-300 font-medium mb-1">Start with AI Summary</h5>
                              <p className="text-slate-300 text-sm">Click "Summarize All (AI)" to analyze all expectations across categories using advanced AI.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                            <div className="flex-1">
                              <h5 className="text-purple-300 font-medium mb-1">Generate AI-Driven Action Plans</h5>
                              <p className="text-slate-300 text-sm">Click "Click here to generate AI driven 'Action Plan'" to create comprehensive action plans from selected insights.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                            <div className="flex-1">
                              <h5 className="text-green-300 font-medium mb-1">Generate Plans (Alternative)</h5>
                              <p className="text-slate-300 text-sm">Select insights and click "Click here to generate AI driven 'Action Plan'" to create comprehensive action plans.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-[goldenrod]/20 to-amber-500/20 rounded-full flex items-center justify-center mb-6">
                      <FaClipboardList className="text-2xl text-[goldenrod]" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-white">Summarize All Categories</h2>
                    <p className="text-center max-w-lg text-slate-300 mb-8 leading-relaxed">
                     Try out this AI feature to help group and merge Action Plans.It will also help you to create Action Plans for all categories.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <Button 
                        variant="outline" 
                        onClick={fetchAllAiSummary} 
                        disabled={isAllAiSummaryLoading}
                        className={`bg-gray-800/50 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-[goldenrod]/50 hover:text-[goldenrod] hover:shadow-lg hover:shadow-[goldenrod]/25 px-6 py-3 transition-all duration-300 ${!isAllAiSummaryLoading && !allAiSummary.trim() ? 'animate-pulse' : ''}`}
                      >
                        {isAllAiSummaryLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>AI Analyzing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="animate-pulse">🤖</span>
                            <span>Summarize All (AI)</span>
                            <span className="text-xs text-cyan-300 ml-1">(Try AI!)</span>
                          </div>
                        )}
                      </Button>
                    </div>
                    
                    {/* Enhanced AI Features with Step-by-Step Guide */}
                    <div className="w-full max-w-4xl ">
                      <Card className="bg-gradient-to-br from-[#29252c]/80 to-[#29252c]/60 backdrop-blur-sm border border-gray-700 shadow-xl">
                        <CardHeader className="border-b border-gray-700">
                          <CardTitle className="text-lg font-semibold text-white flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-gradient-to-b from-[goldenrod] to-amber-500 rounded-full"></div>
                            🤖 AI-Powered Features Guide
                            <Badge variant="secondary" className="ml-auto bg-[goldenrod]/20 text-[goldenrod] border-[goldenrod]/30">
                              <span className="animate-pulse">●</span> Step-by-Step
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          {/* AI Feature Buttons */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button 
                              variant="outline" 
                              onClick={fetchAllAiSummary} 
                              disabled={isAllAiSummaryLoading}
                              className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400/50 text-cyan-200 hover:bg-gradient-to-r hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-300 hover:text-cyan-100 hover:shadow-lg hover:shadow-cyan-500/25 px-4 py-3 transition-all duration-300 group"
                            >
                              {isAllAiSummaryLoading ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                                  <span>AI Analyzing...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <span className="text-xl group-hover:scale-110 transition-transform duration-200">🤖</span>
                                  <div className="text-center">
                                    <div className="font-medium">AI Summary</div>
                                    <div className="text-xs text-cyan-300">Step 1</div>
                                  </div>
                                </div>
                              )}
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                const selectedInsights = (() => {
                                  const insights = [];
                                  
                                  // Add rule summary points
                                  selectedAllSummaryPoints.forEach(idx => {
                                    if (allSummary[idx]?.text) {
                                      insights.push(allSummary[idx].text);
                                    }
                                  });
                                  
                                  // Add AI summary points (handle grouped format - only responses)
                                  const groupedResponses = parseGroupedAIResponses(allAiSummary);
                                  if (groupedResponses.length > 0) {
                                    selectedAllAiPoints.forEach(point => {
                                      if (typeof point === 'string' && point.includes('-')) {
                                        const [groupIdx, itemIdx] = point.split('-');
                                        const group = groupedResponses[parseInt(groupIdx)];
                                        if (group) {
                                          // Only handle responses, skip action items
                                          if (!itemIdx.startsWith('action')) {
                                            const respIdx = parseInt(itemIdx);
                                            if (group.responses[respIdx]) {
                                              insights.push(group.responses[respIdx]);
                                            }
                                          }
                                        }
                                      }
                                    });
                                  } else {
                                    // Fallback to old format - split the string into lines
                                    const summaryLines = allAiSummary ? allAiSummary.split('\n').filter(Boolean) : [];
                                    selectedAllAiPoints.forEach(idx => {
                                      if (summaryLines[idx]) {
                                        insights.push(summaryLines[idx]);
                                      }
                                    });
                                  }
                                  
                                  return insights;
                                })();
                                generateDetailedActionPlans(selectedInsights);
                              }}
                              disabled={isGeneratingPlans || (selectedAllSummaryPoints.length === 0 && selectedAllAiPoints.length === 0)}
                              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50 text-purple-200 hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-purple-300 hover:text-purple-100 hover:shadow-lg hover:shadow-purple-500/25 px-4 py-3 transition-all duration-300 group"
                            >
                              {isGeneratingPlans ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                  <span>Generating...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <span className="text-xl group-hover:scale-110 transition-transform duration-200">🎯</span>
                                  <div className="text-center">
                                    <div className="font-medium">Click here to generate AI driven "Action Plan"</div>
                                    <div className="text-xs text-purple-300">Step 2</div>
                                  </div>
                                </div>
                              )}
                            </Button>
                            

                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  {/* Simplified Rule Summary */}
                  {allSummary.length > 0 && (
                    <div className="w-full max-w-4xl mb-8">
                      <Card className="bg-[#29252c]/70 border border-gray-700 shadow-lg">
                        <CardHeader className="border-b border-gray-700">
                          <CardTitle className="text-lg font-semibold text-white flex items-center gap-3">
                            <span className="text-[goldenrod]">📊</span>
                            Rule Summary
                            <Badge variant="secondary" className="ml-auto bg-[goldenrod]/20 text-[goldenrod]">
                              {allSummary.length} Points
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {allSummary.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-slate-700/50 rounded border border-slate-600">
                                <input
                                  type="checkbox"
                                  checked={selectedAllSummaryPoints.includes(idx)}
                                  onChange={() => setSelectedAllSummaryPoints(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
                                  className="w-4 h-4 mt-1"
                                />
                                <span className="text-gray-200 text-sm">{item.text}</span>
                                {item.count !== undefined && (
                                  <Badge variant="secondary" className="ml-2 bg-[goldenrod]/20 text-[goldenrod]">
                                    {item.count}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                          <Button
                            className="mt-4 w-full bg-[goldenrod] hover:bg-amber-600 text-black font-medium"
                            onClick={() => {
                              const selectedData = selectedAllSummaryPoints.map(idx => allSummary[idx]?.text).filter(Boolean);
                              setAssignAllSummaryData(selectedData);
                              setAssignAllSummaryForm(prev => ({
                                ...prev,
                                expectations: selectedData.join('; ')
                              }));
                              setAssignAllSummaryModal(true);
                            }}
                            disabled={!selectedAllSummaryPoints.length}
                          >
                            📋 Click here to generate AI driven "Action Plan"
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {/* Grouped AI Summary */}
                  {allAiSummary && (
                    <div className="w-full max-w-4xl mt-4">
                      <Card className="bg-[#29252c]/70 border border-gray-700 shadow-lg">
                        <CardHeader className="border-b border-gray-700">
                          <CardTitle className="text-lg font-semibold text-white flex items-center gap-3">
                            <span className="text-[goldenrod]">🤖</span>
                            AI Summary - Grouped by Emotions & Types
                            <Badge variant="secondary" className="ml-auto bg-[goldenrod]/20 text-[goldenrod]">
                              AI Generated
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-4 max-h-80 overflow-y-auto">
                            {(() => {
                              const groupedResponses = parseGroupedAIResponses(allAiSummary);
                              
                              if (groupedResponses.length === 0) {
                                // Fallback to old format if grouping fails - split the string into lines
                                const summaryLines = allAiSummary ? allAiSummary.split('\n').filter(Boolean) : [];
                                return summaryLines.map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-2 p-2 bg-gray-800/50 rounded border border-gray-600">
                                    <input
                                      type="checkbox"
                                      checked={selectedAllAiPoints.includes(idx)}
                                      onChange={() => setSelectedAllAiPoints(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
                                      className="w-4 h-4 mt-1"
                                    />
                                    <span className="text-gray-200 text-sm">{item}</span>
                                  </div>
                                ));
                              }
                              
                              return groupedResponses.map((group, groupIdx) => (
                                <div key={groupIdx} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-slate-600/50 overflow-hidden">
                                  {/* Group Header */}
                                  <div className="bg-gradient-to-r from-[goldenrod]/20 to-amber-500/20 px-4 py-3 border-b border-slate-600/50">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                      <span className="w-2 h-2 bg-gradient-to-r from-[goldenrod] to-amber-400 rounded-full"></span>
                                      {group.name}
                                    </h3>
                                    {group.summary && (
                                      <p className="text-sm text-slate-300 mt-1">{group.summary}</p>
                                    )}
                                  </div>
                                  
                                  {/* Group Content */}
                                  <div className="p-4 space-y-4">
                                    {/* Responses Section */}
                                    {group.responses.length > 0 && (
                                      <div>
                                        <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                          Responses ({group.responses.length})
                                        </h4>
                                        <div className="space-y-2">
                                          {group.responses.map((response, respIdx) => (
                                            <div key={respIdx} className="group/item p-2 bg-white/5 rounded border border-white/10 hover:border-blue-400/30 transition-all duration-200 flex items-start gap-3">
                                              <input
                                                type="checkbox"
                                                checked={selectedAllAiPoints.includes(`${groupIdx}-${respIdx}`)}
                                                onChange={() => setSelectedAllAiPoints(prev => prev.includes(`${groupIdx}-${respIdx}`) ? prev.filter(i => i !== `${groupIdx}-${respIdx}`) : [...prev, `${groupIdx}-${respIdx}`])}
                                                className="w-4 h-4 mt-1"
                                              />
                                              <span className="text-sm text-gray-200 group-hover/item:text-blue-200 transition-colors duration-200">
                                                {response}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Action Items Section - Removed as requested */}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                          <Button
                            className="mt-4 w-full bg-[goldenrod] hover:bg-amber-600 text-black font-medium"
                            onClick={() => {
                              const selectedData = (() => {
                                const groupedResponses = parseGroupedAIResponses(allAiSummary);
                                if (groupedResponses.length === 0) {
                                  // Fallback to old format - split the string into lines
                                  const summaryLines = allAiSummary ? allAiSummary.split('\n').filter(Boolean) : [];
                                  return selectedAllAiPoints.map(idx => summaryLines[idx]).filter(Boolean);
                                } else {
                                  // Extract text from grouped responses (only responses, no action items)
                                  return selectedAllAiPoints.map(point => {
                                    if (typeof point === 'string' && point.includes('-')) {
                                      const [groupIdx, itemIdx] = point.split('-');
                                      const group = groupedResponses[parseInt(groupIdx)];
                                      if (group) {
                                        // Only handle responses, skip action items
                                        if (!itemIdx.startsWith('action')) {
                                          const respIdx = parseInt(itemIdx);
                                          return group.responses[respIdx] || '';
                                        }
                                      }
                                    }
                                    return '';
                                  }).filter(Boolean);
                                }
                              })();
                              setAssignAllSummaryData(selectedData);
                              setAssignAllSummaryForm(prev => ({
                                ...prev,
                                expectations: selectedData.join('; ')
                              }));
                              setAssignAllSummaryModal(true);
                            }}
                            disabled={!selectedAllAiPoints.length}
                          >
                            📋 Click here to generate AI driven "Action Plan"
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {/* Modal for assigning selected summary points */}
                  <Dialog open={assignAllSummaryModal} onOpenChange={(open) => {
                    setAssignAllSummaryModal(open);
                    if (!open) {
                      // Reset form when modal is closed
                      setAssignAllSummaryForm({ expectations: '', instructions: '', assignedTo: '', targetDate: '', categoryId: '', status: 'pending' });
                      setAssignAllSummaryData([]);
                    }
                  }}>
                    <DialogContent className="bg-[#29252c]/95 backdrop-blur-sm border border-gray-700 shadow-2xl max-w-2xl max-h-[90vh] flex flex-col">
                      <DialogHeader className="border-b border-gray-700 flex-shrink-0">
                        <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
                          <div className="w-2 h-8 bg-gradient-to-b from-[goldenrod] to-amber-500 rounded-full"></div>
                          Assign Action Plan from Summary
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAssignAllSummaryActionPlan} className="flex-1 overflow-y-auto p-6 space-y-4">
                        <div className="flex gap-4 items-center p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-400">Department:</span>
                            <span className="text-base font-bold text-white">{getCurrentDepartment()?.name || ""}</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-200">Category *</label>
                          <Select
                            value={assignAllSummaryForm.categoryId}
                            onValueChange={(val) => handleAssignAllSummaryFormChange('categoryId', val)}
                            options={allCategories
                              .filter(cat => !cat.department || String(cat.department) === String(getCurrentDepartment()?._id))
                              .map((cat) => ({ value: cat._id, label: capitalizeFirstLetter(cat.name) }))}
                            placeholder="Select a category"
                            className="bg-gray-800/50 border-gray-600 text-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-200">Expectations *</label>
                          <Textarea
                            value={assignAllSummaryForm.expectations}
                            onChange={e => handleAssignAllSummaryFormChange('expectations', e.target.value)}
                            placeholder="Expectations for this action plan"
                            className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-[goldenrod] resize-none"
                            rows={3}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-slate-200">Assign To *</label>
                            <Select
                              value={assignAllSummaryForm.assignedTo}
                              onValueChange={(val) => handleAssignAllSummaryFormChange("assignedTo", val)}
                              options={departmentUsers?.map((u) => ({ value: u._id, label: u.name })) || []}
                              placeholder={usersLoading ? "Loading users..." : "Select user"}
                              className="bg-gray-800/50 border-gray-600 text-white"
                              required
                              disabled={usersLoading || !departmentUsers || departmentUsers.length === 0}
                            />
                            {!usersLoading && (!departmentUsers || departmentUsers.length === 0) && (
                              <div className="text-xs text-red-400 mt-1">No users available to assign in this department.</div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 text-slate-200">Target Date *</label>
                            <Input
                              type="date"
                              value={assignAllSummaryForm.targetDate}
                              onChange={(e) => handleAssignAllSummaryFormChange("targetDate", e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                              className="bg-gray-800/50 border-gray-600 text-white focus:border-[goldenrod]"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-200">Instructions (optional)</label>
                          <Input
                            value={assignAllSummaryForm.instructions}
                            onChange={e => handleAssignAllSummaryFormChange('instructions', e.target.value)}
                            placeholder="Any extra instructions from HOD"
                            className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-[goldenrod]"
                          />
                        </div>

                        <DialogFooter className="border-t border-white/10 pt-6 flex-shrink-0">
                          <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-[goldenrod] to-amber-500 hover:from-amber-600 hover:to-amber-700 border-0 text-black font-medium shadow-lg"
                          >
                            {isSubmitting ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Creating...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>📋</span>
                                <span>Create Action Plan</span>
                              </div>
                            )}
                          </Button>
                          <DialogClose asChild>
                            <Button type="button" variant="outline" className="bg-gray-800/50 border-gray-600 text-gray-200 hover:bg-gray-700">
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
            
            {/* Trend Analysis Section - Hidden as requested */}
            {/* {showTrendAnalysis && trendAnalysis && (
              <div className="w-full max-w-4xl mb-8">
                <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl">
                  <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                      AI Trend Analysis & Predictions
                      <Badge variant="secondary" className="ml-auto bg-purple-500/20 text-purple-300 border-purple-400/30">
                        <span className="animate-pulse">●</span> Gemini AI
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="prose prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-slate-200 font-sans text-sm leading-relaxed bg-white/5 p-4 rounded-lg border border-white/10">
                        {trendAnalysis}
                      </pre>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowTrendAnalysis(false)}
                        className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"
                      >
                        Close Analysis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )} */}
           
            {/* Expectations Table */}
            {selectedCategory && (
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="text-xl font-semibold text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                      <span>Expectations for {capitalizeFirstLetter(selectedCategory)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={ratingFilter === "" ? "primary" : "outline"}
                          onClick={() => setRatingFilter("")}
                          className={ratingFilter === "" ? "bg-gradient-to-r from-blue-600 to-purple-600 border-0" : "bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"}
                        >
                          All
                        </Button>
                        <Button
                          size="sm"
                          variant={ratingFilter === "detractor" ? "primary" : "outline"}
                          onClick={() => setRatingFilter("detractor")}
                          className={ratingFilter === "detractor" ? "bg-gradient-to-r from-red-600 to-orange-600 border-0" : "bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"}
                        >
                          Detractor
                        </Button>
                        <Button
                          size="sm"
                          variant={ratingFilter === "passive" ? "primary" : "outline"}
                          onClick={() => setRatingFilter("passive")}
                          className={ratingFilter === "passive" ? "bg-gradient-to-r from-yellow-600 to-orange-600 border-0" : "bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"}
                        >
                          Passive
                        </Button>
                        <Button
                          size="sm"
                          variant={ratingFilter === "promoter" ? "primary" : "outline"}
                          onClick={() => setRatingFilter("promoter")}
                          className={ratingFilter === "promoter" ? "bg-gradient-to-r from-green-600 to-emerald-600 border-0" : "bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"}
                        >
                          Promoter
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCategory("")}
                        className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"
                      >
                        <span className="mr-1">←</span>
                        Back
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6">
                    <HODExpectationsTable
                      data={expectationData}
                      categoryName={selectedCategory}
                      ratingFilter={ratingFilter}
                      onAssign={(expObj) => {
                        setCreateModalOpen(true);
                        setSelectedCategoryForForm(selectedCategory || "");
                        setCreateForm(f => ({
                          ...f,
                          expectations: expObj.expectation,
                          actions: '',
                          instructions: '',
                          assignedTo: expObj.userId || '',
                        }));
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Department Expectations Table */}
            {selectedDepartment && (
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="text-xl font-semibold text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                      <span>All Expectations from {capitalizeFirstLetter(allDepartments.find(d => d._id === selectedDepartment)?.name || 'Department')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={ratingFilter === "" ? "primary" : "outline"}
                          onClick={() => setRatingFilter("")}
                          className={ratingFilter === "" ? "bg-gradient-to-r from-blue-600 to-purple-600 border-0" : "bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"}
                        >
                          All
                        </Button>
                        <Button
                          size="sm"
                          variant={ratingFilter === "detractor" ? "primary" : "outline"}
                          onClick={() => setRatingFilter("detractor")}
                          className={ratingFilter === "detractor" ? "bg-gradient-to-r from-red-600 to-orange-600 border-0" : "bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"}
                        >
                          Detractor
                        </Button>
                        <Button
                          size="sm"
                          variant={ratingFilter === "passive" ? "primary" : "outline"}
                          onClick={() => setRatingFilter("passive")}
                          className={ratingFilter === "passive" ? "bg-gradient-to-r from-yellow-600 to-orange-600 border-0" : "bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"}
                        >
                          Passive
                        </Button>
                        <Button
                          size="sm"
                          variant={ratingFilter === "promoter" ? "primary" : "outline"}
                          onClick={() => setRatingFilter("promoter")}
                          className={ratingFilter === "promoter" ? "bg-gradient-to-r from-green-600 to-emerald-600 border-0" : "bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"}
                        >
                          Promoter
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDepartment("")}
                        className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"
                      >
                        <span className="mr-1">←</span>
                        Back
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6">
                    {isLoadingExpectationData ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-slate-300">Loading department expectations...</span>
                        </div>
                      </div>
                    ) : (
                      <DepartmentExpectationsTable
                        data={allDepartmentsExpectationData.length > 0 ? allDepartmentsExpectationData : expectationData}
                        departmentId={selectedDepartment}
                        allDepartments={allDepartments}
                        ratingFilter={ratingFilter}
                        onAssign={(expObj) => {
                          setCreateModalOpen(true);
                          setSelectedCategoryForForm(expObj.category || "");
                          setCreateForm(f => ({
                            ...f,
                            expectations: expObj.expectation,
                            actions: '',
                            instructions: '',
                            assignedTo: expObj.userId || '',
                          }));
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Dialog open={createModalOpen} onOpenChange={(open) => {
              setCreateModalOpen(open);
              if (!open) {
                // Reset form when modal is closed
                setCreateForm({ expectations: '', actions: '', instructions: '', assignedTo: '', targetDate: '', status: 'pending' });
                setSelectedCategoryForForm("");
              }
            }}>
              <DialogContent className="bg-slate-900/95 backdrop-blur-sm border border-white/10 shadow-2xl max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="border-b border-white/10 flex-shrink-0">
                  <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    Assign Action Plan
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateActionPlan} className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-400">Department:</span>
                        <span className="text-base font-bold text-white">{getCurrentDepartment()?.name || ""}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-400/30">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-blue-300">🤖 AI Generated Plan:</span>
                        <span className="text-base font-bold text-white">{selectedCategoryForForm ? capitalizeFirstLetter(selectedCategoryForForm) : "AI Action Plan"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium mb-2 text-slate-200">Category *</label>
                    
                    {/* Existing Categories Dropdown */}
                    {allCategories.filter(cat => String(cat.department) === String(getCurrentDepartment()?._id)).length > 0 && (
                      <div>
                        <label className="block text-xs font-medium mb-1 text-slate-300">Select from existing categories:</label>
                        <Select
                          value={selectedCategoryForForm}
                          onValueChange={(val) => setSelectedCategoryForForm(val)}
                          options={allCategories
                            .filter(cat => String(cat.department) === String(getCurrentDepartment()?._id))
                            .map((cat) => ({ value: cat.name, label: capitalizeFirstLetter(cat.name) }))}
                          placeholder="Choose existing category"
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                    )}
                    
                    {/* Manual Category Input */}
                    <div>
                      <label className="block text-xs font-medium mb-1 text-slate-300">Or enter category name:</label>
                      <Input
                        value={selectedCategoryForForm}
                        onChange={(e) => setSelectedCategoryForForm(e.target.value)}
                        placeholder="Enter category name"
                        className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-200">Expectations</label>
                    <Input
                      value={createForm.expectations}
                      onChange={e => handleCreateFormChange('expectations', e.target.value)}
                      placeholder="Expectations for this action plan"
                      className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-200">Actions *</label>
                    <Textarea
                      value={createForm.actions}
                      onChange={e => handleCreateFormChange('actions', e.target.value)}
                      placeholder="Actions to be taken"
                      className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400 min-h-[80px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-200">Instructions (optional)</label>
                    <Input
                      value={createForm.instructions}
                      onChange={e => handleCreateFormChange('instructions', e.target.value)}
                      placeholder="Any extra instructions from HOD"
                      className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-200">Assign To</label>
                    <Select
                      value={createForm.assignedTo}
                      onValueChange={(val) => handleCreateFormChange("assignedTo", val)}
                      options={departmentUsers?.map((u) => ({ value: u._id, label: u.name })) || []}
                      placeholder={usersLoading ? "Loading users..." : "Select user"}
                      className="bg-white/5 border-white/20 text-white"
                      required
                      disabled={usersLoading || !departmentUsers || departmentUsers.length === 0}
                    />
                    {!usersLoading && (!departmentUsers || departmentUsers.length === 0) && (
                      <div className="text-xs text-red-400 mt-1">No users available to assign in this department.</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-200">Target Date</label>
                    <Input
                      type="date"
                      value={createForm.targetDate}
                      onChange={(e) => handleCreateFormChange("targetDate", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="bg-white/5 border-white/20 text-white focus:border-blue-400"
                      required
                    />
                  </div>
                  <DialogFooter className="border-t border-white/10 pt-6">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white shadow-lg"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Assigning...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>📋</span>
                          <span>Assign Action Plan</span>
                        </div>
                      )}
                    </Button>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10">
                        Cancel
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>





            {/* AI Plan Edit Modal */}
            <Dialog open={aiPlanEditModalOpen && editingPlan} onOpenChange={(open) => {
              if (!open) {
                setAiPlanEditModalOpen(false);
                setEditingPlan(null);
              }
            }}>
              <DialogContent className="bg-slate-900/95 backdrop-blur-sm border border-white/10 shadow-2xl max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader className="border-b border-white/10 flex-shrink-0">
                  <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    Edit AI Action Plan
                  </DialogTitle>
                </DialogHeader>
                {editingPlan && (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveEditedAI(editingPlan);
                  }} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-200">Title</label>
                        <Input
                          value={editingPlan.title}
                          onChange={(e) => setEditingPlan({...editingPlan, title: e.target.value})}
                          className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-200">Category</label>
                        <Input
                          value={editingPlan.category}
                          onChange={(e) => setEditingPlan({...editingPlan, category: e.target.value})}
                          className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-200">Priority</label>
                        <Select
                          value={editingPlan.priority}
                          onValueChange={(val) => setEditingPlan({...editingPlan, priority: val})}
                          options={[
                            { value: 'high', label: 'High' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'low', label: 'Low' }
                          ]}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-200">Impact Score</label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={editingPlan.impactScore}
                          onChange={(e) => setEditingPlan({...editingPlan, impactScore: parseInt(e.target.value)})}
                          className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-200">Summary</label>
                      <Textarea
                        value={editingPlan.summary}
                        onChange={(e) => setEditingPlan({...editingPlan, summary: e.target.value})}
                        placeholder="Summary of the action plan"
                        className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400 min-h-[80px]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-200">Recommended Actions</label>
                      <div className="space-y-3">
                        {editingPlan.recommendedActions.map((action, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Input
                              value={action}
                              onChange={(e) => {
                                const newActions = [...editingPlan.recommendedActions];
                                newActions[index] = e.target.value;
                                setEditingPlan({...editingPlan, recommendedActions: newActions});
                              }}
                              className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400"
                              placeholder={`Action ${index + 1}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newActions = editingPlan.recommendedActions.filter((_, i) => i !== index);
                                setEditingPlan({...editingPlan, recommendedActions: newActions});
                              }}
                              className="bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingPlan({
                              ...editingPlan, 
                              recommendedActions: [...editingPlan.recommendedActions, '']
                            });
                          }}
                          className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"
                        >
                          + Add Action
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-200">Supporting Data</label>
                      <Textarea
                        value={editingPlan.supportingData}
                        onChange={(e) => setEditingPlan({...editingPlan, supportingData: e.target.value})}
                        placeholder="Supporting data for this action plan"
                        className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400 min-h-[80px]"
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white">
                        Save Changes
                      </Button>
                      <DialogClose asChild>
                        <Button type="button" variant="outline" className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10">
                          Cancel
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            {/* Detailed Action Plan Modals */}
            
            {/* Preview Modal */}
            <Dialog open={detailedPlanPreviewModal} onOpenChange={setDetailedPlanPreviewModal}>
              <DialogContent className="bg-[#232026]/90 max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <span>👁️</span>
                    Preview Action Plan
                  </DialogTitle>
                  <DialogDescription className="text-slate-300">
                    Review the expectations for this action plan.
                  </DialogDescription>
                </DialogHeader>
                {selectedDetailedPlan && (
                  <div className="space-y-6">
                    {/* Expectations */}
                    <div className="bg-white/5 p-5 rounded-lg border border-white/10">
                      <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <span>📊</span>
                        Expectations
                      </h4>
                      <div className="space-y-2">
                        {selectedDetailedPlan.expectation.split('\n').map((expectation, index) => {
                          if (!expectation.trim()) return null;
                          return (
                            <div key={index} className="p-2">
                              <p className="text-slate-300 text-sm leading-relaxed">{expectation}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter className="border-t border-white/10 pt-6">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setDetailedPlanPreviewModal(false);
                        openDetailedPlanEdit(selectedDetailedPlan);
                      }}
                      className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10 hover:border-blue-400/50"
                    >
                      <span className="mr-2">✏️</span>
                      Edit
                    </Button>
                    <Button 
                      variant="primary"
                      onClick={() => {
                        setDetailedPlanPreviewModal(false);
                        openDetailedPlanAssign(selectedDetailedPlan);
                      }}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0 text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 w-[160px] h-[44px] rounded-xl"
                    >
                      <span className="mr-2">📋</span>
                      Assign
                    </Button>
                  </div>
                  <DialogClose asChild>
                    <Button variant="outline" className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10">
                      Close
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={detailedPlanEditModal} onOpenChange={setDetailedPlanEditModal}>
              <DialogContent className="bg-[#232026]/90 max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <span>✏️</span>
                    Edit Expectations
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleDetailedPlanEditSave(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Expectations</label>
                    <Textarea
                      value={detailedPlanEditForm.expectation}
                      onChange={(e) => handleDetailedPlanEditChange('expectation', e.target.value)}
                      placeholder="List the expectations for this action plan"
                      className="bg-white/5 border-white/20 text-white focus:border-blue-400"
                      rows={6}
                      required
                    />
                  </div>
                  
                  <DialogFooter className="border-t border-white/10 pt-6">
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white shadow-lg"
                    >
                      <span className="mr-2">💾</span>
                      Save Changes
                    </Button>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10">
                        Cancel
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Assign Modal */}
            <Dialog open={detailedPlanAssignModal} onOpenChange={setDetailedPlanAssignModal}>
              <DialogContent className="bg-[#232026]/90 max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <span>📋</span>
                    Assign Action Plan from AI Summary
                  </DialogTitle>
                </DialogHeader>
                
                {selectedDetailedPlan && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-400">Department:</span>
                        <span className="text-base font-bold text-white">{getCurrentDepartment()?.name || ""}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-400">Category:</span>
                        <Select
                            value={detailedPlanAssignForm.categoryId}
                            onValueChange={(val) => handleDetailedPlanAssignChange('categoryId', val)}
                            options={allCategories
                              .filter(cat => !cat.department || String(cat.department) === String(getCurrentDepartment()?._id))
                              .map((cat) => ({ value: cat._id, label: capitalizeFirstLetter(cat.name) }))}
                            placeholder="Select a category"
                            className="bg-gray-800/50 border-gray-600 text-white"
                            required
                          />
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="space-y-2">
                        {selectedDetailedPlan.expectation.split('\n').map((expectation, index) => {
                          if (!expectation.trim()) return null;
                          return (
                            <div key={index} className="p-2">
                              <p className="text-sm text-slate-300">{expectation}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleDetailedPlanAssign(); }} className="space-y-4">

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Assign To *</label>
                        <Select
                          value={detailedPlanAssignForm.assignedTo}
                          onValueChange={(value) => handleDetailedPlanAssignChange('assignedTo', value)}
                          options={departmentUsers?.map((u) => ({ value: u._id, label: u.name })) || []}
                          placeholder={usersLoading ? "Loading users..." : "Select user to assign"}
                          className="bg-white/5 border-white/20 text-white focus:border-blue-400"
                          required
                          disabled={usersLoading || !departmentUsers || departmentUsers.length === 0}
                        />
                        {!usersLoading && (!departmentUsers || departmentUsers.length === 0) && (
                          <div className="text-xs text-red-400 mt-1">No users available to assign in this department.</div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Target Date *</label>
                        <Input
                          type="date"
                          value={detailedPlanAssignForm.targetDate}
                          onChange={(e) => handleDetailedPlanAssignChange('targetDate', e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="bg-white/5 border-white/20 text-white focus:border-blue-400"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Instructions (optional)</label>
                        <Textarea
                          value={detailedPlanAssignForm.instructions}
                          onChange={(e) => handleDetailedPlanAssignChange('instructions', e.target.value)}
                          placeholder="Any additional instructions"
                          className="bg-white/5 border-white/20 text-white focus:border-blue-400"
                          rows={4}
                        />
                      </div>
                      
                      <DialogFooter className="border-t border-white/10 pt-6">
                        <Button 
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0 text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 w-[160px] h-[44px] rounded-xl"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Assigning...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>📋</span>
                              <span>Assign Expectations</span>
                            </div>
                          )}
                        </Button>
                        <DialogClose asChild>
                          <Button type="button" variant="outline" className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10">
                            Cancel
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </form>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Summaries */}
            {selectedCategory && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Rule-Based Summary - Hidden */}
                {/* <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl">
                  <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                      Rule-Based Summary
                      <Badge variant="secondary" className="ml-auto bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                        {ruleSummary.length} Points
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Button
                      onClick={() => fetchRuleSummary(selectedCategory)}
                      variant="primary"
                      className="mb-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0 text-white shadow-lg"
                    >
                      <span className="mr-2">📊</span>
                      Generate Rule-Based Summary
                    </Button>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {ruleSummary.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-emerald-400/30 transition-all duration-200">
                          <input
                            type="checkbox"
                            checked={selectedRulePoints.includes(idx)}
                            onChange={() => toggleRulePoint(idx)}
                            className="accent-emerald-500 w-4 h-4 mt-1"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-slate-200">{item.text}</span>
                            <Badge variant="secondary" className="ml-2 bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                              {item.count}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0 text-white shadow-lg"
                      onClick={() => assignSummaryPoints(selectedRulePoints, 'rule')}
                      disabled={!selectedRulePoints.length}
                    >
                      <span className="mr-2">📋</span>
                      Click here to generate AI driven "Action Plan"
                    </Button>
                  </CardContent>
                </Card> */}
                {/* AI Summary */}
                <Card 
                  className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-sm border border-white/10 shadow-xl relative overflow-hidden group cursor-help"
                  onMouseEnter={handleAiSectionMouseEnter}
                  onMouseLeave={handleAiSectionMouseLeave}
                >
                  {/* Animated background effects */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <CardHeader className="border-b border-white/10 relative z-10">
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-3">
                      <div className="relative">
                        <span className="text-2xl animate-pulse">🤖</span>
                        {isAiLoading && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                        )}
                      </div>
                      <div className="w-1.5 h-6 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full"></div>
                      AI-Powered Summary
                      <Badge variant="secondary" className="ml-auto bg-cyan-500/20 text-cyan-300 border-cyan-400/30">
                        <span className="animate-pulse">●</span> Gemini AI
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="relative z-10 p-6">
                    <Button
                      onClick={() => fetchAiSummary(selectedCategory)}
                      variant="outline"
                      className={`mb-4 w-full transition-all duration-300 ${
                        isAiLoading 
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-400/50 text-cyan-300 animate-pulse' 
                          : 'bg-white/5 border-white/20 text-slate-200 hover:bg-white/10 hover:border-cyan-400/50 hover:text-cyan-300 hover:shadow-lg hover:shadow-cyan-500/25'
                      } ${!isAiLoading && !aiSummary ? 'animate-pulse' : ''}`}
                      disabled={isAiLoading}
                    >
                      {isAiLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span>AI is thinking...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-lg animate-pulse">✨</span>
                          <span>Generate AI Summary</span>
                          <span className="text-xs text-cyan-300 ml-1">(Click to try!)</span>
                        </div>
                      )}
                    </Button>
                    
                    {isAiLoading && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-400/30">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-cyan-300 font-medium">AI is analyzing your data...</span>
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 bg-cyan-400/20 rounded-full animate-pulse"></div>
                          <div className="h-2 bg-purple-400/20 rounded-full animate-pulse" style={{width: '80%'}}></div>
                          <div className="h-2 bg-pink-400/20 rounded-full animate-pulse" style={{width: '60%'}}></div>
                        </div>
                      </div>
                    )}
                    
                    {aiSummary && (
                      <div className="space-y-4">
                        <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-400/30">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-400">✓</span>
                            <span className="text-green-300 text-sm font-medium">AI Analysis Complete - Grouped by Emotions & Types</span>
                          </div>
                        </div>
                        
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {(() => {
                            const groupedResponses = parseGroupedAIResponses(isTyping ? typedSummary : aiSummary);
                            
                            if (groupedResponses.length === 0) {
                              // Fallback to old format if grouping fails
                              return (isTyping ? typedSummary : aiSummary).split('\n').map((item, idx) => (
                                <div key={idx} className="group/item p-3 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-400/50 transition-all duration-300 flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedAiPoints.includes(idx)}
                                    onChange={() => toggleAiPoint(idx)}
                                    className="accent-cyan-400 w-4 h-4 mt-1"
                                  />
                                  <div className="flex-1">
                                    <span className="font-medium text-slate-200 group-hover/item:text-cyan-200 transition-colors duration-300">
                                      {item}
                                      {isTyping && idx === (isTyping ? typedSummary : aiSummary).split('\n').length - 1 && (
                                        <span className="inline-block w-2 h-5 bg-cyan-400 ml-1 animate-pulse"></span>
                                      )}
                                    </span>
                                  </div>
                                  <span className="text-xs text-cyan-400">AI Generated</span>
                                </div>
                              ));
                            }
                            
                            return groupedResponses.map((group, groupIdx) => (
                              <div key={groupIdx} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-slate-600/50 overflow-hidden">
                                {/* Group Header */}
                                <div className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 px-4 py-3 border-b border-slate-600/50">
                                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <span className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"></span>
                                    {group.name}
                                  </h3>
                                  {group.summary && (
                                    <p className="text-sm text-slate-300 mt-1">{group.summary}</p>
                                  )}
                                </div>
                                
                                {/* Group Content */}
                                <div className="p-4 space-y-4">
                                  {/* Responses Section */}
                                  {group.responses.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                        Responses ({group.responses.length})
                                      </h4>
                                      <div className="space-y-2">
                                        {group.responses.map((response, respIdx) => (
                                          <div key={respIdx} className="group/item p-2 bg-white/5 rounded border border-white/10 hover:border-blue-400/30 transition-all duration-200 flex items-start gap-3">
                                            <input
                                              type="checkbox"
                                              checked={selectedAiPoints.includes(`${groupIdx}-${respIdx}`)}
                                              onChange={() => toggleAiPoint(`${groupIdx}-${respIdx}`)}
                                              className="accent-blue-400 w-4 h-4 mt-1"
                                            />
                                            <span className="text-sm text-slate-200 group-hover/item:text-blue-200 transition-colors duration-200">
                                              {response}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Action Items Section - Removed as requested */}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                        
                        <Button
                          className="mt-4 w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 border-0 text-white shadow-lg"
                          onClick={() => assignSummaryPoints(selectedAiPoints, 'ai')}
                          disabled={!selectedAiPoints.length}
                        >
                          <span className="mr-2">🚀</span>
                          Click here to generate AI driven "Action Plan"
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </section>
            </div>
          </div>
        </div>}

        {/* Expanded View Modal */}
        <Dialog open={expandedViewModal} onOpenChange={setExpandedViewModal}>
          <DialogContent className="bg-[#29252c]/95 backdrop-blur-sm border border-gray-700 shadow-2xl max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader className="border-b border-gray-700 flex-shrink-0">
              <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-[goldenrod] to-amber-500 rounded-full"></div>
                Action Plan Details
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6">
              {selectedPlanForExpandedView && (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Department</h3>
                      <p className="text-white font-medium">{capitalizeFirstLetter(selectedPlanForExpandedView.department?.name)}</p>
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Category</h3>
                      <p className="text-white font-medium">{capitalizeFirstLetter(selectedPlanForExpandedView.category?.name)}</p>
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Assigned To</h3>
                      <p className="text-white font-medium">{selectedPlanForExpandedView.assignedTo?.name}</p>
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Target Date</h3>
                      <p className="text-white font-medium">{new Date(selectedPlanForExpandedView.targetDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Status</h3>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(selectedPlanForExpandedView.status)}
                      <Select
                        value={selectedPlanForExpandedView.status}
                        onValueChange={async (value) => {
                          setIsSubmitting(true);
                          try {
                            await axios.put(
                              `${Server}/action-plans/${selectedPlanForExpandedView._id}`,
                              { status: value },
                              { withCredentials: true }
                            );
                            fetchData();
                            setSelectedPlanForExpandedView(prev => ({ ...prev, status: value }));
                            toast({ title: "Success", description: "Status updated successfully", variant: "success" });
                          } catch (e) {
                            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        options={statusOptions.filter(opt => opt.value !== "all")}
                        className="w-48 bg-gray-700 border-gray-600 text-white"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Expectations */}
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Expectations</h3>
                    <p className="text-white whitespace-pre-wrap">{selectedPlanForExpandedView.expectations}</p>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Actions</h3>
                    <p className="text-white whitespace-pre-wrap">{selectedPlanForExpandedView.actions || "No actions taken yet"}</p>
                  </div>

                  {/* Instructions */}
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Instructions</h3>
                    <p className="text-white whitespace-pre-wrap">{selectedPlanForExpandedView.instructions || "No additional instructions"}</p>
                  </div>

                  {/* Created/Updated Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Created By</h3>
                      <p className="text-white font-medium">{selectedPlanForExpandedView.assignedBy?.name}</p>
                      <p className="text-gray-400 text-sm">{new Date(selectedPlanForExpandedView.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Last Updated</h3>
                      <p className="text-white font-medium">{new Date(selectedPlanForExpandedView.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </DialogContent>
        </Dialog>

        {/* AI Action Plans Tab Content */}
        {activeTab === "ai-action-plans" && (
          <div className="px-6 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                                        <h2 className="text-2xl font-bold text-white mb-2">🤖 AI Action Plans Generator</h2>
                        <p className="text-slate-300 text-sm mt-2">
                          AI will analyze all survey responses across categories and departments to identify patterns and generate actionable insights.
                        </p>
              </div>

                                     {/* AI Analysis Controls */}
                       <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 shadow-xl mb-6">
                         <CardContent className="p-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                           <div className="flex justify-center items-center h-full">
                                <Button
                                  onClick={handleGenerateAIActionPlans}
                                  disabled={isGeneratingAI}
                                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 text-white shadow-lg px-8 py-3"
                                >
                                 {isGeneratingAI ? (
                                   <>
                                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                     Analyzing Survey Data...
                                   </>
                                 ) : (
                                   <>
                                     🚀 Generate AI Action Plans
                                   </>
                                 )}
                               </Button>
                             </div>
                                                           <div>
                                <div className="space-y-3">
                                 <div>
                                   <label className="block text-sm font-medium text-slate-300 mb-2">Analysis Scope</label>
                                   <Select
                                     value={aiAnalysisScope}
                                     onValueChange={setAiAnalysisScope}
                                     options={[
                                       { value: "all", label: "All Categories & Departments" },
                                       { value: "categories", label: "By Categories Only" },
                                       { value: "departments", label: "By Departments Only" }
                                     ]}
                                     className="w-full bg-gray-800 border-gray-600 text-white"
                                   />
                                 </div>
                                 <div>
                                   <label className="block text-sm font-medium text-slate-300 mb-2">Priority Focus</label>
                                   <Select
                                     value={aiPriorityFocus}
                                     onValueChange={setAiPriorityFocus}
                                     options={[
                                       { value: "all", label: "All Priorities" },
                                       { value: "high", label: "High Priority (Low Ratings)" },
                                       { value: "medium", label: "Medium Priority" },
                                       { value: "low", label: "Low Priority (High Ratings)" }
                                     ]}
                                     className="w-full bg-gray-800 border-gray-600 text-white"
                                   />
                                 </div>
                               </div>
                             </div>
                           </div>
                         </CardContent>
                       </Card>

              {/* AI Generated Action Plans */}
              {aiGeneratedPlans.length > 0 && (
                <>
                  {/* Progress Summary */}
                  <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 shadow-xl mb-4">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-white font-medium">Generated {aiGeneratedPlans.length} Action Plans</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-400">{aiGeneratedPlans.filter(p => p.priority === 'high').length}</div>
                            <div className="text-xs text-gray-400">High Priority</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-yellow-400">{aiGeneratedPlans.filter(p => p.priority === 'medium').length}</div>
                            <div className="text-xs text-gray-400">Medium Priority</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-400">{aiGeneratedPlans.filter(p => p.priority === 'low').length}</div>
                            <div className="text-xs text-gray-400">Low Priority</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-[#29252c]/80 to-[#1f1a23]/90 backdrop-blur-sm border border-gray-700/60 shadow-2xl">
                  <CardHeader className="border-b border-gray-700 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                      <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full shadow-lg"></div>
                      AI Generated Action Plans ({aiGeneratedPlans.length})
                    </CardTitle>
                    <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                      Action plans generated based on AI Summary analysis of survey responses. Click "Assign" to assign to users or "Edit" to modify the plan.
                    </p>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-8">
                      {aiGeneratedPlans.map((plan, index) => (
                        <div key={index} className="p-8 bg-gradient-to-br from-gray-800/70 to-gray-900/70 rounded-2xl border border-gray-600/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-blue-400/40 hover:scale-[1.02] backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
                          {/* Subtle background pattern */}
                          <div className="absolute inset-0 opacity-5 pointer-events-none">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 transform rotate-12 scale-150"></div>
                          </div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="mb-4">
                                <h4 className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                  {plan.title}
                                </h4>
                                <div className="w-24 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full shadow-lg"></div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="p-4 bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl border border-gray-600/40 shadow-lg hover:border-blue-400/30 transition-all duration-200">
                                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Category</span>
                                  <p className="text-white font-bold text-lg mt-1">{capitalizeFirstLetter(plan.category)}</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl border border-gray-600/40 shadow-lg hover:border-blue-400/30 transition-all duration-200">
                                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Priority</span>
                                  <Badge 
                                    variant="secondary" 
                                    className={`mt-2 ${
                                      plan.priority === 'high' ? 'bg-gradient-to-r from-red-500/30 to-red-600/20 text-red-200 border-red-400/50' :
                                      plan.priority === 'medium' ? 'bg-gradient-to-r from-yellow-500/30 to-yellow-600/20 text-yellow-200 border-yellow-400/50' :
                                      'bg-gradient-to-r from-green-500/30 to-green-600/20 text-green-200 border-green-400/50'
                                    }`}
                                  >
                                    {plan.priority === 'high' ? 'High' : plan.priority === 'medium' ? 'Medium' : 'Low'}
                                  </Badge>
                                </div>

                              </div>
                              <div className="mb-4">
                                <span className="text-sm text-gray-400 uppercase tracking-wider font-medium">Summary:</span>
                                <div className="mt-3 p-4 bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl border border-gray-600/40 shadow-lg">
                                  <p className="text-white text-sm leading-relaxed">{plan.summary}</p>
                                </div>
                              </div>
                              <div className="mb-4">
                                <span className="text-sm text-gray-400 uppercase tracking-wider font-medium">Recommended Actions:</span>
                                <div className="mt-3 space-y-3">
                                  {plan.recommendedActions.map((action, actionIndex) => (
                                    <div key={actionIndex} className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl border border-gray-600/50 hover:border-blue-400/40 hover:shadow-lg transition-all duration-200">
                                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mt-2 flex-shrink-0 shadow-sm"></div>
                                      <span className="text-white text-sm leading-relaxed">{action}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {/* Source Responses Section */}
                              {plan.groupData && plan.groupData.responses && (
                                <div className="mb-4">
                                  <span className="text-sm text-gray-400 uppercase tracking-wider font-medium">Source Responses:</span>
                                  <div className="mt-3 space-y-3 max-h-32 overflow-y-auto">
                                    {plan.groupData.responses.map((response, respIdx) => (
                                      <div key={respIdx} className="flex items-start gap-3 p-3 bg-gradient-to-br from-gray-700/30 to-gray-800/30 rounded-lg border border-gray-600/30 hover:border-yellow-400/40 transition-all duration-200">
                                        <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mt-2 flex-shrink-0 shadow-sm"></div>
                                        <span className="text-white text-xs leading-relaxed italic">"{response}"</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-4 ml-8">
                              {/* Generated Plan Status */}
                              <div className="text-center p-3 bg-gradient-to-r from-green-500/30 to-emerald-500/20 border border-green-400/40 rounded-xl shadow-lg">
                                <span className="text-green-300 text-xs font-semibold uppercase tracking-wider">✓ Generated Plan</span>
                              </div>
                              
                              <div className="text-center">
                                <button
                                  type="button"
                                  style={{ width: '160px', height: '44px' }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    console.log('Edit button mousedown for plan:', plan.title);
                                  }}
                                  onMouseUp={(e) => {
                                    e.preventDefault();
                                    console.log('Edit button mouseup for plan:', plan.title);
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Edit button clicked for plan:', plan.title);
                                    handleEditAI(plan, index);
                                  }}
                                  className="bg-blue-600 text-white font-medium rounded-lg border border-blue-500 hover:bg-blue-700 active:bg-blue-800 cursor-pointer"
                                >
                                  ✏️ Edit
                                </button>
                              </div>
                              
                              <div className="text-center">
                                <button
                                  type="button"
                                  style={{ width: '160px', height: '44px' }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    console.log('Assign button mousedown for plan:', plan.title);
                                  }}
                                  onMouseUp={(e) => {
                                    e.preventDefault();
                                    console.log('Assign button mouseup for plan:', plan.title);
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Assign button clicked for plan:', plan.title);
                                    handleAssignFromAI(plan);
                                  }}
                                  className="bg-green-600 text-white font-medium rounded-lg border border-green-500 hover:bg-green-700 active:bg-green-800 cursor-pointer"
                                >
                                  📋 Assign Action Plan
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                </>
              )}

              {/* AI Analysis Progress */}
              {isGeneratingAI && (
                <Card className="bg-gradient-to-br from-[#29252c]/80 to-[#1f1a23]/90 backdrop-blur-sm border border-gray-700/60 shadow-2xl">
                  <CardHeader className="border-b border-gray-700 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                      <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full shadow-lg"></div>
                      AI Analysis in Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 shadow-lg"></div>
                        <span className="text-white text-lg font-medium">Analyzing survey responses...</span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-3 shadow-inner">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 shadow-lg" style={{ width: `${aiProgress}%` }}></div>
                      </div>
                      <p className="text-slate-300 text-base font-medium text-center">{aiProgress}% Complete</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assign Action Plan Modal - Positioned within AI Action Plans tab */}
              

              {/* AI Plan Edit Modal - Also positioned within AI Action Plans tab */}
              <Dialog open={aiPlanEditModalOpen && editingPlan} onOpenChange={(open) => {
                if (!open) {
                  setAiPlanEditModalOpen(false);
                  setEditingPlan(null);
                }
              }}>
                <DialogContent className="bg-slate-900/95 backdrop-blur-sm border border-white/10 shadow-2xl max-w-4xl max-h-[90vh] flex flex-col">
                  <DialogHeader className="border-b border-white/10 flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
                      <div className="w-2 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      Edit AI Action Plan
                    </DialogTitle>
                  </DialogHeader>
                  {editingPlan && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveEditedAI(editingPlan);
                    }} className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-200">Title</label>
                          <Input
                            value={editingPlan.title}
                            onChange={(e) => setEditingPlan({...editingPlan, title: e.target.value})}
                            className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-200">Category</label>
                          <Input
                            value={editingPlan.category}
                            onChange={(e) => setEditingPlan({...editingPlan, category: e.target.value})}
                            className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-200">Priority</label>
                          <Select
                            value={editingPlan.priority}
                            onValueChange={(val) => setEditingPlan({...editingPlan, priority: val})}
                            options={[
                              { value: 'high', label: 'High' },
                              { value: 'medium', label: 'Medium' },
                              { value: 'low', label: 'Low' }
                            ]}
                            className="bg-white/5 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-200">Impact Score</label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={editingPlan.impactScore}
                            onChange={(e) => setEditingPlan({...editingPlan, impactScore: parseInt(e.target.value)})}
                            className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-200">Summary</label>
                        <Textarea
                          value={editingPlan.summary}
                          onChange={(e) => setEditingPlan({...editingPlan, summary: e.target.value})}
                          placeholder="Summary of the action plan"
                          className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400 min-h-[80px]"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-200">Recommended Actions</label>
                        <div className="space-y-3">
                          {editingPlan.recommendedActions.map((action, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <Input
                                value={action}
                                onChange={(e) => {
                                  const newActions = [...editingPlan.recommendedActions];
                                  newActions[index] = e.target.value;
                                  setEditingPlan({...editingPlan, recommendedActions: newActions});
                                }}
                                className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400"
                                placeholder={`Action ${index + 1}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newActions = editingPlan.recommendedActions.filter((_, i) => i !== index);
                                  setEditingPlan({...editingPlan, recommendedActions: newActions});
                                }}
                                className="bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingPlan({
                                ...editingPlan, 
                                recommendedActions: [...editingPlan.recommendedActions, '']
                              });
                            }}
                            className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"
                          >
                            + Add Action
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-200">Supporting Data</label>
                        <Textarea
                          value={editingPlan.supportingData}
                          onChange={(e) => setEditingPlan({...editingPlan, supportingData: e.target.value})}
                          placeholder="Supporting data for this action plan"
                          className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400 min-h-[80px]"
                        />
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white">
                          Save Changes
                        </Button>
                        <DialogClose asChild>
                          <Button type="button" variant="outline" className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10">
                            Cancel
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        
      </div>
    );
  }
}

export default ActionPlansPage;