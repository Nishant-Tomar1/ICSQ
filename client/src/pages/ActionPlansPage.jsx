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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs";
import axios from "axios";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import { capitalizeFirstLetter, Server, getDepartmentName } from "../Constants";
import { useCallback } from "react";

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
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState("");
  const [hodView, setHodView] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, getCurrentDepartment } = useAuth();
  const [sentimentModal, setSentimentModal] = useState({ open: false, loading: false, data: [], sentiment: '', category: '' });
  const [activeTab, setActiveTab] = useState("Quality of work");
  const [sentimentCounts, setSentimentCounts] = useState({});
  const [clusterModal, setClusterModal] = useState({ open: false, loading: false, clusters: [], error: '' });
  const [autoClusterLoaded, setAutoClusterLoaded] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [selectedClusters, setSelectedClusters] = useState([]);
  const [assignmentModal, setAssignmentModal] = useState({ open: false, loading: false, selectedClusters: [], departmentUsers: [] });
  const [assignedPatterns, setAssignedPatterns] = useState(new Set()); // Track assigned pattern IDs
  const [responseAssignmentModal, setResponseAssignmentModal] = useState({ open: false, loading: false, selectedResponse: null, departmentUsers: [], targetDate: '' });

  // HOD View Categories
  const hodCategories = [
    "Quality of work",
    "Communication & responsiveness", 
    "Process efficiency & timelines",
    "Collaboration & support",
    "Meeting deadlines and commitments",
    "Problem resolution & issue handling"
  ];

  // Sentiment types with colors
  const sentimentTypes = [
    { type: "promoter", label: "Promoter", color: "bg-green-500", textColor: "text-green-500" },
    { type: "passive", label: "Passive", color: "bg-yellow-500", textColor: "text-yellow-500" },
    { type: "detractor", label: "Detractor", color: "bg-red-500", textColor: "text-red-500" }
  ];

  // AI Typing Effect
  const typeAI = (message, speed = 50) => {
    setAiTyping(true);
    setAiMessage('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < message.length) {
        setAiMessage(message.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setAiTyping(false);
      }
    }, speed);
  };

  const [newEntry, setNewEntry] = useState({
    departmentId: getCurrentDepartment()?._id,
    categoryId: "",
    actions: [],
    ownerId: currentUser?._id,
    targetDate: Date.now(),
    status: "pending",
  });

  const [selected, setSelected] = useState({})

  const fetchData = async () => {
    try {
      const response = await axios.get(`${Server}/action-plans`, {
        params: { departmentId: getCurrentDepartment()?._id },
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

      const expresponse = await axios.get(`${Server}/analytics/expectation-data/${getCurrentDepartment()?._id}`, {withCredentials: true})
      setExpectationData(expresponse.data)
      
      // Fetch assigned patterns for HOD view
      if (isHodView()) {
        await fetchAssignedPatterns();
      }
      
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

  // Check if user should see HOD view
  const isHodView = () => {
    return currentUser?.role === "hod";
  };

  // Mock data for sentiment responses (replace with actual API call)
  const getSentimentData = (category) => {
    // This would be replaced with actual API call
    return {
      promoter: Math.floor(Math.random() * 50) + 10,
      passive: Math.floor(Math.random() * 30) + 5,
      detractor: Math.floor(Math.random() * 60) + 20
    };
  };

  // Fetch sentiment responses
  const fetchSentimentResponses = useCallback(async (category, sentiment) => {
    setSentimentModal({ open: true, loading: true, data: [], sentiment, category });
    try {
      const res = await axios.get(`${Server}/analytics/sentiment-responses`, {
        params: { category, sentiment },
        withCredentials: true,
      });
      setSentimentModal({ open: true, loading: false, data: res.data, sentiment, category });
    } catch (error) {
      setSentimentModal({ open: true, loading: false, data: [], sentiment, category });
    }
  }, [setSentimentModal]);

  // Fetch sentiment counts for a category
  const fetchSentimentCounts = useCallback(async (category) => {
    try {
      const res = await axios.get(`${Server}/analytics/sentiment-counts`, {
        params: { category },
        withCredentials: true,
      });
      setSentimentCounts((prev) => ({ ...prev, [category]: res.data }));
    } catch (error) {
      setSentimentCounts((prev) => ({ ...prev, [category]: { promoter: 0, passive: 0, detractor: 0 } }));
    }
  }, [setSentimentCounts]);

  // Handle cluster selection
  const handleClusterSelection = (clusterId) => {
    setSelectedClusters(prev => {
      if (prev.includes(clusterId)) {
        return prev.filter(id => id !== clusterId);
      } else {
        return [...prev, clusterId];
      }
    });
  };

  // Fetch department users for assignment
  const fetchDepartmentUsers = useCallback(async () => {
    try {
      // Use the new department-specific endpoint
      const res = await axios.get(`${Server}/users/department/${getCurrentDepartment()?._id}`, {
        withCredentials: true,
      });
      console.log('Fetched department users:', res.data);
      return res.data; // Users are already filtered by department and role in backend
    } catch (error) {
      console.error('Failed to fetch department users:', error);
      
      // Fallback: try to get all users and filter by department
      try {
        const allUsersRes = await axios.get(`${Server}/users`, {
          withCredentials: true,
        });
        const departmentUsers = allUsersRes.data.filter(user => 
          user.department === getCurrentDepartment()?._id && user.role !== 'hod'
        );
        console.log('Fetched users from fallback:', departmentUsers);
        return departmentUsers;
      } catch (fallbackError) {
        console.error('Failed to fetch users from fallback endpoint:', fallbackError);
        
        // Final fallback: return mock data for testing
        return [
          { _id: '1', name: 'John Doe', email: 'john@example.com', role: 'user' },
          { _id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
          { _id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'user' }
        ];
      }
    }
  }, [getCurrentDepartment]);

  // Fetch assigned patterns
  const fetchAssignedPatterns = useCallback(async () => {
    try {
      const res = await axios.get(`${Server}/analytics/assigned-patterns`, {
        params: { departmentId: getCurrentDepartment()?._id },
        withCredentials: true,
      });
      setAssignedPatterns(new Set(res.data.map(assignment => assignment.patternId)));
    } catch (error) {
      console.error('Failed to fetch assigned patterns:', error);
      // If endpoint doesn't exist yet, we'll use empty set
      setAssignedPatterns(new Set());
    }
  }, [getCurrentDepartment]);

  // Handle assignment of clusters to users
  const handleAssignClusters = async (assignments) => {
    setAssignmentModal(prev => ({ ...prev, loading: true }));
    try {
      // Here you would implement the API call to assign clusters to users
      // For now, we'll just show a success message
      console.log('Assigning clusters:', assignments);
      
      // Update assigned patterns locally
      const newAssignedPatterns = new Set(assignedPatterns);
      assignments.forEach(assignment => {
        assignment.clusters.forEach(cluster => {
          newAssignedPatterns.add(cluster.id || cluster._id);
        });
      });
      setAssignedPatterns(newAssignedPatterns);
      
      toast({
        title: "Success",
        description: `Assigned ${assignments.length} patterns to team members`,
        variant: "informative",
      });
      
      setAssignmentModal({ open: false, loading: false, selectedClusters: [], departmentUsers: [] });
      setSelectedClusters([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign patterns to team members",
        variant: "destructive",
      });
    } finally {
      setAssignmentModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle assignment of individual responses to users
  const handleAssignResponse = async (response, userId, userName, targetDate) => {
    setResponseAssignmentModal(prev => ({ ...prev, loading: true }));
    try {
      // Here you would implement the API call to assign individual responses to users
      console.log('Assigning response:', response, 'to user:', userId, 'with target date:', targetDate);
      
      // Update assigned patterns locally
      const newAssignedPatterns = new Set(assignedPatterns);
      newAssignedPatterns.add(response._id);
      setAssignedPatterns(newAssignedPatterns);
      
      toast({
        title: "Success",
        description: `Assigned response to ${userName} with target date ${targetDate}`,
        variant: "informative",
      });
      
      setResponseAssignmentModal({ open: false, loading: false, selectedResponse: null, departmentUsers: [], targetDate: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign response to team member",
        variant: "destructive",
      });
    } finally {
      setResponseAssignmentModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Fetch counts when activeTab changes
  useEffect(() => {
    if (activeTab) fetchSentimentCounts(activeTab);
  }, [activeTab, fetchSentimentCounts]);

  // Auto-load clusters for HOD view
  useEffect(() => {
    if (isHodView() && activeTab && !autoClusterLoaded) {
      // Auto-load clusters for all categories with detractor and passive sentiment
      const autoLoadClusters = async () => {
        try {
          setAutoClusterLoaded(true);
          setClusterModal({ open: true, loading: true, clusters: [], error: '' });
          
          // Start AI typing effect
          typeAI("🤖 AI is analyzing responses across all categories...", 30);
          
          // Fetch both detractor and passive responses
          const [detractorRes, passiveRes] = await Promise.all([
            axios.get(`${Server}/analytics/clustered-responses`, {
              params: { sentiment: 'detractor' },
              withCredentials: true,
            }),
            axios.get(`${Server}/analytics/clustered-responses`, {
              params: { sentiment: 'passive' },
              withCredentials: true,
            })
          ]);
          
          console.log('Detractor clusters:', detractorRes.data);
          console.log('Passive clusters:', passiveRes.data);
          
          const allClusters = [
            ...detractorRes.data.map(cluster => ({ ...cluster, sentiment: 'detractor' })),
            ...passiveRes.data.map(cluster => ({ ...cluster, sentiment: 'passive' }))
          ];
          
          console.log('All clusters combined:', allClusters);
          
          if (allClusters.length > 0) {
            // AI completion message
            typeAI("✨ AI has identified " + allClusters.length + " key patterns requiring attention!", 40);
            
            setTimeout(() => {
              setClusterModal({ 
                open: true, 
                loading: false, 
                clusters: allClusters,
                autoLoaded: true 
              });
            }, 2000);
          } else {
            typeAI("🔍 AI found no critical patterns to cluster.", 40);
            setTimeout(() => {
              setClusterModal({ open: false, loading: false, clusters: [], error: '' });
            }, 2000);
          }
        } catch (err) {
          console.log('Auto-clustering failed:', err);
          typeAI("❌ AI encountered an error while analyzing data.", 40);
          setTimeout(() => {
            setClusterModal({ open: false, loading: false, clusters: [], error: '' });
          }, 2000);
        }
      };
      
      // Small delay to ensure page is fully loaded
      setTimeout(autoLoadClusters, 1000);
    }
  }, [isHodView, activeTab, autoClusterLoaded]);

  // HOD View Component
  const HodView = ({ activeTab, setActiveTab }) => {
    const [selectedCategoryData, setSelectedCategoryData] = useState(null);

    const handleCategoryClick = (category) => {
      setSelectedCategoryData(getSentimentData(category));
    };

    // Initialize data for the first tab
    useEffect(() => {
      handleCategoryClick(activeTab);
    }, [activeTab]);

    return (
      <div className="space-y-6">
        {/* Category Tabs */}
        <Card className="backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Expectations by Other Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex gap-4 w-full bg-transparent">
                {hodCategories.map((category, idx) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className={`
                      relative flex items-center gap-2 px-6 py-4 min-w-[180px]
                      rounded-xl shadow-md transition-all duration-200
                      font-semibold text-base
                      border-2
                      ${activeTab === category
                        ? "border-blue-500 bg-[#23263a] text-white shadow-lg"
                        : "border-gray-700 bg-[#181c2a] text-gray-300 hover:border-blue-400 hover:text-blue-200"}
                    `}
                    style={{ position: "relative" }}
                  >
                    {/* Example icon (replace with your own) */}
                    <span className="text-xl">{/* <YourIconHere /> */}</span>
                    {category}
                    {/* No badge here, since these are categories */}
                  </TabsTrigger>
                ))}
              </TabsList>
              {hodCategories.map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-4">{category} - Response Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {sentimentTypes.map((sentiment) => (
                        <div
                          key={sentiment.type}
                          className={`p-4 rounded-lg border-2 ${sentiment.color} bg-opacity-20 border-opacity-50 cursor-pointer transition-transform hover:scale-105`}
                          onClick={() => {
                            setActiveTab(category); // Ensure the tab stays on the selected category
                            fetchSentimentResponses(category, sentiment.type);
                          }}
                        >
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${sentiment.textColor}`}>
                              {(sentimentCounts[category]?.[sentiment.type] ?? 0)}
                            </div>
                            <div className="text-sm text-white">
                              {sentiment.label}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Plans Required Notice */}
                    {(() => {
                      const passive = sentimentCounts[category]?.passive ?? 0;
                      const detractor = sentimentCounts[category]?.detractor ?? 0;
                      return (passive > 0 || detractor > 0) ? (
                        <div className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                Action Plans Required
                              </h3>
                              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                <p>
                                  Passive responses: {passive} | Detractor responses: {detractor}
                                </p>
                                <p className="mt-1">
                                  Action plans are mandatory for Passive and Detractor responses to improve satisfaction.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
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
          <table className="w-full table-auto border-collapse bg-black/70">
            <thead>
              <tr className=" text-left">
                <th className="p-2 border">Department</th>
                <th className="p-2 border">User</th>
                <th className="p-2 border">Expectations</th>
              </tr>
            </thead>
            <tbody>
              {categoryData.departments.map((dept, deptIdx) =>
                dept.users.map((user, userIdx) => (
                  <tr key={`${deptIdx}-${userIdx}`} >
                    <td className="p-2 border">{capitalizeFirstLetter(dept.name)}</td>
                    <td className="p-2 border">{user.name}</td>
                    <td className="p-2 border">
                      <ul className="list-disc list-inside">
                        { user.expectations.map((exp, expIdx) => (
                          (exp)&&<li key={expIdx}>{exp}</li>
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
    <div className="min-h-screen">
      <DashboardHeader user={currentUser} />

      <main className="container mx-auto py-6 px-4">
        {/* HOD View */}
        {isHodView() ? (
          <HodView activeTab={activeTab} setActiveTab={setActiveTab} />
        ) : (
          <>
            {/* Regular View for Admin and Users */}
            {["admin", "hod"].includes(currentUser.role) && 
            <Card className="mb-6 ">
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
                    {allCategories.map((category, index) => (!category.department || (String(category.department)===String(getCurrentDepartment()?._id)))&& (
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
                </Table>
                 
              </CardContent>}
            </Card>
            }

        {expModal2 && (
                  <div
                    className="font-normal text-md fixed inset-0 z-50 flex items-center justify-center bg-black/30 bg-opacity-50"
                  >
                    <div className="bg-black/50 backdrop-blur-3xl rounded-2xl shadow-xl w-full max-w-xl relative ">
                      <Card className="shadow-none border-none">
                      <button
                        className="absolute top-2 right-2 text-gray-200 hover:text-gray-900 hover:bg-gray-300 p-3 px-4 rounded-[50px]"
                        onClick={() => {setExpModal2(false);setSelectedCategory({});}}
                      >
                        X
                      </button>
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

             
                {formModal && (
                  <div className="font-normal text-sm fixed inset-0 z-50 flex items-center justify-center bg-black/30 bg-opacity-50">
                    <div className="rounded-2xl shadow-xl w-full backdrop-blur-3xl max-w-xl relative overflow-auto max-h-[95%]">

                      <Card className="shadow-none border-none p-4 bg-black/40">
                      {/* Close Button */}
                      <button
                        className="absolute top-2 right-2 text-gray-300 hover:text-gray-900 hover:bg-gray-100 p-3 px-4 rounded-[40px]"
                        onClick={() => setFormModal(false)}
                      >
                        X
                      </button>
                        <CardHeader>
                          <CardTitle>Add Action Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleSubmitAdd}>
                            <div className="space-y-4">
                              {/* Department */}
                              <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">
                                  Department
                                </label>
                                <Input
                                  disabled
                                  name="department"
                                  value={getCurrentDepartment()?.name}
                                  placeholder="Department"
                                  required
                                />
                              </div>

                              {/* Category */}
                              <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">
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

                              {/* Actions */}
                              <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">
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
                              <label className="block text-sm font-medium text-gray-200 mb-1">
                                  Target Date
                                </label>
                              <input
                                type="date"
                                name="targetDate"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-gray-300 bg-white/10"
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
              
        <Card className="mb-6 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Action Plans -{" "}
                {capitalizeFirstLetter(getCurrentDepartment()?.name)}
              </span>
                  {["admin", "hod"].includes(currentUser?.role) && (
                    <>
                      <Button onClick={() => setFormModal(true)}>
                        Add Action Plan
                      </Button>
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
                      {capitalizeFirstLetter(getCurrentDepartment()?.name)}
                    </TableCell>
                    <TableCell>
                      {capitalizeFirstLetter(plan.category?.[0]?.name)}
                    </TableCell>
                    <TableCell>
                      {" "}
                      <span
                        onClick={() => {
                          setExpModal(true);
                          setSelected(plan);
                          console.log(plan);
                          
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
                          {expModal && (
                            <div
                              key={plan._id}
                              className="font-normal text-md fixed inset-0 z-50 flex items-center justify-center backdrop-brightness-25"
                            >
                              <div className="rounded-lg shadow-xl w-full max-w-xl relative bg-black/70">
                                <Card className="shadow-none border-none backdrop-blur-3xl backdrop-brightness-0">
                                <button
                                  className="absolute top-2 right-2 text-gray-200 hover:text-gray-900 hover:bg-gray-100 p-3 px-4 rounded-[50px]"
                                  onClick={() => {setExpModal(false);setSelected({});}}
                                >
                                  X
                                </button>
                                  <CardHeader>
                                    <CardTitle>Expectations</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <ExpectationsTable data={expectationData} categoryName={selected.category?.[0]?.name}/>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          )}
                      </TableCell>
                    )}
                    {/* Expectations Modal */}

                    {/* Actions Modal */}
                    {actionModal && (
                      <div
                        key={plan._id}
                        className="font-normal text-md fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                      >
                        <div className=" rounded-2xl shadow-xl w-full max-w-xl relative bg-white/10">
                          <Card className="shadow-none border-none">
                          <button
                            className="absolute top-2 right-2 text-gray-200 hover:text-gray-900 hover:bg-gray-100 p-3 px-4 rounded-[50px]"
                            onClick={() => {setActionModal(false);setSelected({})}}
                          >
                            X
                          </button>
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
        </>
        )}

        {/* Modals */}
        {expModal2 && (
          <div
            className="font-normal text-md fixed inset-0 z-50 flex items-center justify-center bg-black/30 bg-opacity-50"
          >
            <div className="bg-black/50 backdrop-blur-3xl rounded-2xl shadow-xl w-full max-w-xl relative ">
              <Card className="shadow-none border-none">
              <button
                className="absolute top-2 right-2 text-gray-200 hover:text-gray-900 hover:bg-gray-300 p-3 px-4 rounded-[50px]"
                onClick={() => {setExpModal2(false);setSelectedCategory({});}}
              >
                X
              </button>
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

        {formModal && (
          <div className="font-normal text-sm fixed inset-0 z-50 flex items-center justify-center bg-black/30 bg-opacity-50">
            <div className="rounded-2xl shadow-xl w-full backdrop-blur-3xl max-w-xl relative overflow-auto max-h-[95%]">

              <Card className="shadow-none border-none p-4 bg-black/40">
              {/* Close Button */}
              <button
                className="absolute top-2 right-2 text-gray-300 hover:text-gray-900 hover:bg-gray-100 p-3 px-4 rounded-[40px]"
                onClick={() => setFormModal(false)}
              >
                X
              </button>
                <CardHeader>
                  <CardTitle>Add Action Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitAdd}>
                    <div className="space-y-4">
                      {/* Department */}
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                          Department
                        </label>
                        <Input
                          disabled
                          name="department"
                          value={getCurrentDepartment()?.name}
                          placeholder="Department"
                          required
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
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

                      {/* Actions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
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
                      <label className="block text-sm font-medium text-gray-200 mb-1">
                          Target Date
                        </label>
                    <input
                      type="date"
                      name="targetDate"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-gray-300 bg-white/10"
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
      </main>

      {/* Sentiment Modal */}
      {sentimentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] relative border border-cyan-500/30 backdrop-blur-xl overflow-hidden">
            {/* Glowing Border Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-xl"></div>
            
            <div className="relative z-10 h-full flex flex-col">
              {/* Header */}
              <div className="p-6 pb-4 flex-shrink-0 border-b border-cyan-500/30">
                <button
                  className="absolute top-4 right-4 text-cyan-300 hover:text-white hover:bg-cyan-500/20 p-2 rounded-full transition-all duration-300 border border-cyan-500/30"
                  onClick={() => setSentimentModal({ ...sentimentModal, open: false })}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {capitalizeFirstLetter(sentimentModal.sentiment)} Responses for "{sentimentModal.category}"
                    </h2>
                    <p className="text-cyan-200 text-sm mt-1">
                      {sentimentModal.data.length} responses found • Click on any row to assign to team members
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 mr-12">
                    <Button
                      variant="outline"
                      className="relative group bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/50 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400 transition-all duration-300 hover:scale-105"
                      onClick={async () => {
                        setClusterModal({ open: true, loading: true, clusters: [] });
                        typeAI("🤖 AI is analyzing patterns in this category...", 30);
                        try {
                          const res = await axios.get(`${Server}/analytics/clustered-responses`, {
                            params: { category: sentimentModal.category, sentiment: sentimentModal.sentiment },
                            withCredentials: true,
                          });
                          typeAI("✨ AI found " + res.data.length + " patterns in this category!", 40);
                          setTimeout(() => {
                            setClusterModal({ open: true, loading: false, clusters: res.data });
                          }, 2000);
                        } catch (err) {
                          typeAI("❌ AI encountered an error while analyzing.", 40);
                          setTimeout(() => {
                            setClusterModal({ open: true, loading: false, clusters: [], error: 'Failed to fetch clusters' });
                          }, 2000);
                        }
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        Cluster This Category
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      className="relative group bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/50 text-green-300 hover:bg-green-500/20 hover:border-green-400 transition-all duration-300 hover:scale-105"
                      onClick={async () => {
                        setClusterModal({ open: true, loading: true, clusters: [] });
                        typeAI("🤖 AI is analyzing patterns across all categories...", 30);
                        try {
                          const res = await axios.get(`${Server}/analytics/clustered-responses`, {
                            params: { sentiment: sentimentModal.sentiment },
                            withCredentials: true,
                          });
                          typeAI("✨ AI found " + res.data.length + " patterns across all categories!", 40);
                          setTimeout(() => {
                            setClusterModal({ open: true, loading: false, clusters: res.data });
                          }, 2000);
                        } catch (err) {
                          typeAI("❌ AI encountered an error while analyzing.", 40);
                          setTimeout(() => {
                            setClusterModal({ open: true, loading: false, clusters: [], error: 'Failed to fetch clusters' });
                          }, 2000);
                        }
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        Cluster All Categories
                      </span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                {sentimentModal.loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                      <div className="text-cyan-300">Loading responses...</div>
                    </div>
                  </div>
                ) : sentimentModal.data.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <div className="text-4xl mb-2">📊</div>
                      <div className="font-mono">No responses found for this category and sentiment.</div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-auto">
                    <div className="p-6">
                      <table className="w-full text-sm text-left text-gray-200 border-collapse">
                        <thead className="sticky top-0 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm border-b border-cyan-500/30">
                          <tr>
                            <th className="px-4 py-3 text-cyan-200 font-semibold text-xs uppercase tracking-wider">Department</th>
                            <th className="px-4 py-3 text-cyan-200 font-semibold text-xs uppercase tracking-wider">User</th>
                            <th className="px-4 py-3 text-cyan-200 font-semibold text-xs uppercase tracking-wider">Rating</th>
                            <th className="px-4 py-3 text-cyan-200 font-semibold text-xs uppercase tracking-wider">Expectations</th>
                            <th className="px-4 py-3 text-cyan-200 font-semibold text-xs uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-cyan-200 font-semibold text-xs uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-cyan-200 font-semibold text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                          {sentimentModal.data.map((resp, index) => {
                            const isAssigned = assignedPatterns.has(resp._id);
                            return (
                              <tr 
                                key={resp._id} 
                                className={`group hover:bg-gradient-to-r hover:from-cyan-900/20 hover:to-blue-900/20 transition-all duration-200 cursor-pointer ${
                                  isAssigned ? 'bg-green-900/10 border-l-4 border-green-500' : 'hover:border-l-4 hover:border-cyan-500'
                                }`}
                                onClick={() => {
                                  // TODO: Open assignment modal for this specific response
                                  console.log('Assigning response:', resp);
                                }}
                              >
                                <td className="px-4 py-4">
                                  <div className="font-medium text-white">
                                    {resp.fromDepartmentName ? resp.fromDepartmentName.split(' ').map(word => 
                                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                    ).join(' ') : '-'}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-semibold">
                                        {resp.userName ? resp.userName.charAt(0).toUpperCase() : '?'}
                                      </span>
                                    </div>
                                    <span className="text-gray-200">{resp.userName || '-'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                      resp.rating >= 80 ? 'bg-green-400' : 
                                      resp.rating >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                                    }`}></div>
                                    <span className={`font-semibold ${
                                      resp.rating >= 80 ? 'text-green-400' : 
                                      resp.rating >= 60 ? 'text-yellow-400' : 'text-red-400'
                                    }`}>
                                      {resp.rating}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="max-w-xs">
                                    <span className="text-gray-300">
                                      {resp.expectations || '-'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="text-gray-400 text-sm">
                                    {resp.date ? new Date(resp.date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    }) : '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  {isAssigned ? (
                                    <Badge variant="outline" className="text-xs text-green-400 border-green-400 bg-green-900/20">
                                      ✓ Assigned
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs text-red-400 border-red-400 bg-red-900/20">
                                      ⏳ Pending
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-4 py-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-cyan-900/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 text-xs"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const users = await fetchDepartmentUsers();
                                      setResponseAssignmentModal({
                                        open: true,
                                        loading: false,
                                        selectedResponse: resp,
                                        departmentUsers: users,
                                        targetDate: ''
                                      });
                                    }}
                                  >
                                    Assign
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cluster Modal */}
      {clusterModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] relative border border-cyan-500/30 backdrop-blur-xl overflow-hidden">
            {/* Neural Network Background Animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20"></div>
              <div className="absolute top-0 left-0 w-full h-full">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 2}s`
                    }}
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Glowing Border Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-xl"></div>
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="p-8 pb-4 flex-shrink-0">
                <button
                  className="absolute top-4 right-4 text-cyan-300 hover:text-white hover:bg-cyan-500/20 p-2 rounded-full transition-all duration-300 border border-cyan-500/30"
                  onClick={() => setClusterModal({ open: false, loading: false, clusters: [], error: '' })}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              
                {/* AI Header with Typing Effect */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-white text-sm">🤖</span>
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {clusterModal.autoLoaded 
                        ? "AI-Powered Pattern Analysis" 
                        : "AI-Suggested Clusters"
                      }
                    </h2>
                  </div>
                  
                  {/* AI Typing Effect */}
                  {aiTyping && (
                    <div className="text-cyan-300 text-sm font-mono">
                      {aiMessage}
                      <span className="animate-pulse">|</span>
                    </div>
                  )}

                  {/* Assignment Controls */}
                  {clusterModal.clusters.length > 0 && isHodView() && (
                    <div className="flex items-center justify-between mt-4 p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-cyan-500/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        <span className="text-cyan-200 text-sm font-semibold">
                          Select patterns to assign to team members
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-green-900/20 border-green-500/50 text-green-300 hover:bg-green-500/20"
                          onClick={() => setSelectedClusters(clusterModal.clusters.map((_, idx) => idx))}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-900/20 border-red-500/50 text-red-300 hover:bg-red-500/20"
                          onClick={() => setSelectedClusters([])}
                        >
                          Clear All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-blue-900/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/20"
                          disabled={selectedClusters.length === 0}
                          onClick={async () => {
                            console.log('Opening assignment modal...');
                            const users = await fetchDepartmentUsers();
                            console.log('Users for assignment:', users);
                            setAssignmentModal({
                              open: true,
                              loading: false,
                              selectedClusters: selectedClusters.map(idx => clusterModal.clusters[idx]),
                              departmentUsers: users
                            });
                          }}
                        >
                          Assign Selected ({selectedClusters.length})
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {clusterModal.autoLoaded && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      <span className="text-cyan-200 text-sm font-semibold">AI Analysis Complete</span>
                    </div>
                    <p className="text-cyan-100 text-sm">
                      Advanced AI has identified critical patterns across all categories requiring immediate attention.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto px-8 pb-8 min-h-0">
                {clusterModal.loading ? (
                  <div className="text-center py-12">
                    <div className="relative">
                      {/* Neural Network Loading Animation */}
                      <div className="w-16 h-16 mx-auto mb-4 relative">
                        <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-2 border-blue-500/30 rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
                        <div className="absolute inset-4 border-2 border-purple-500/30 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <div className="text-cyan-300 font-mono text-sm">AI is analyzing patterns...</div>
                    </div>
                  </div>
                ) : clusterModal.error ? (
                  <div className="text-center text-red-400 py-8">
                    <div className="text-4xl mb-2">⚠️</div>
                    <div className="font-mono">{clusterModal.error}</div>
                  </div>
                ) : clusterModal.clusters.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-4xl mb-2">🔍</div>
                    <div className="font-mono">No patterns detected by AI</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
                    {clusterModal.clusters
                      .filter((cluster, idx) => {
                        // For AI cluster modal, filter out already assigned patterns
                        const clusterId = cluster.id || cluster._id || `cluster-${idx}`;
                        return !assignedPatterns.has(clusterId);
                      })
                      .map((cluster, idx) => (
                      <div key={idx} className={`
                        relative group p-6 rounded-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105
                        ${cluster.sentiment === 'detractor' 
                          ? 'bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-500/40 hover:border-red-400/60' 
                          : cluster.sentiment === 'passive'
                          ? 'bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/40 hover:border-yellow-400/60'
                          : 'bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-500/40 hover:border-blue-400/60'
                        }
                        ${selectedClusters.includes(idx) ? 'ring-2 ring-cyan-400 ring-opacity-50' : ''}
                      `}>
                        {/* Glow Effect on Hover */}
                        <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl ${
                          cluster.sentiment === 'detractor' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                        }`}></div>
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                cluster.sentiment === 'detractor' ? 'bg-red-400 animate-pulse' : 'bg-yellow-400 animate-pulse'
                              }`}></div>
                              <span className="text-cyan-200 font-semibold">Pattern #{idx + 1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isHodView() && (
                                <input
                                  type="checkbox"
                                  checked={selectedClusters.includes(idx)}
                                  onChange={() => handleClusterSelection(idx)}
                                  className="w-4 h-4 text-cyan-500 bg-gray-800 border-cyan-500 rounded focus:ring-cyan-500 focus:ring-2"
                                />
                              )}
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs border-cyan-500/50 text-white">
                                  {cluster.category || 'Unknown Category'}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    cluster.sentiment === 'detractor' 
                                      ? 'text-red-400 border-red-400 bg-red-900/20' 
                                      : 'text-yellow-400 border-yellow-400 bg-yellow-900/20'
                                  }`}
                                >
                                  {cluster.sentiment}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-white text-base mb-4 font-medium leading-relaxed">
                            "{cluster.representative}"
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-cyan-300 text-sm font-semibold">📊 Related Responses:</div>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {cluster.responses.map((resp, rIdx) => (
                                <div key={rIdx} className="text-gray-300 text-sm p-2 bg-black/20 rounded border-l-2 border-cyan-500/30">
                                  <span className="text-cyan-200 font-medium">{resp.user}</span>
                                  {resp.category && resp.category !== cluster.category && (
                                    <span className="text-green-400 text-xs ml-1">({resp.category})</span>
                                  )}
                                  <span className="text-gray-400">: </span>
                                  <span className="text-gray-200">{resp.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {assignmentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] rounded-2xl shadow-2xl w-full max-w-4xl h-[95vh] relative border border-cyan-500/30 backdrop-blur-xl overflow-hidden">
            <button
              className="absolute top-4 right-4 text-cyan-300 hover:text-white hover:bg-cyan-500/20 p-2 rounded-full transition-all duration-300 border border-cyan-500/30 z-10"
              onClick={() => setAssignmentModal({ open: false, loading: false, selectedClusters: [], departmentUsers: [] })}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="h-full flex flex-col">
              <div className="p-8 pb-4 flex-shrink-0">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    Assign Patterns to Team Members
                  </h2>
                  <p className="text-cyan-200 text-sm">
                    Select team members to assign the selected patterns for action planning.
                  </p>
                </div>
              </div>

              {assignmentModal.loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
                    <p className="text-cyan-300 mt-2">Assigning patterns...</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-8 pb-8 min-h-0">
                  <div className="space-y-6">
                    {/* Selected Patterns Summary */}
                    <div className="p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-cyan-500/30 rounded-xl">
                      <h3 className="text-cyan-200 font-semibold mb-3">Selected Patterns ({assignmentModal.selectedClusters.length})</h3>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {assignmentModal.selectedClusters.map((cluster, idx) => (
                          <div key={idx} className="text-sm text-gray-300 p-2 bg-black/20 rounded border-l-2 border-cyan-500/30">
                            <span className="text-cyan-200 font-medium">Pattern #{idx + 1}</span>
                            <span className="text-gray-400">: </span>
                            <span className="text-gray-200">{cluster.representative.substring(0, 80)}...</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Team Members */}
                    <div>
                      <h3 className="text-cyan-200 font-semibold mb-3">
                        Team Members ({assignmentModal.departmentUsers.length})
                      </h3>
                      
                      {/* Debug info */}
                      {assignmentModal.departmentUsers.length === 0 && (
                        <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg mb-3">
                          <p className="text-yellow-200 text-sm">
                            No team members found. This might be due to:
                          </p>
                          <ul className="text-yellow-300 text-xs mt-1 list-disc list-inside">
                            <li>No users in your department</li>
                            <li>API endpoint not available</li>
                            <li>Network connectivity issues</li>
                          </ul>
                        </div>
                      )}
                      
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {assignmentModal.departmentUsers.map((user) => (
                          <div key={user._id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-white font-medium">{user.name}</div>
                                <div className="text-gray-400 text-sm">{user.email}</div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-cyan-900/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20"
                              onClick={() => {
                                // Here you would implement the actual assignment logic
                                handleAssignClusters([{
                                  userId: user._id,
                                  userName: user.name,
                                  clusters: assignmentModal.selectedClusters
                                }]);
                              }}
                            >
                              Assign All Patterns
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bulk Assignment */}
                    <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl">
                      <h3 className="text-green-200 font-semibold mb-2">Bulk Assignment</h3>
                      <p className="text-green-300 text-sm mb-3">
                        Assign all selected patterns to multiple team members at once.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {assignmentModal.departmentUsers.map((user) => (
                          <Button
                            key={user._id}
                            variant="outline"
                            size="sm"
                            className="bg-green-900/20 border-green-500/50 text-green-300 hover:bg-green-500/20"
                            onClick={() => {
                              handleAssignClusters([{
                                userId: user._id,
                                userName: user.name,
                                clusters: assignmentModal.selectedClusters
                              }]);
                            }}
                          >
                            {user.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Response Assignment Modal */}
      {responseAssignmentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] rounded-2xl shadow-2xl w-full max-w-2xl relative border border-cyan-500/30 backdrop-blur-xl overflow-hidden">
            {/* Glowing Border Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-xl"></div>
            
            <div className="relative z-10 p-6">
              <button
                className="absolute top-4 right-4 text-cyan-300 hover:text-white hover:bg-cyan-500/20 p-2 rounded-full transition-all duration-300 border border-cyan-500/30"
                onClick={() => setResponseAssignmentModal({ open: false, loading: false, selectedResponse: null, departmentUsers: [], targetDate: '' })}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  Assign Response to Team Member
                </h2>
                <p className="text-cyan-200 text-sm">
                  Select a team member and set a target date for this response.
                </p>
              </div>

              {responseAssignmentModal.loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-cyan-300">Assigning response...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Response Summary */}
                  {responseAssignmentModal.selectedResponse && (
                    <div className="p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-cyan-500/30 rounded-xl">
                      <h3 className="text-cyan-200 font-semibold mb-3">Response Details</h3>
                      <div className="space-y-2 text-sm text-gray-300">
                        <div><span className="text-cyan-200">Department:</span> {responseAssignmentModal.selectedResponse.fromDepartmentName}</div>
                        <div><span className="text-cyan-200">User:</span> {responseAssignmentModal.selectedResponse.userName}</div>
                        <div><span className="text-cyan-200">Rating:</span> {responseAssignmentModal.selectedResponse.rating}</div>
                        <div><span className="text-cyan-200">Expectations:</span> {responseAssignmentModal.selectedResponse.expectations || '-'}</div>
                      </div>
                    </div>
                  )}

                  {/* Target Date */}
                  <div>
                    <label className="block text-cyan-200 font-semibold mb-2">Target Date</label>
                    <input
                      type="date"
                      value={responseAssignmentModal.targetDate}
                      onChange={(e) => setResponseAssignmentModal(prev => ({ ...prev, targetDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 bg-black/20 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  {/* Team Members */}
                  <div>
                    <h3 className="text-cyan-200 font-semibold mb-3">
                      Team Members ({responseAssignmentModal.departmentUsers.length})
                    </h3>
                    
                    {responseAssignmentModal.departmentUsers.length === 0 && (
                      <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg mb-3">
                        <p className="text-yellow-200 text-sm">
                          No team members found. This might be due to:
                        </p>
                        <ul className="text-yellow-300 text-xs mt-1 list-disc list-inside">
                          <li>No users in your department</li>
                          <li>API endpoint not available</li>
                          <li>Network connectivity issues</li>
                        </ul>
                      </div>
                    )}
                    
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {responseAssignmentModal.departmentUsers.map((user) => (
                        <div key={user._id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-white font-medium">{user.name}</div>
                              <div className="text-gray-400 text-sm">{user.email}</div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-cyan-900/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20"
                            disabled={!responseAssignmentModal.targetDate}
                            onClick={() => {
                              handleAssignResponse(
                                responseAssignmentModal.selectedResponse,
                                user._id,
                                user.name,
                                responseAssignmentModal.targetDate
                              );
                            }}
                          >
                            Assign Response
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ActionPlansPage;