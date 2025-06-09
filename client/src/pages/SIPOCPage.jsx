import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import DashboardHeader from "../components/DashboardHeader"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table"
import axios from "axios"
import { capitalizeFirstLetter, Server } from "../Constants"
import { FaPlus, FaTrash, FaEdit, FaCheckCircle, FaMapMarkedAlt, FaBan } from "react-icons/fa"

function SIPOCPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState([false, ""])
  const [isEditing, setIsEditing] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [sipocEntries, setSipocEntries] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [imageModal, setImageModal] = useState({ open: false, src: "" })
  const [sortedEntries, setSortedEntries] = useState({
    surveyed: [],
    mapped: [],
    notEligible: []
  })
  const [newEntry, setNewEntry] = useState({
    supplier: "",
    input: "",
    process: {
      input: "",
      file: ""
    },
    output: "",
    customer: "",
  })
  const { toast } = useToast()
  const { currentUser } = useAuth()

  const sortEntries = (entries) => {
    const sorted = {
      surveyed: [],
      mapped: [],
      notEligible: []
    };

    entries.forEach(entry => {
      if (entry.isSurveyed) {
        sorted.surveyed.push(entry);
      } else if (entry.isMapped) {
        sorted.mapped.push(entry);
      } else {
        sorted.notEligible.push(entry);
      }
    });

    setSortedEntries(sorted);
  };

  const fetchData = async () => {
    try {
      if (currentUser?.department?._id) {
        try {
          const response = await axios.get(`${Server}/sipoc?departmentId=${currentUser.department._id}`, {
            withCredentials: true,
          });
          setSipocEntries(response.data || []);
          sortEntries(response.data || []);
        } catch (error) {
          if (error.response?.status === 404) {
            setSipocEntries([]);
            setSortedEntries({ surveyed: [], mapped: [], notEligible: [] });
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load SIPOC data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData()
  }, [currentUser])

  const handleInputChange = (field, value) => {
    setNewEntry((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setNewEntry({
      supplier: entry.entries.supplier,
      input: entry.entries.input,
      process: {
        input: entry.entries.process.input,
        file: entry.entries.process.file
      },
      output: entry.entries.output,
      customer: entry.entries.customer,
    });
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleAddOrUpdateEntry = async (e) => {
    e.preventDefault();
    if (!Object.values(newEntry).every((value) => typeof value === 'string' ? value.trim() : true)) {
      toast({
        title: "Incomplete Entry",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const fileInput = document.getElementById("processPicture");
    const file = fileInput?.files[0];

    try {
      setIsAdding(true);
      const formData = new FormData();
      formData.append('departmentId', currentUser?.department?._id);
      formData.append('entries', JSON.stringify(newEntry));
      if (file) {
        formData.append('processPicture', file);
      }

      if (isEditing && editingEntry) {
        // Update existing entry
        await axios.put(`${Server}/sipoc/${editingEntry._id}`, formData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast({
          title: "Success",
          description: "SIPOC entry has been updated",
        });
      } else {
        // Add new entry
        const res = await axios.post(`${Server}/sipoc`, formData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (res.status === 200) {
          toast({
            title: "Success",
            description: "New SIPOC entry has been added",
          });
        }
      }

      setNewEntry({
        supplier: "",
        input: "",
        process: {
          input: "",
          file: ""
        },
        output: "",
        customer: "",
      });
      setIsEditing(false);
      setEditingEntry(null);
      fetchData();
    } catch (error) {
      toast({
        title: isEditing ? "Failed to Update Entry" : "Failed to Add Entry",
        variant: "destructive",
        description: error?.response?.data?.message || "Something went wrong! Try Again",
      });
    } finally {
      setModalOpen(false);
      setIsAdding(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    setIsDeleting([true, id])
    try {
      await axios.delete(`${Server}/sipoc?id=${id}`, { withCredentials: true })
      toast({
        title: "Entry Deleted",
        description: "SIPOC entry has been removed",
      })
      fetchData()
    } catch (error) {
      toast({
        title: "Failed to delete SIPOC",
        type: "destructive",
        description: "Something went wrong! Try Again",
      })
    } finally {
      setIsDeleting([false, ""])
    }
  }

  const renderTable = (entries, title, icon, colorClass) => {
    if (entries.length === 0) return null;

    return (
      <div className="mb-8">
        {/* <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className={`text-lg font-semibold ${colorClass}`}>{title}</h3>
        </div> */}
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[900px] w-full bg-black/20">
            <TableHeader>
              <TableRow className="bg-[#29252c]/50 border-b-2 border-gray-300/70 overflow-auto">
                <TableHead className="text-gray-200 font-bold text-base py-5 px-2 tracking-wide min-w-[160px]">Supplier</TableHead>
                <TableHead className="text-gray-200 font-bold text-base py-5 px-2 tracking-wide min-w-[160px]">Input</TableHead>
                <TableHead className="text-gray-200 font-bold text-base py-5 px-2 tracking-wide min-w-[220px]">Process</TableHead>
                <TableHead className="text-gray-200 font-bold text-base py-5 px-2 tracking-wide min-w-[160px]">Output</TableHead>
                <TableHead className="text-gray-200 font-bold text-base py-5 px-2 tracking-wide min-w-[160px]">Customer</TableHead>
                {(["admin", "manager"].includes(currentUser?.role)) && (
                  <TableHead className="w-[140px] text-gray-200 font-bold text-center py-5 px-2 min-w-[120px]">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow
                  key={index}
                  className={`border-b-2 border-gray-200/70 transition-all duration-200 group
                    ${index % 2 === 0 ? 'bg-[#83725E]/5' : 'bg-white/5'}
                  `}
                >
                  <TableCell className="text-gray-200 align-top p-2 sm:p-4 max-w-[200px] transition-all duration-200">
                    <div className="space-y-1.5 break-words">
                      {entry?.entries?.supplier.split('\n').map((line, i) => (
                        <div key={i} className="leading-relaxed whitespace-pre-wrap text-[14px] group-hover:font-medium transition-all">
                          {line.trim().match(/^\d+\./) ? (
                            <span>
                              <span className="text-[#93725E] group-hover:font-semibold">{line.split('.')[0]}.</span>
                              {line.split('.').slice(1).join('.')}
                            </span>
                          ) : line.trim() && (
                            <span>
                              <span className="text-[#93725E] group-hover:font-semibold">{i + 1}.</span> {line}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-200 align-top p-2 sm:p-4 max-w-[200px] transition-all duration-200">
                    <div className="space-y-1.5 break-words">
                      {entry?.entries?.input.split('\n').map((line, i) => (
                        <div key={i} className="leading-relaxed whitespace-pre-wrap text-[14px] group-hover:font-medium transition-all">
                          {line.trim().match(/^\d+\./) ? (
                            <span>
                              <span className="text-[#93725E] group-hover:font-semibold">{line.split('.')[0]}.</span>
                              {line.split('.').slice(1).join('.')}
                            </span>
                          ) : line.trim() && (
                            <span>
                              <span className="text-[#93725E] group-hover:font-semibold">{i + 1}.</span> {line}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-200 align-top p-2 sm:p-4 max-w-[300px] transition-all duration-200">
                    <div className="space-y-1.5 break-words">
                      {entry?.entries?.process?.input.split('\n').map((line, i) => (
                        <div key={i} className="leading-relaxed whitespace-pre-wrap text-[14px] group-hover:font-medium transition-all">
                          {line.trim().match(/^\d+\./) ? (
                            <span>
                              <span className="text-[#93725E] group-hover:font-semibold">{line.split('.')[0]}.</span>
                              {line.split('.').slice(1).join('.')}
                            </span>
                          ) : line.trim() && (
                            <span>
                              <span className="text-[#93725E] group-hover:font-semibold">{i + 1}.</span> {line}
                            </span>
                          )}
                        </div>
                      ))}
                      {entry?.entries?.process?.file && (
                        <button
                          className="text-[#93725E] hover:text-[goldenrod] underline transition-colors text-xs mt-3 hover:scale-[1.02] transform duration-200 flex items-center gap-1.5 group-hover:font-medium"
                          onClick={() => setImageModal({ open: true, src: entry?.entries?.process?.file })}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          View Process Diagram
                        </button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-200 align-top p-2 sm:p-4 max-w-[200px] transition-all duration-200">
                    <div className="space-y-1.5 break-words">
                      {entry?.entries?.output.split('\n').map((line, i) => (
                        <div key={i} className="leading-relaxed whitespace-pre-wrap text-[14px] group-hover:font-medium transition-all">
                          {line.trim().match(/^\d+\./) ? (
                            <span>
                              <span className="text-[#93725E] group-hover:font-semibold">{line.split('.')[0]}.</span>
                              {line.split('.').slice(1).join('.')}
                            </span>
                          ) : line.trim() && (
                            <span>
                              <span className="text-[#93725E] group-hover:font-semibold">{i + 1}.</span> {line}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-200 align-top p-2 sm:p-4 max-w-[200px] transition-all duration-200">
                    <div className="space-y-1.5 break-words">
                      {entry?.entries?.customer.split('\n').map((line, i) => (
                        <div key={i} className="leading-relaxed whitespace-pre-wrap text-[14px] group-hover:font-medium transition-all">
                          {line.trim().match(/^\d+\./) ? (
                            <span>
                              <span className="text-[#93725E] group-hover:font-semibold">{line.split('.')[0]}.</span>
                              {line.split('.').slice(1).join('.')}
                            </span>
                          ) : line.trim() && (
                            <span>
                              <span className="text-[#93725E] group-hover:font-semibold">{i + 1}.</span> {line}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  {(["admin", "manager"].includes(currentUser?.role)) && (
                    <TableCell className="align-top transition-all duration-200 p-2 sm:p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 transition-all duration-200 hover:scale-110"
                          onClick={() => handleEditEntry(entry)}
                        >
                          <FaEdit className="w-4 h-4" />
                        </Button>
                        {!(isDeleting[1] === entry._id) ? (
                          <Button
                            variant="ghost"
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all duration-200 hover:scale-110"
                            onClick={() => handleDeleteEntry(entry._id)}
                          >
                            <FaTrash className="w-4 h-4" />
                          </Button>
                        ) : (
                          <div className="flex items-center justify-center w-9 h-9">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#83725E]"></div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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

  return (
    <div className="min-h-screen">
      <DashboardHeader user={currentUser} />

      <main className="container mx-auto py-6 px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>SIPOC Management - {capitalizeFirstLetter(currentUser?.department?.name)}</span>
              {(["admin", "manager"].includes(currentUser?.role)) && (
                <Button onClick={() => { setModalOpen(true) }} disabled={isLoading}>
                  <FaPlus className="mr-2" />
                  Add Entry
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 mb-4">
              SIPOC (Supplier, Input, Process, Output, Customer) is a tool that summarizes the inputs and outputs of one
              or more processes in table form. It is used to define a business process before work begins.
            </p>

            {renderTable(
              sortedEntries.surveyed,
              "Surveyed Departments",
              <FaCheckCircle className="text-green-500 w-5 h-5" />,
              "text-green-400"
            )}

            {renderTable(
              sortedEntries.mapped,
              "Mapped Departments",
              <FaMapMarkedAlt className="text-blue-500 w-5 h-5" />,
              "text-blue-400"
            )}

            {renderTable(
              sortedEntries.notEligible,
              "Not Eligible Departments",
              <FaBan className="text-red-500 w-5 h-5" />,
              "text-red-400"
            )}

            {Object.values(sortedEntries).every(arr => arr.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                No SIPOC entries found. Click the "Add Entry" button to create one.
              </div>
            )}

            

            {imageModal.open && (
              <div className="fixed inset-0 bg-black/10 backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50">
                <div className=" rounded-lg p-4 max-w-3xl w-full bg-black/30">
                  <h3 className="text-lg font-semibold mb-4">Process Image</h3>
                  <img src={imageModal.src} alt="Process" className="w-full max-h-[60vh] object-contain" />
                  <div className="mt-4 text-right">
                    <button onClick={() => setImageModal({ open: false, src: "" })} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Close</button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Add/Edit Entry Modal */}
        {modalOpen && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-lg bg-opacity-40 flex justify-center items-center z-50 px-3 animate-fadeIn max-w-screen h-screen">
                <div className="rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto relative bg-gradient-to-b from-[#1c1c1e] to-[#2a2a2d] text-white transform transition-all duration-300 ease-out animate-slideUp z-[1000]">
                  {/* Header */}
                  <div className="sticky top-0 bg-gradient-to-b from-[#1c1c1e] to-[#1c1c1e]/95 px-4 py-3 border-b border-gray-700/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold bg-gradient-to-r from-amber-200 to-amber-600 bg-clip-text text-transparent">
                        {isEditing ? "Edit SIPOC Entry" : "Add New SIPOC Entry"}
                      </h2>
                      <button
                        onClick={() => {
                          setModalOpen(false);
                          setIsEditing(false);
                          setEditingEntry(null);
                          setNewEntry({
                            supplier: "",
                            input: "",
                            process: {
                              input: "",
                              file: ""
                            },
                            output: "",
                            customer: "",
                          });
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {isEditing && (
                      <p className="mt-1.5 text-xs text-gray-400">
                        Editing entry created on {new Date(editingEntry.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleAddOrUpdateEntry} className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Left Column */}
                      <div className="space-y-4">
                        {/* Supplier */}
                        <div className="form-group">
                          <label className="block text-xs font-medium mb-1.5 text-amber-300">
                            Supplier <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            placeholder="Enter suppliers (one per line)..."
                            value={newEntry.supplier}
                            onChange={(e) => handleInputChange("supplier", e.target.value)}
                            className="w-full bg-[#2a2a2d]/50 border border-gray-600/50 p-2 rounded-md text-sm text-white placeholder-gray-500
                              focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 focus:outline-none
                              transition-all duration-200"
                            rows={3}
                          />
                        </div>

                        {/* Input */}
                        <div className="form-group">
                          <label className="block text-xs font-medium mb-1.5 text-amber-300">
                            Input <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            placeholder="Enter inputs (one per line)..."
                            value={newEntry.input}
                            onChange={(e) => handleInputChange("input", e.target.value)}
                            className="w-full bg-[#2a2a2d]/50 border border-gray-600/50 p-2 rounded-md text-sm text-white placeholder-gray-500
                              focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 focus:outline-none
                              transition-all duration-200"
                            rows={3}
                          />
                        </div>

                        {/* Process */}
                        <div className="form-group">
                          <label className="block text-xs font-medium mb-1.5 text-amber-300">
                            Process <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            placeholder="Enter process steps (one per line)..."
                            value={newEntry.process.input}
                            onChange={(e) => handleInputChange("process", e.target.value)}
                            className="w-full bg-[#2a2a2d]/50 border border-gray-600/50 p-2 rounded-md text-sm text-white placeholder-gray-500
                              focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 focus:outline-none
                              transition-all duration-200"
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        {/* Output */}
                        <div className="form-group">
                          <label className="block text-xs font-medium mb-1.5 text-amber-300">
                            Output <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            placeholder="Enter outputs (one per line)..."
                            value={newEntry.output}
                            onChange={(e) => handleInputChange("output", e.target.value)}
                            className="w-full bg-[#2a2a2d]/50 border border-gray-600/50 p-2 rounded-md text-sm text-white placeholder-gray-500
                              focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 focus:outline-none
                              transition-all duration-200"
                            rows={3}
                          />
                        </div>

                        {/* Customer */}
                        <div className="form-group">
                          <label className="block text-xs font-medium mb-1.5 text-amber-300">
                            Customer <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            placeholder="Enter customers (one per line)..."
                            value={newEntry.customer}
                            onChange={(e) => handleInputChange("customer", e.target.value)}
                            className="w-full bg-[#2a2a2d]/50 border border-gray-600/50 p-2 rounded-md text-sm text-white placeholder-gray-500
                              focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 focus:outline-none
                              transition-all duration-200"
                            rows={3}
                          />
                        </div>

                        {/* Process Diagram */}
                        <div className="form-group">
                          <label className="block text-xs font-medium mb-1.5 text-amber-300">
                            Process Diagram
                          </label>
                          <div className="space-y-2">
                            {isEditing && editingEntry?.entries?.process?.file && (
                              <div className="p-2 bg-[#2a2a2d]/30 rounded-md border border-gray-600/30">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400">Current Image:</span>
                                  <button
                                    type="button"
                                    onClick={() => setImageModal({ open: true, src: editingEntry.entries.process.file })}
                                    className="text-amber-400 hover:text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View Image
                                  </button>
                                </div>
                              </div>
                            )}
                            <div className="relative">
                              <input
                                id="processPicture"
                                type="file"
                                accept="image/*"
                                className="block w-full text-sm text-gray-400
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-medium
                                  file:bg-amber-500/10 file:text-amber-400
                                  hover:file:bg-amber-500/20
                                  cursor-pointer
                                  transition-all duration-200"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                {isEditing ? "Upload a new image to replace the current one" : "Upload an image for the process diagram"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setModalOpen(false);
                          setIsEditing(false);
                          setEditingEntry(null);
                          setNewEntry({
                            supplier: "",
                            input: "",
                            process: {
                              input: "",
                              file: ""
                            },
                            output: "",
                            customer: "",
                          });
                        }}
                        className="px-6 py-2.5 rounded-lg border border-gray-600/50 text-gray-300 hover:text-white
                          hover:bg-gray-700/50 transition-all duration-200 flex items-center gap-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAdding}
                        className={`px-4 py-1 text-sm rounded-lg bg-gradient-to-r from-amber-500 to-amber-600
                          text-white font-medium shadow-lg shadow-amber-500/20
                          hover:shadow-amber-500/30 hover:from-amber-600 hover:to-amber-700
                          focus:ring-2 focus:ring-amber-500/50 focus:outline-none
                          transition-all duration-200 flex items-center gap-2
                          ${isAdding ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {!isAdding ? (
                          <>
                            {isEditing ? <FaEdit className="w-4 h-4" /> : <FaPlus className="w-4 h-4" />}
                            {isEditing ? "Save Changes" : "Add Entry"}
                          </>
                        ) : (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
      </main>
    </div>
  );
}

export default SIPOCPage
