import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import DashboardHeader from "../components/DashboardHeader";
import PageErrorBoundary from "../components/PageErrorBoundary";
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
        No expectations in this category yet !
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
                <td className="p-2 border-b border-muted-foreground/20 text-[#FFF8E7]">{dept.name?.toUpperCase()}</td>
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

// Component for showing all expectations from current department
function AllExpectationsTable({ data, onAssign, ratingFilter, currentDepartment }) {
  if (!data || !Array.isArray(data)) {
    return <div className="p-4 text-slate-400 text-center">No data available.</div>;
  }
  
  // Flatten all expectations from current department data
  let allExpectations = [];
  
  try {
    data.forEach((category) => {
      if (!category.departments || !Array.isArray(category.departments)) {
        return;
      }
      
      category.departments.forEach((dept) => {
        if (!dept.users || !Array.isArray(dept.users)) {
          return;
        }
        
        dept.users.forEach((user) => {
          if (!user.expectations || !Array.isArray(user.expectations)) {
            return;
          }
          
          user.expectations.forEach((exp) => {
            if (exp && exp.text) {
              allExpectations.push({
                department: dept.name,
                user: user.name,
                expectation: exp.text,
                rating: exp.rating || 0,
                userId: user._id || user.id,
                category: category.category,
              });
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('Error processing expectations data:', error);
    return <div className="p-4 text-red-500 font-semibold">Error processing data. Please try again.</div>;
  }

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
            <div className={`px-4 py-3 bg-gradient-to-r ${group.color} text-white font-semibold sticky top-0 z-10`}>
              {group.label} ({items.length} expectations)
            </div>
            <div className="max-h-96 overflow-y-auto overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Category</th>
                    {/* <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">User</th> */}
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Expectation</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Rating</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((e, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-4 py-3 text-sm text-slate-200 font-medium">{e.department?.toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm text-slate-200 font-medium">{capitalizeFirstLetter(e.category)}</td>
                      {/* <td className="px-4 py-3 text-sm text-slate-200">{e.user}</td> */}
                      <td className="px-4 py-3 text-sm text-slate-300 max-w-md truncate" title={e.expectation}>
                        {e.expectation?.length > 20 ? (e.expectation.substring(0, 20) + "...") : e.expectation}
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
          No expectations found in {currentDepartment?.name || 'your current department'}.
        </div>
      )}
    </div>
  );
}

// Component for HODs to view expectations by category from current department
function HODExpectationsTable({ data, categoryName, onAssign, ratingFilter, currentDepartment }) {
  if (!data || !Array.isArray(data)) return <div>No data available.</div>;
  const categoryData = data.find(
    (item) => item.category?.toLowerCase() === categoryName?.toLowerCase()
  );
  if (!categoryData) {
    return (
      <div className="p-4 text-red-500 font-semibold">
        No expectations in this category yet !
      </div>
    );
  }
  // Flatten all expectations with user, dept, and rating
  let allExpectations = [];
  categoryData.departments.forEach((dept) => {
    dept.users.forEach((user) => {
      (user.expectations || []).forEach((exp) => {
        if (exp && exp.text) {
          allExpectations.push({
            department: dept.name,
            user: user.name,
            expectation: exp.text,
            rating: exp.rating || 0,
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
            <div className={`px-4 py-3 bg-gradient-to-r ${group.color} text-white font-semibold sticky top-0 z-10`}>
              {group.label} ({items.length} expectations)
            </div>
            <div className="max-h-96 overflow-y-auto overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-slate-700/50">
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
                      <td className="px-4 py-3 text-sm text-slate-200 font-medium">{e.department?.toUpperCase()}</td>
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
          No expectations in this category yet !
        </div>
      )}
    </div>
  );
}

         // Department Expectations Table Component - Simplified for current department only
         function DepartmentExpectationsTable({ data, departmentId, allDepartments, onAssign, ratingFilter, currentDepartment }) {
  if (!data || !Array.isArray(data)) {
    return <div className="p-6 text-slate-400 text-center bg-white/5 rounded-lg border border-white/10">No data available.</div>;
  }
  
  // Flatten all expectations from the current department data
  let allExpectations = [];
  
  // data is now just the current department data
  data.forEach((category) => {
    if (!category.departments || !Array.isArray(category.departments)) {
      return;
    }
    
    category.departments.forEach((dept) => {
      // Only process if this is the selected department filter
      const selectedDept = allDepartments.find(d => d._id === departmentId);
      if (!selectedDept || dept.name.toLowerCase() !== selectedDept.name.toLowerCase()) {
        return;
      }
      
          if (!dept.users || !Array.isArray(dept.users)) {
            return;
          }
          
      dept.users.forEach((user) => {
            if (!user.expectations || !Array.isArray(user.expectations)) {
              return;
            }
            
        user.expectations.forEach((exp) => {
          if (exp && exp.text) {
                allExpectations.push({
                  department: dept.name,
                  user: user.name,
              expectation: exp.text,
              rating: exp.rating || 0,
                  userId: user._id || user.id,
                  category: category.category,
                });
              }
            });
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
            <div className={`px-4 py-3 bg-gradient-to-r ${group.color} text-white font-semibold sticky top-0 z-10`}>
              {group.label} ({items.length} expectations)
            </div>
            <div className="max-h-96 overflow-y-auto overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Category</th>
                    {/* <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">User</th> */}
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Expectation</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Rating</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((e, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-4 py-3 text-sm text-slate-200 font-medium">{capitalizeFirstLetter(e.category)}</td>
                      {/* <td className="px-4 py-3 text-sm text-slate-200">{e.user}</td> */}
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
          No expectations by this department yet !
        </div>
      )}
    </div>
  );
}

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
  const [aiEmptyReason, setAiEmptyReason] = useState(null); // "no_expectations" | "all_assigned" | null
  
  // AI Plan Editing state variables
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingPlanIndex, setEditingPlanIndex] = useState(null);
  const [aiPlanEditModalOpen, setAiPlanEditModalOpen] = useState(false);
  const [aiCreateModalOpen, setAiCreateModalOpen] = useState(false);


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
    // if (plan.department?._id !== getCurrentDepartment()?._id) {
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
    // }
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
      // HOD gets action plans for their department
      if (currentUser.role === "hod") {
        response = await axios.get(`${Server}/action-plans/hod`, { withCredentials: true });
      } 
      // Admin and user see action plans assigned to them
      else if (currentUser.role === "admin" || currentUser.role === "user") {
        response = await axios.get(`${Server}/action-plans/user`, { withCredentials: true });
      }
      setActionPlans(response.data);
      
      const catresponse = await axios.get(`${Server}/categories`, { withCredentials: true });
      setAllCategories(catresponse.data);
      const depresponse = await axios.get(`${Server}/departments`, { withCredentials: true });
      setAllDepartments(depresponse.data);
      
      // HOD also fetches expectation data for their current department
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





  // Memoize adminFilters to prevent unnecessary re-renders
  const memoizedAdminFilters = useMemo(() => adminFilters, [adminFilters.departmentId, adminFilters.categoryId, adminFilters.assignedTo, adminFilters.status]);

  useEffect(() => {
    fetchData();
  }, [currentUser, memoizedAdminFilters]);

  // Clear AI generated data when department changes
  const clearAIGeneratedData = () => {
    setAiGeneratedPlans([]);
    setAiCreateModalOpen(false);
    setAiPlanEditModalOpen(false);
    setEditingPlan(null);
    setEditingPlanIndex(null);
  };

  // Fetch data when current department changes for HOD
  useEffect(() => {
    if (currentUser.role === "hod" && getCurrentDepartment()?._id) {
      fetchData();
      // Clear AI generated data when department changes
      // clearAIGeneratedData();
    }
  }, [getCurrentDepartment()]);

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

  // Handle delete action plan
  const handleDeleteActionPlan = async (plan) => {
    if (window.confirm(`Are you sure you want to delete this action plan?\n\nExpectations: ${plan.expectations}\nAssigned to: ${plan.assignedTo?.name}\n\nThis action cannot be undone.`)) {
      setIsSubmitting(true);
      try {
        await axios.delete(`${Server}/action-plans/${plan._id}`, { withCredentials: true });
        fetchData(); // Refresh the action plans list
        toast({ 
          title: "Success", 
          description: "Action plan deleted successfully", 
          variant: "success" 
        });
      } catch (error) {
        console.error('Error deleting action plan:', error);
        toast({ 
          title: "Error", 
          description: "Failed to delete action plan", 
          variant: "destructive" 
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  // Handle create action plan submit
  const handleCreateActionPlan = async (e) => {
    e.preventDefault();
    if (!createForm.expectations.trim()) {
      toast({ title: "Error", description: "Expectations are required.", variant: "destructive" });
      return;
    }
    if (!createForm.instructions.trim()) {
      toast({ title: "Error", description: "Instructions are required.", variant: "destructive" });
      return;
    }
    if (!selectedCategoryForForm.trim()) {
      toast({ title: "Error", description: "Please select or enter a category.", variant: "destructive" });
      return;
    }
    if (!createForm.assignedTo.length) {
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
      
      // Handle multiple user assignment
      const assignedUsers = Array.isArray(createForm.assignedTo) ? createForm.assignedTo : [createForm.assignedTo];
      
      // Create action plans for each assigned user
      for (const userId of assignedUsers) {
      await axios.post(
        `${Server}/action-plans`,
        {
          departmentId: getCurrentDepartment()?._id,
          categoryId: existingCategory?._id || selectedCategoryForForm,
          expectations: createForm.expectations,
          instructions: createForm.instructions,
          assignedTo: userId,
          targetDate: createForm.targetDate,
          status: createForm.status,
        },
        { withCredentials: true }
      );
      }
      
      // Close both modals if they're open
      setCreateModalOpen(false);
      setAiCreateModalOpen(false);
      setCreateForm({ expectations: '', instructions: '', assignedTo: '', targetDate: '', status: 'pending' });
      setSelectedCategoryForForm("");
      fetchData();
      
      const userCount = assignedUsers.length;
      const userText = userCount === 1 ? 'user' : 'users';
      toast({ title: "Success", description: `Action plan assigned to ${userCount} ${userText}!` });
    } catch (err) {
      console.error("Error creating action plan:", err);
      toast({ title: "Error", description: err.response?.data?.message || "Failed to create action plan.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle assignAllSummaryActionPlan action plan submit
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

      // --- User and Admin View ---
    if (currentUser.role === "user" || currentUser.role === "admin") {
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
      <div className="bg-[#29252c]">
        <DashboardHeader title="My Action Plans" />
        <Card className="m-4 bg-gradient-to-br from-[#29252c]/90 to-[#1f1a23]/90 backdrop-blur-sm border border-gray-700/60 shadow-2xl">
          <CardHeader className="border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full shadow-lg"></div>
                Action Plans Assigned to Me
              </CardTitle>
              <div className="text-sm text-slate-300 bg-orange-500/20 px-3 py-1 rounded-full border border-orange-400/30">
                {filteredPlans.length} Plans
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm text-blue-300">
              <span>👆</span>
              <span>Scroll horizontally to view all columns</span>
              <div className="flex gap-1 ml-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-400/60 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-blue-400/40 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative">
              {/* Left scroll indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-900/80 to-transparent z-10 pointer-events-none"></div>
              {/* Right scroll indicator */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900/80 to-transparent z-10 pointer-events-none flex items-center justify-center">
                <div className="text-blue-400 text-xs animate-bounce">→</div>
              </div>
              
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <Table className="min-w-[1200px] border-separate border-spacing-0">
                  <TableHeader className="bg-gradient-to-r from-gray-800 to-gray-900 sticky top-0 z-5">
                    <TableRow>
                      <TableHead className="w-[140px] font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 px-4 py-4 text-center">
                        Department
                      </TableHead>
                      <TableHead className="w-[140px] font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 px-4 py-4 text-center">
                        Category
                      </TableHead>
                      <TableHead className="w-[280px] font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 px-4 py-4 text-center">
                        Expectations
                      </TableHead>
                      <TableHead className="w-[220px] font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 px-4 py-4 text-center">
                        Instructions
                      </TableHead>
                      <TableHead className="w-[140px] font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 px-4 py-4 text-center">
                        Target Date
                      </TableHead>
                      <TableHead className="w-[120px] font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 px-4 py-4 text-center">
                        Status
                      </TableHead>
                      <TableHead className="w-[160px] font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 px-4 py-4 text-center">
                        Update Status
                      </TableHead>
                      <TableHead className="w-[160px] font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 px-4 py-4 text-center">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlans
                      .sort((a, b) => {
                        const statusOrder = { pending: 0, "in-progress": 1, completed: 2 };
                        return statusOrder[a.status] - statusOrder[b.status];
                      })
                      .map((plan, index) => (
                      <TableRow 
                        key={plan._id}
                        className={`${index % 2 === 0 ? 'bg-gray-800/40' : 'bg-gray-900/40'} hover:bg-blue-600/20 transition-all duration-200 border-b border-gray-700/30`}
                      >
                          <TableCell 
                            className="px-4 py-4 border-r border-gray-700/30 text-center" 
                            title={plan.department?.name ? capitalizeFirstLetter(plan.department.name) : ''}
                          >
                            <span className="text-white font-medium text-sm">
                              {capitalizeFirstLetter(plan.department?.name)}
                            </span>
                          </TableCell>
                          <TableCell 
                            className="px-4 py-4 border-r border-gray-700/30 text-center" 
                            title={plan.category?.name ? capitalizeFirstLetter(plan.category.name) : ''}
                          >
                            <span className="text-white font-medium text-sm">
                              {capitalizeFirstLetter(plan.category?.name)}
                            </span>
                          </TableCell>
                          <TableCell 
                            className="px-4 py-4 border-r border-gray-700/30" 
                            title={plan.expectations}
                          >
                            <div className="text-slate-200 text-sm leading-relaxed max-w-[260px] overflow-hidden">
                              <span className="line-clamp-2">{plan.expectations}</span>
                            </div>
                          </TableCell>
                          <TableCell 
                            className="px-4 py-4 border-r border-gray-700/30" 
                            title={plan.instructions}
                          >
                            <div className="text-slate-300 text-sm leading-relaxed max-w-[200px] overflow-hidden">
                              <span className="line-clamp-2">{plan.instructions}</span>
                            </div>
                          </TableCell>
                          <TableCell 
                            className="px-4 py-4 border-r border-gray-700/30 text-center"
                              title={new Date(plan.targetDate).toLocaleDateString('en-GB')}
                            >
                            <span className="text-white font-medium text-sm">
                              {new Date(plan.targetDate).toLocaleDateString('en-GB')}
                            </span>
                          </TableCell>
                          <TableCell 
                            className="px-4 py-4 border-r border-gray-700/30 text-center"
                            title={plan.status}
                          >
                            <div className="flex justify-center">
                              {getStatusBadge(plan.status)}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4 border-r border-gray-700/30">
                            <div className="flex justify-center">
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
                                className="h-9 text-xs bg-gray-700/50 border-gray-600"
                                disabled={isSubmitting}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex gap-2 justify-center">
                              <Button 
                                size="sm" 
                                variant="primary" 
                                onClick={() => openActionModal(plan)}
                                className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-2"
                              >
                                {plan.actions ? "Edit" : "Add"}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleDeleteActionPlan(plan)}
                                disabled={isSubmitting}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-2"
                                title="Delete Action Plan"
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                  </TableRow>
                ))}
                    {filteredPlans.length === 0 && (
                      <TableRow className="bg-gray-800/20">
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center">
                              <span className="text-3xl">📋</span>
                            </div>
                            <div className="text-slate-300 text-lg font-medium">No action plans assigned to you</div>
                            <div className="text-slate-400 text-sm">Check back later or contact your supervisor</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Modal for adding/updating actions */}
        <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
          <DialogContent className="bg-[#232026]/90 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-center">{actionModalPlan?.actions ? "Edit Actions Taken" : "Add Actions Taken"}</DialogTitle>
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
                  <div className="text-[#FFF8E7] max-h-24 overflow-y-auto">{actionModalPlan.expectations}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Instructions</div>
                  <div className="text-[#FFF8E7] max-h-24 overflow-y-auto">{actionModalPlan.instructions}</div>
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

  // // --- Admin View ---
  // if (currentUser.role === "admin") {
  //   return (
  //     <div>
  //       <DashboardHeader title="All Action Plans (Admin)" />
  //       <Card className="m-4">
  //         <CardHeader>
  //           <CardTitle>Filters</CardTitle>
  //         </CardHeader>
  //         <CardContent>
  //           <div className="flex flex-wrap gap-4">
  //             <Select
  //               value={adminFilters.departmentId}
  //               onValueChange={val => setAdminFilters(f => ({ ...f, departmentId: val }))}
  //               options={[{ value: "", label: "All Departments" }, ...allDepartments.map(d => ({ value: d._id, label: d.name }))]}
  //               className="w-48"
  //             />
  //             <Select
  //               value={adminFilters.categoryId}
  //               onValueChange={val => setAdminFilters(f => ({ ...f, categoryId: val }))}
  //               options={[{ value: "", label: "All Categories" }, ...allCategories.map(c => ({ value: c._id, label: c.name }))]}
  //               className="w-48"
  //             />
  //             <Select
  //               value={adminFilters.assignedTo}
  //               onValueChange={val => setAdminFilters(f => ({ ...f, assignedTo: val }))}
  //               options={[
  //                 { value: "", label: "All Assignees" }, 
  //                 ...actionPlans
  //                   .filter(p => p.assignedTo && p.assignedTo._id)
  //                   .map(p => ({ value: p.assignedTo._id, label: p.assignedTo.name }))
  //                   .filter((item, index, self) => self.findIndex(t => t.value === item.value) === index)
  //               ]}
  //               className="w-48"
  //             />
  //             <Select
  //               value={adminFilters.status}
  //               onValueChange={val => setAdminFilters(f => ({ ...f, status: val }))}
  //               options={statusOptions}
  //               className="w-48"
  //             />
  //           </div>
  //         </CardContent>
  //       </Card>
  //       <Card>
  //         <CardHeader>
  //           <CardTitle>All Action Plans</CardTitle>
  //         </CardHeader>
  //         <CardContent>
  //           <Table>
  //             <TableHeader>
  //               <TableRow>
  //                 <TableHead>Department</TableHead>
  //                 <TableHead>Category</TableHead>
  //                 <TableHead>Expectations</TableHead>
  //                 <TableHead>Actions</TableHead>
  //                 <TableHead>Instructions</TableHead>
  //                 <TableHead>Assigned By</TableHead>
  //                 <TableHead>Assigned To</TableHead>
  //                 <TableHead>Target Date</TableHead>
  //                 <TableHead>Status</TableHead>
  //                 <TableHead>Actions</TableHead>
  //               </TableRow>
  //             </TableHeader>
  //             <TableBody>
  //               {filteredPlans.map((plan) => (
  //                 <TableRow key={plan._id}>
  //                   <TableCell>{plan.department?.name}</TableCell>
  //                   <TableCell>{plan.category?.name}</TableCell>
  //                   <TableCell>{plan.expectations}</TableCell>
  //                   <TableCell>
  //                     <span>{plan.actions}</span>
  //                   </TableCell>
  //                   <TableCell>{plan.instructions}</TableCell>
  //                   <TableCell>{plan.assignedBy?.name}</TableCell>
  //                   <TableCell>{plan.assignedTo?.name}</TableCell>
  //                   <TableCell>{new Date(plan.targetDate).toLocaleDateString()}</TableCell>
  //                   <TableCell>{getStatusBadge(plan.status)}</TableCell>
  //                   <TableCell>
  //                     <Button size="sm" variant="outline" className="mr-2" disabled>Edit</Button>
  //                     <Button size="sm" variant="destructive" onClick={async () => {
  //                       if (window.confirm("Are you sure you want to delete this action plan?")) {
  //                         setIsSubmitting(true);
  //                         try {
  //                           await axios.delete(`${Server}/action-plans/${plan._id}`, { withCredentials: true });
  //                           fetchData();
  //                         } catch (e) {
  //                           toast({ title: "Error", description: "Failed to delete action plan", variant: "destructive" });
  //                         } finally {
  //                           setIsSubmitting(false);
  //                         }
  //                       }
  //                     }}>Delete</Button>
  //                   </TableCell>
  //                 </TableRow>
  //               ))}
  //               {filteredPlans.length === 0 && (
  //                 <TableRow>
  //                   <TableCell colSpan={9} className="text-center py-4">No action plans found.</TableCell>
  //                 </TableRow>
  //               )}
  //             </TableBody>
  //           </Table>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }



  // AI Action Plans Functions
  const handleGenerateAIActionPlans = async () => {
    setIsGeneratingAI(true);
    setAiProgress(0);
    setAiGeneratedPlans([]);
    setAiEmptyReason(null);
    
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

      // Fetch survey data for AI analysis - Ask for simple expectations only
      const response = await axios.get(`${Server}/analytics/summarize-expectations/ai`, {
        params: { 
          departmentId: getCurrentDepartment()?._id,
          priority: aiPriorityFocus, // Priority focus
          format: 'simple' // Request simple format
        },
        withCredentials: true,
      });

      clearInterval(progressInterval);
      setAiProgress(100);

      // Process AI response and generate summarized expectations
      const aiSummary = response.data.summary || '';
      
      const generatedPlans = await processAIResponse(aiSummary);
      
      // Use all generated plans directly (no filtering)
      setAiGeneratedPlans(generatedPlans);

      // Since we're not filtering anymore, all plans are new
      if (generatedPlans.length === 0) {
        // No expectations found at all
        setAiEmptyReason("no_expectations");
        toast({ 
          title: "No Expectations Found", 
          description: "No expectations were found in the survey data for the selected priority focus.", 
          variant: "default" 
        });
      } else {
        // All generated plans are new
        setAiEmptyReason(null);
        toast({ 
          title: "Success", 
          description: `Generated ${generatedPlans.length} new summarized expectations`, 
          variant: "success" 
        });
      }

    } catch (error) {
      console.error('Error generating AI summaries:', error);
      toast({ 
        title: "Error", 
        description: "Failed to generate AI summaries", 
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingAI(false);
      setAiProgress(0);
    }
  };

  const processAIResponse = async (aiSummary) => {
    if (!aiSummary) return [];

    // Check if AI response is already structured (from new backend)
    if (Array.isArray(aiSummary)) {
      return aiSummary.map((item, index) => ({
        id: `exp_${index}`,
        summary: item.summary || '',
        category: item.category || 'General',
        categoryId: item.categoryId || '',
        priority: item.priority || 'Medium',
        originalData: item.originalData || 'Based on survey responses',
        recommendedActions: item.recommendedActions || [],
        sourceResponses: item.sourceResponses || []
      }));
    }

    // Parse AI summary and extract summarized expectations (fallback for old format)
    const summarizedExpectations = parseSummarizedExpectations(aiSummary);
    
    if (summarizedExpectations.length === 0) {
      // Fallback to simple format if parsing fails
      return generateFallbackSummaries(aiSummary);
    }

    return summarizedExpectations;
  };

  // Parse simple expectations from AI response (fallback for old format)
  const parseSummarizedExpectations = (aiSummary) => {
    if (!aiSummary) return [];
    
    try {
      // Split by lines and filter out empty lines
      const lines = aiSummary.split('\n').filter(line => line.trim());
      const expectations = [];
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        // Remove common prefixes like "1.", "-", "*", etc.
        const cleanLine = trimmedLine.replace(/^[\d\-*•]+\.?\s*/, '');
        
        if (cleanLine && cleanLine.length > 5) { // Only meaningful lines
          expectations.push({
            id: `exp_${index}`,
            summary: cleanLine,
            category: 'General',
            categoryId: '',
            priority: 'Medium',
            originalData: 'Based on survey responses',
            recommendedActions: [],
            sourceResponses: []
          });
        }
      });
      
      return expectations;
    } catch (error) {
      console.error('Error parsing summarized expectations:', error);
      return [];
    }
  };



  // Fallback function for simple format
  const generateFallbackSummaries = (aiSummary) => {
    if (!aiSummary) return [];
    
    return [{
      id: 'fallback_1',
      summary: aiSummary.substring(0, 200) + (aiSummary.length > 200 ? '...' : ''),
      category: 'General',
      categoryId: '',
      priority: 'Medium',
      originalData: 'Based on survey responses',
      recommendedActions: [],
      sourceResponses: []
    }];
  };



  const handleAssignFromAI = async (aiPlan) => {
    try {
      // Build instructions with recommended actions only
      let instructions = '';
      
      if (aiPlan.recommendedActions && aiPlan.recommendedActions.length > 0) {
        instructions = 'Recommended Actions:\n';
        aiPlan.recommendedActions.forEach((action, index) => {
          instructions += `${index + 1}. ${action}\n`;
        });
      } else {
        // Fallback to summary if no recommended actions
        instructions = aiPlan.summary;
      }
      
      // Pre-fill the create form with AI-generated content for assignment
      setCreateForm({
        expectations: instructions, // Prefill expectations with the same data as instructions
        instructions: instructions,
        assignedTo: [], // Initialize as empty array for multiple user selection
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        status: 'pending',
      });

      // Pre-fill category if available from AI
      if (aiPlan.categoryId) {
        setSelectedCategoryForForm(aiPlan.categoryId);
      } else {
        setSelectedCategoryForForm('');
      }

      // Fetch users for the current department
      setUsersLoading(true);
      try {
        const res = await axios.get(`${Server}/users/by-department/${getCurrentDepartment()?._id}`, { withCredentials: true });
        setDepartmentUsers(res.data || []);
      } catch (error) {
        console.error("Error fetching users for AI modal:", error);
        setDepartmentUsers([]);
      } finally {
        setUsersLoading(false);
      }

      // Open the AI create modal for assignment
      setAiCreateModalOpen(true);

      toast({ 
        title: "Success", 
        description: "AI summary loaded for assignment. You can now assign it to a team member.", 
        variant: "success" 
      });

    } catch (error) {
      console.error('Error assigning from AI summary:', error);
      toast({ 
        title: "Error", 
        description: "Failed to load AI summary for assignment", 
        variant: "destructive" 
      });
    }
  };



  const handleEditAI = async (aiPlan, index) => {
    try {
      // Open edit modal with current plan data
      setAiPlanEditModalOpen(true);
      setEditingPlanIndex(index);
      setEditingPlan({ 
        ...aiPlan,
        recommendedActions: aiPlan.recommendedActions || []
      });

      toast({ 
        title: "Edit Mode", 
        description: "You can now edit the expectation summary", 
        variant: "success" 
      });

    } catch (error) {
      console.error('Error editing AI summary:', error);
      toast({ 
        title: "Error", 
        description: "Failed to open edit mode", 
        variant: "destructive" 
      });
    }
  };

  // Handle saving edited AI summary
  const handleSaveEditedAI = async (editedPlan) => {
    try {
      const updatedPlans = [...aiGeneratedPlans];
      updatedPlans[editingPlanIndex] = {
        ...updatedPlans[editingPlanIndex],
        summary: editedPlan.summary,
        priority: editedPlan.priority
      };
      
      setAiGeneratedPlans(updatedPlans);
      setAiPlanEditModalOpen(false);
      setEditingPlan(null);
      setEditingPlanIndex(null);

      toast({ 
        title: "Success", 
        description: "AI summary updated successfully", 
        variant: "success" 
      });

    } catch (error) {
      console.error('Error saving edited AI summary:', error);
      toast({ 
        title: "Error", 
        description: "Failed to save edited AI summary", 
        variant: "destructive" 
      });
    }
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 text-center hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-xl">
                      📋
                    </div>
                    <div className="text-2xl font-bold text-white">{actionPlans.length}</div>
                    <div className="text-sm text-gray-400">Total Plans</div>
                  </CardContent>
                </Card>
                {/* <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 text-center hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-xl">
                      ⏳
                    </div>
                    <div className="text-2xl font-bold text-white">{actionPlans.filter(p => p.status === "pending").length}</div>
                    <div className="text-sm text-gray-400">Pending</div>
                  </CardContent>
                </Card> */}
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
        {activeTab === "overview" && currentUser.role === "hod" && (
          <div className="px-6 py-6">
            <div className="max-w-7xl mx-auto">
              <Card className="bg-gradient-to-br from-[#29252c]/90 to-[#1f1a23]/90 backdrop-blur-sm border border-gray-700/60 shadow-2xl">
                <CardHeader className="border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                      <div className="w-2 h-8 bg-gradient-to-b from-[goldenrod] to-amber-500 rounded-full shadow-lg"></div>
                      Action Plans Assigned by You ({getCurrentDepartment()?.name || 'Current Department'})
                    </CardTitle>
                    <div className="text-sm text-slate-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/30">
                      {actionPlans.filter(plan => plan.assignedBy?._id === currentUser._id).length} Plans
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-sm text-blue-300">
                    <span>👆</span>
                    <span>Scroll horizontally to view all columns</span>
                    <div className="flex gap-1 ml-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-400/60 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-blue-400/40 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {actionPlans.filter(plan => plan.assignedBy?._id === currentUser._id).length > 0 ? (
                    <div className="relative">
                      {/* Left scroll indicator */}
                      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-900/80 to-transparent z-10 pointer-events-none"></div>
                      {/* Right scroll indicator */}
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900/80 to-transparent z-10 pointer-events-none flex items-center justify-center">
                        <div className="text-blue-400 text-xs animate-bounce">→</div>
                      </div>
                      
                      <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                        <table className="w-full min-w-[1400px] border-separate border-spacing-0">
                          <thead className="bg-gradient-to-r from-gray-800 to-gray-900 sticky top-0 z-20">
                            <tr>
                              <th className="px-4 py-4 text-center font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700">Department</th>
                              <th className="px-4 py-4 text-center font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700">Category</th>
                              <th className="px-4 py-4 text-center font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700">Expectations</th>
                              <th className="px-4 py-4 text-center font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700">Actions</th>
                              <th className="px-4 py-4 text-center font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700">Instructions</th>
                              <th className="px-4 py-4 text-center font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700">Assigned To</th>
                              <th className="px-4 py-4 text-center font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700">Target Date</th>
                              <th className="px-4 py-4 text-center font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700">Status</th>
                              <th className="px-4 py-4 text-center font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700">Update</th>
                              <th className="px-4 py-4 text-center font-bold text-white bg-gradient-to-b from-gray-800 to-gray-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {actionPlans
                              .filter(plan => plan.assignedBy?._id === currentUser._id)
                              .sort((a, b) => {
                                const statusOrder = { pending: 0, "in-progress": 1, completed: 2 };
                                return statusOrder[a.status] - statusOrder[b.status];
                              })
                              .map((plan, idx) => (
                              <tr key={plan._id} className={`${idx % 2 === 0 ? 'bg-gray-800/40' : 'bg-gray-900/40'} hover:bg-blue-600/20 transition-all duration-200 border-b border-gray-700/30`}>
                                <td className="px-4 py-4 text-center border-r border-gray-700/30">
                                  <span className="text-white font-medium text-sm">{capitalizeFirstLetter(plan.department?.name)}</span>
                                </td>
                                <td className="px-4 py-4 text-center border-r border-gray-700/30">
                                  <span className="text-white font-medium text-sm">{capitalizeFirstLetter(plan.category?.name)}</span>
                                </td>
                                <td className="px-4 py-4 border-r border-gray-700/30" title={plan.expectations}>
                                  <div className="text-slate-200 text-sm leading-relaxed max-w-[200px] overflow-hidden">
                                    <span className="line-clamp-2">{plan.expectations}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 border-r border-gray-700/30" title={plan.actions}>
                                  <div className="text-slate-300 text-sm leading-relaxed max-w-[180px] overflow-hidden">
                                    <span className="line-clamp-2">{plan.actions || "No actions yet"}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 border-r border-gray-700/30" title={plan.instructions}>
                                  <div className="text-slate-300 text-sm leading-relaxed max-w-[180px] overflow-hidden">
                                    <span className="line-clamp-2">{plan.instructions || "No instructions"}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-center border-r border-gray-700/30">
                                  <span className="text-white font-medium text-sm">{plan.assignedTo?.name}</span>
                                </td>
                                <td className="px-4 py-4 text-center border-r border-gray-700/30">
                                  <span className="text-white font-medium text-sm">{new Date(plan.targetDate).toLocaleDateString('en-GB')}</span>
                                </td>
                                <td className="px-4 py-4 text-center border-r border-gray-700/30">
                                  <div className="flex justify-center">
                                    {getStatusBadge(plan.status)}
                                  </div>
                                </td>
                                <td className="px-4 py-4 border-r border-gray-700/30">
                                  <div className="flex justify-center">
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
                                      className="h-9 text-xs bg-gray-700/50 border-gray-600"
                                      disabled={isSubmitting}
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex gap-2 justify-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openExpandedView(plan)}
                                      className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white font-medium text-xs px-3 py-2"
                                    >
                                      View
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive" 
                                      onClick={() => handleDeleteActionPlan(plan)}
                                      disabled={isSubmitting}
                                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-2"
                                      title="Delete Action Plan"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center">
                          <span className="text-3xl">📋</span>
                        </div>
                        <div className="text-slate-300 text-lg font-medium">No action plans assigned by you</div>
                        <div className="text-slate-400 text-sm">Create action plans in the "Expectations" tab</div>
                      </div>
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
                <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 shadow-xl">
                  <CardHeader className="flex gap-2 justify-between border-b border-gray-700">
                    <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
                      <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                      <span>All Expectations ({getCurrentDepartment()?.name || 'Current Department'})</span>
                    </CardTitle>
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
                        </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-6">
                      {isLoadingExpectationData ? (
                        <div className="flex items-center justify-center p-8">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-slate-300">Loading all expectations...</span>
                                  </div>
                                  </div>
                      ) : (
                        <>
                          <AllExpectationsTable
                            data={expectationData}
                            ratingFilter={ratingFilter}
                            currentDepartment={getCurrentDepartment()}
                            onAssign={(expObj) => {
                              setCreateModalOpen(true);
                              setSelectedCategoryForForm(expObj.category || "");
                              setCreateForm(f => ({
                                ...f,
                                department: expObj.department || "",
                                instructions: expObj.expectation,
                                assignedTo: expObj.userId || '',
                              }));
                            }}
                          />
                                                    {expectationData.length === 0 && (
                            <div className="text-center py-8 text-slate-300">
                              <div className="text-4xl mb-4">📊</div>
                              <h3 className="text-lg font-semibold mb-2">No Expectations Available</h3>
                              <p className="text-sm text-slate-400">
                                No expectations data found for {getCurrentDepartment()?.name || 'your department'}. Please check if surveys have been completed or contact your administrator.
                              </p>
                        </div>
                          )}
                        </>
                            )}
                          </div>
                </CardContent>
              </Card>
            )}
            
              {/* Category Expectations Table - Shows when a specific category is selected */}
            {selectedCategory && (
                <Card className="bg-[#29252c]/70 backdrop-blur-sm border border-gray-700 shadow-xl">
                  <CardHeader className="border-b border-gray-700">
                  <CardTitle className="text-xl font-semibold text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-[goldenrod] to-amber-500 rounded-full"></div>
                                              <span>Expectations for {capitalizeFirstLetter(selectedCategory)} ({getCurrentDepartment()?.name || 'Current Department'})</span>
                    </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={ratingFilter === "" ? "primary" : "outline"}
                          onClick={() => setRatingFilter("")}
                          className={ratingFilter === "" ? "bg-gradient-to-r from-[goldenrod] to-amber-500 border-0" : "bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"}
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
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6">
                      {isLoadingExpectationData ? (
                        <div className="flex items-center justify-center p-8">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 border-2 border-[goldenrod] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-slate-300">Loading category expectations...</span>
                          </div>
                        </div>
                      ) : (
                    <HODExpectationsTable
                      data={expectationData}
                      categoryName={selectedCategory}
                      ratingFilter={ratingFilter}
                          currentDepartment={getCurrentDepartment()}
                      onAssign={(expObj) => {
                        setCreateModalOpen(true);
                            setSelectedCategoryForForm(expObj.category || selectedCategory);
                        setCreateForm(f => ({
                          ...f,
                              department: expObj.department || "",
                          instructions: expObj.expectation,
                          assignedTo: expObj.userId || '',
                        }));
                      }}
                    />
                      )}
                  </div>
                </CardContent>
              </Card>
            )}

                          {/* Department Expectations Table - Only shows data from current department */}
            {selectedDepartment && (
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="text-xl font-semibold text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                      <span>All Expectations from {capitalizeFirstLetter(allDepartments.find(d => d._id === selectedDepartment)?.name || 'Department')} ({getCurrentDepartment()?.name || 'Current Department'})</span>
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
                        data={expectationData}
                        departmentId={selectedDepartment}
                        allDepartments={allDepartments}
                        ratingFilter={ratingFilter}
                        currentDepartment={getCurrentDepartment()}
                        onAssign={(expObj) => {
                          setCreateModalOpen(true);
                          setSelectedCategoryForForm(expObj.category || "");
                          setCreateForm(f => ({
                            ...f,
                            department: expObj.department || "",
                            instructions: expObj.expectation,
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
                setCreateForm({ expectations: '', instructions: '', assignedTo: '', targetDate: '', status: 'pending' });
                setSelectedCategoryForForm("");
              }
            }}>
              <DialogContent className="bg-[#29252c] backdrop-blur-sm border border-white/10 shadow-2xl max-w-2xl max-h-[90vh] flex flex-col">
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
                        <span className="text-sm font-semibold text-blue-300">Category:</span>
                        <span className="text-base font-bold text-white">{selectedCategoryForForm ? capitalizeFirstLetter(selectedCategoryForForm) : "AI Action Plan"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {/* Category is auto-filled from selected expectation */}
                    
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-200">Expectations</label>
                    <Textarea
                      value={createForm.expectations}
                      onChange={e => handleCreateFormChange('expectations', e.target.value)}
                      placeholder="What is expected to be achieved or delivered"
                      className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400 min-h-[120px]"
                      rows={4}
                      required
                    />
                    <div className="text-xs text-slate-400 mt-1">
                      Define the specific outcomes, goals, or deliverables expected from this action plan
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-200">Instructions</label>
                    <Textarea
                      value={createForm.instructions}
                      onChange={e => handleCreateFormChange('instructions', e.target.value)}
                      placeholder="Instructions for this action plan"
                      className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400 min-h-[120px]"
                      rows={5}
                      required
                    />
                    <div className="text-xs text-slate-400 mt-1">
                      Provide step-by-step guidance, resources, or additional context for completing the action plan
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-200">Assign To (Multiple Users)</label>
                    <div className="bg-white/5 border border-white/20 rounded-lg p-3 max-h-48 overflow-y-auto">
                      {usersLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="ml-2 text-slate-300">Loading users...</span>
                        </div>
                      ) : departmentUsers && departmentUsers.length > 0 ? (
                        <div className="space-y-2 max-h-20 overflow-auto">
                          {departmentUsers.map((user) => (
                            <label key={user._id} className="flex items-center space-x-3 cursor-pointer hover:bg-white/5 rounded p-2 transition-colors">
                              <input
                                type="checkbox"
                                checked={Array.isArray(createForm.assignedTo) ? createForm.assignedTo.includes(user._id) : createForm.assignedTo === user._id}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Add user to selection
                                    const currentUsers = Array.isArray(createForm.assignedTo) ? createForm.assignedTo : (createForm.assignedTo ? [createForm.assignedTo] : []);
                                    if (!currentUsers.includes(user._id)) {
                                      handleCreateFormChange("assignedTo", [...currentUsers, user._id]);
                                    }
                                  } else {
                                    // Remove user from selection
                                    const currentUsers = Array.isArray(createForm.assignedTo) ? createForm.assignedTo : (createForm.assignedTo ? [createForm.assignedTo] : []);
                                    const updatedUsers = currentUsers.filter(id => id !== user._id);
                                    handleCreateFormChange("assignedTo", updatedUsers.length > 0 ? updatedUsers : "");
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <span className="text-slate-200 font-medium">{user.name}</span>
                              <span className="text-xs text-slate-400">({user.email || 'No email'})</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-400">
                          No users available to assign in this department.
                        </div>
                      )}
                    </div>
                    {!usersLoading && departmentUsers && departmentUsers.length > 0 && (
                      <div className="mt-2 text-xs text-slate-400">
                        {Array.isArray(createForm.assignedTo) && createForm.assignedTo.length > 0 ? (
                          <span className="text-blue-300">
                            Selected: {createForm.assignedTo.length} user{createForm.assignedTo.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span>Select one or more users to assign the action plan</span>
                        )}
                      </div>
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
            {/* <Dialog open={aiPlanEditModalOpen && editingPlan} onOpenChange={(open) => {
              if (!open) {
                setAiPlanEditModalOpen(false);
                setEditingPlan(null);
              }
            }}>
              <DialogContent className="bg-[#29252c]/95 backdrop-blur-sm border border-white/10 shadow-2xl max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader className="border-b border-white/10 flex-shrink-0">
                  <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                                          Edit AI Summary
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
                                                  {editingPlan.recommendedActions && editingPlan.recommendedActions.map((action, index) => (
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
            </Dialog> */}

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
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>💾</span>
                          <span>Save Changes</span>
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

            {/* AI features removed from Expectations tab - Only available in AI Action Plans tab */}
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
                      <p className="text-white font-medium">{new Date(selectedPlanForExpandedView.targetDate).toLocaleDateString('en-GB')}</p>
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
                        className="max-w-36 bg-gray-700 border-gray-600 text-white"
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
                      <p className="text-gray-400 text-sm">{new Date(selectedPlanForExpandedView.createdAt).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Last Updated</h3>
                      <p className="text-white font-medium">{new Date(selectedPlanForExpandedView.updatedAt).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="border-t border-gray-700 pt-6">
              <div className="flex gap-3 w-full justify-between">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleDeleteActionPlan(selectedPlanForExpandedView);
                    setExpandedViewModal(false);
                  }}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  🗑️ Delete Action Plan
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10">
                    Close
                  </Button>
                </DialogClose>
              </div>
            </DialogFooter>

          </DialogContent>
        </Dialog>

        {/* AI Action Plans Tab Content */}
        {activeTab === "ai-action-plans" && (
          <div className="px-6 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                                        <h2 className="text-2xl font-bold text-white mb-2">🤖 AI Expectations Summarizer</h2>
                        <p className="text-slate-300 text-sm mt-2">
                          AI will analyze all survey responses from your current department to generate simple, point-wise expectations based on priority focus.
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          Expected format: One expectation per line (e.g., "Improve communication", "Reduce response time", etc.)
                        </p>
                        
                        {/* AI Accuracy Disclaimer */}
                        <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/30 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
                                <span className="text-amber-400 text-xs">⚠️</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-amber-400 font-medium text-sm mb-1">AI Analysis Disclaimer</h4>
                              <p className="text-slate-300 text-xs leading-relaxed">
                                While we strive for accuracies around +90%, please note that automated sentiment analysis may not fully capture nuances in language, tone, or context. The results should be used as a guide rather than an absolute metric, and we recommend reviewing individual responses for a more comprehensive analysis.
                              </p>
                            </div>
                          </div>
                        </div>
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
                                     🚀 Generate AI Summaries
                                   </>
                                 )}
                               </Button>
                             </div>
                                                           <div>
                                <div className="space-y-3">
                                 <div>
                                   {/* <label className="block text-sm font-medium text-slate-300 mb-2">Priority Focus</label> */}
                                   <select
                                     value={aiPriorityFocus}
                                     onChange={(e) => setAiPriorityFocus(e.target.value)}
                                     className="w-full bg-white/5 border-white/20 text-white rounded-md p-4 focus:border-blue-400 transition-colors duration-200"
                                   >
                                     <option value="all" className="bg-[#29252c]">All Priorities</option>
                                     <option value="high" className="bg-[#29252c]">High Priority (Low Ratings)</option>
                                     <option value="medium" className="bg-[#29252c]">Medium Priority</option>
                                     <option value="low" className="bg-[#29252c]">Low Priority (High Ratings)</option>
                                   </select>
                                 
                                 </div>
                               </div>
                             </div>
                           </div>
                         </CardContent>
                       </Card>

              {/* AI Generated Action Plans */}
              {aiGeneratedPlans && aiGeneratedPlans.length > 0 && (
                <>
                  <Card className="bg-gradient-to-br from-[#29252c]/80 to-[#1f1a23]/90 backdrop-blur-sm border border-gray-700/60 shadow-2xl ">
                  <CardHeader className="border-b border-gray-700 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                      <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full shadow-lg"></div>
                      AI Generated Summaries ({aiGeneratedPlans.length})
                    </CardTitle>
                    <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                      Simple, point-wise expectations generated by AI analysis of survey responses. Click "Assign" to assign to users or "Edit" to modify the summary.
                    </p>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {aiGeneratedPlans && aiGeneratedPlans.map((plan, index) => (
                        <div key={index} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl border border-gray-600/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-blue-400/40 hover:scale-[1.02] backdrop-blur-sm overflow-hidden">
                          {/* Header with Category and Priority */}
                          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-600/50 px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col gap-2">
                                {plan.category && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-orange-400 text-sm font-medium">🏷️ Category:</span>
                                    <span className="text-white text-base font-semibold bg-blue-600/30 px-3 py-2 rounded-md border border-blue-500/30">
                                      {plan.category}
                                    </span>
                                  </div>
                                )}
                                {plan.priority && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-orange-400 text-sm font-medium">⚡ Priority:</span>
                                    <span className={`text-white text-base font-semibold px-3 py-2 rounded-md border ${
                                      plan.priority === 'High' 
                                        ? 'bg-red-600/30 border-red-500/30' 
                                        : plan.priority === 'Medium' 
                                        ? 'bg-yellow-600/30 border-yellow-500/30' 
                                        : 'bg-green-600/30 border-green-500/30'
                                    }`}>
                                      {plan.priority}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-6 space-y-6">
                            {/* Summary Section */}
                            <div>
                              <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">SUMMARY:</h4>
                              <div className="p-4 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl border border-gray-600/50 shadow-lg">
                                <p className="text-white text-sm leading-relaxed">{plan.summary}</p>
                              </div>
                            </div>

                            {/* Recommended Actions Section */}
                            {plan.recommendedActions && plan.recommendedActions.length > 0 && (
                              <div>
                                <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">RECOMMENDED ACTIONS:</h4>
                                <div className="space-y-2">
                                  {plan.recommendedActions.map((action, actionIndex) => (
                                    <div key={actionIndex} className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                      <p className="text-slate-300 text-sm leading-relaxed">{action}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Source Responses Section */}
                            {plan.sourceResponses && plan.sourceResponses.length > 0 && (
                              <div>
                                <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">SOURCE RESPONSES:</h4>
                                <div className="space-y-2">
                                  {plan.sourceResponses.map((response, responseIndex) => (
                                    <div key={responseIndex} className="flex items-start gap-3 p-3 bg-gray-700/20 rounded-lg border border-gray-600/20">
                                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                                      <p className="text-slate-300 text-sm leading-relaxed italic">"{response}"</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}


                              
                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-600/30">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditAI(plan, index);
                                }}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl border border-blue-500 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 cursor-pointer px-4 py-3 transition-all duration-200 shadow-lg hover:shadow-xl"
                              >
                                <span className="flex items-center justify-center gap-2">
                                  <span>✏️</span>
                                  <span>Edit</span>
                                </span>
                              </button>
                            
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAssignFromAI(plan);
                                }}
                                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-xl border border-green-500 hover:from-green-700 hover:to-green-800 active:from-green-800 active:to-green-900 cursor-pointer px-4 py-3 transition-all duration-200 shadow-lg hover:shadow-xl"
                              >
                                <span className="flex items-center justify-center gap-2">
                                  <span>📋</span>
                                  <span>Assign</span>
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                </>
              )}

              {/* Empty State Message - differentiate between no expectations vs all assigned */}
              {!isGeneratingAI && aiGeneratedPlans && aiGeneratedPlans.length === 0 && aiEmptyReason === "all_assigned" && (
                <Card className="bg-gradient-to-br from-[#29252c]/80 to-[#1f1a23]/90 backdrop-blur-sm border border-gray-700/60 shadow-2xl">
                  <CardContent className="p-8">
                    <div className="text-center py-12">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
                        <span className="text-4xl">✅</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">All Expectations Already Assigned</h3>
                      <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto mb-6">
                        Great work! All expectations from the survey data analysis already have action plans assigned to team members. 
                        There are no new summaries to display at this time.
                      </p>
                      <div className="bg-blue-600/10 border border-blue-400/20 rounded-lg p-4 max-w-xl mx-auto">
                        <p className="text-blue-300 text-sm">
                          💡 <strong>Tip:</strong> You can view all existing action plans in the "Overview" tab or try a different priority focus to see if there are unassigned expectations.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State Message - no expectations found */}
              {!isGeneratingAI && aiGeneratedPlans && aiGeneratedPlans.length === 0 && aiEmptyReason === "no_expectations" && (
                <Card className="bg-gradient-to-br from-[#29252c]/80 to-[#1f1a23]/90 backdrop-blur-sm border border-gray-700/60 shadow-2xl">
                  <CardContent className="p-8">
                    <div className="text-center py-12">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center border border-yellow-400/30">
                        <span className="text-4xl">📭</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">No Expectations Found</h3>
                      <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto mb-6">
                        No expectations were found in the survey data for the selected priority focus. 
                        This might be because there are no survey responses yet or the priority filter is too restrictive.
                      </p>
                      <div className="bg-yellow-600/10 border border-yellow-400/20 rounded-lg p-4 max-w-xl mx-auto">
                        <p className="text-yellow-300 text-sm">
                          💡 <strong>Tip:</strong> Try changing the priority focus to "All Priorities" or check if there are survey responses for this department.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                <DialogContent className="bg-[#29252c]/95 backdrop-blur-sm border border-white/10 shadow-2xl max-w-4xl max-h-[90vh] flex flex-col">
                  <DialogHeader className="border-b border-white/10 flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
                      <div className="w-2 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      Edit AI Summary
                    </DialogTitle>
                  </DialogHeader>
                  {editingPlan && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveEditedAI(editingPlan);
                    }} className="flex-1 overflow-y-auto p-6">
                      <div className="space-y-8">
                        {/* Summary Section */}
                        <div>
                          <label className="block text-sm font-medium mb-3 text-slate-200">Summary</label>
                          <Textarea
                            value={editingPlan.summary}
                            onChange={(e) => setEditingPlan({...editingPlan, summary: e.target.value})}
                            placeholder="Summary of the expectation"
                            className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400 min-h-[120px] w-full"
                            required
                          />
                        </div>

                        {/* Priority Section */}
                          <div>
                            <label className="block text-sm font-medium mb-3 text-slate-200">Priority</label>
                            <Select
                              value={editingPlan.priority || 'Medium'}
                              onValueChange={(val) => setEditingPlan({...editingPlan, priority: val})}
                              options={[
                                { value: 'High', label: 'High Priority' },
                                { value: 'Medium', label: 'Medium Priority' },
                                { value: 'Low', label: 'Low Priority' }
                              ]}
                              className="bg-white/5 border-white/20 text-white"
                              placeholder="Select priority"
                            />
                        </div>

                        {/* Recommended Actions Section */}
                        <div>
                          <label className="block text-sm font-medium mb-3 text-slate-200">Recommended Actions</label>
                          <div className="space-y-3">
                            {editingPlan.recommendedActions && editingPlan.recommendedActions.map((action, index) => (
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
                                  recommendedActions: [...(editingPlan.recommendedActions || []), '']
                                });
                              }}
                              className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10"
                            >
                              + Add Action
                            </Button>
                          </div>
                        </div>




                      </div>
                      
                      <DialogFooter className="mt-8 pt-6 border-t border-white/10">
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Saving...</span>
                        </div>
                          ) : (
                            <span>Save Changes</span>
                          )}
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

              {/* AI Action Plans Create Modal */}
              <Dialog open={aiCreateModalOpen} onOpenChange={(open) => {
                if (!open) {
                  setAiCreateModalOpen(false);
                  // Clear form data when modal is closed
                  setCreateForm({ expectations: '', instructions: '', assignedTo: '', targetDate: '', status: 'pending' });
                  setSelectedCategoryForForm('');
                }
              }}>
                <DialogContent className="bg-[#29252c] backdrop-blur-sm border border-white/10 shadow-2xl max-w-4xl max-h-[90vh] flex flex-col">
                  <DialogHeader className="border-b border-white/10 flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
                      <div className="w-2 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      Create Action Plan from AI Summary
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateActionPlan} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-6">
                      {/* Row 1: Category (full width) */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-200">Category</label>
                        <div className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-slate-200">
                          {allCategories.find(cat => cat._id === selectedCategoryForForm)?.name || 'Quality of Work'}
                          <div className="text-xs text-slate-400 mt-1">
                            {/* Category determined by AI based on survey responses */}
                          </div>
                        </div>
                      </div>
                      
                      {/* Row 2: Instructions (full width) */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-200">Instructions</label>
                        <Textarea
                          value={createForm.instructions}
                          onChange={(e) => setCreateForm({...createForm, instructions: e.target.value})}
                          placeholder="Additional instructions or context"
                          className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400 min-h-[140px]"
                          rows={6}
                        />
                        <div className="text-xs text-slate-400 mt-1">
                          Provide step-by-step guidance, resources, or additional context for completing the action plan
                        </div>
                      </div>
                      
                      {/* Row 3: Assigned To and Target Date (side by side) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-200">Assigned To</label>
                          <div className="space-y-3">
                            {/* Multiple User Selection */}
                            <div className="flex items-center gap-3">
                              <Select
                                value=""
                                onValueChange={(val) => {
                                  if (val && !createForm.assignedTo.includes(val)) {
                                    setCreateForm({
                                      ...createForm,
                                      assignedTo: [...createForm.assignedTo, val]
                                    });
                                  }
                                }}
                                options={departmentUsers
                                  .filter(user => !createForm.assignedTo.includes(user._id))
                                  .map((user) => ({ value: user._id, label: user.name }))
                                }
                                className="flex-1 bg-white/5 border-white/20 text-white"
                                placeholder="Select users to assign"
                                isLoading={usersLoading}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                  // Select all users
                                  const allUserIds = departmentUsers.map(user => user._id);
                                  setCreateForm({
                                    ...createForm,
                                    assignedTo: allUserIds
                                  });
                                }}
                                className="bg-white/5 border-white/20 text-slate-200 hover:bg-white/10 whitespace-nowrap"
                              >
                                Select All
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                  // Clear all users
                                  setCreateForm({
                                    ...createForm,
                                    assignedTo: []
                                  });
                                }}
                                className="bg-red-500/10 border-red-400/30 text-red-300 hover:bg-red-500/20 whitespace-nowrap"
                                disabled={createForm.assignedTo.length === 0}
                              >
                                Clear All
                                </Button>
                              </div>
                            
                            {/* Selected Users Display */}
                            {createForm.assignedTo.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-xs text-slate-400">Selected Users:</span>
                                <div className="flex flex-wrap gap-2">
                                  {createForm.assignedTo.map((userId) => {
                                    const user = departmentUsers.find(u => u._id === userId);
                                    return (
                                      <div
                                        key={userId}
                                        className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-300 text-sm"
                                      >
                                        <span>{user?.name || userId}</span>
                                        <button
                              type="button"
                              onClick={() => {
                                            setCreateForm({
                                              ...createForm,
                                              assignedTo: createForm.assignedTo.filter(id => id !== userId)
                                });
                              }}
                                          className="text-blue-400 hover:text-blue-300 text-xs"
                            >
                                          ✕
                                        </button>
                          </div>
                                    );
                                  })}
                        </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-200">Target Date</label>
                          <Input
                            type="date"
                            value={createForm.targetDate}
                            onChange={(e) => setCreateForm({...createForm, targetDate: e.target.value})}
                            className="bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-blue-400"
                            required
                          />
                        </div>
                      </div>
                    </div>
                      
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Creating...
                            </div>
                          ) : (
                            "Create Action Plan"
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
            </div>
          </div>
        )}

        
      </div>
    );
  }
}

// Wrap the component with error boundary
const ActionPlansPageWithErrorBoundary = () => (
  <PageErrorBoundary pageName="Action Plans">
    <ActionPlansPage />
  </PageErrorBoundary>
);

export default ActionPlansPageWithErrorBoundary;