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
import { FaPlus, FaTrash } from "react-icons/fa"

function SIPOCPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState([false, ""])
  const [sipocEntries, setSipocEntries] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [imageModal, setImageModal] = useState({ open: false, src: "" })
  const [detailModal, setDetailModal] = useState({ open: false, entry: null })
  const [newEntry, setNewEntry] = useState({
    supplier: "",
    input: "",
    process: {
      input:"",
      file :""
    },
    output: "",
    customer: "",
  })
  const { toast } = useToast()
  const { currentUser } = useAuth()

  const fetchData = async () => {
    try {
      if (currentUser?.department?._id) {
        try {
          const response = await axios.get(`${Server}/sipoc?departmentId=${currentUser.department._id}`, {
            withCredentials: true,
          });
          setSipocEntries(response.data || []);
        } catch (error) {
          if (error.response?.status === 404) {
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
  useEffect(() => {
    fetchData()
  }, [currentUser])

  const handleInputChange = (field, value) => {
    setNewEntry((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddEntry = async(e) => {
    e.preventDefault()
    if (!Object.values(newEntry).every((value) => typeof value === 'string' ? value.trim() : true)) {
      toast({
        title: "Incomplete Entry",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const fileInput = document.getElementById("processPicture")
    const file = fileInput.files[0]

    if (!file && !newEntry.process.input){
       toast({
        title: "Incomplete Entry",
        description: "Please fill at least one field (text or image) in process",
        variant: "destructive",
      })
      return
    }

    try {
      setIsAdding(true)
      const formData = new FormData();
      formData.append('departmentId', currentUser?.department?._id);
      formData.append('entries', JSON.stringify(newEntry));
      formData.append('processPicture', file);

      const res = await axios.post(`${Server}/sipoc`, formData, {
        withCredentials: true,
        headers : {
            'Content-Type': 'multipart/form-data'
        }
      })

      if (res.status === 200){
          setNewEntry({
            supplier: "",
            input: "",
            process: {
              input:"",
              file:""
            },
            output: "",
            customer: "",
          })

          toast({
            title: "Entry Added",
            description: "New SIPOC entry has been added",
          })

          fetchData()
      }
    } catch (error) {
      toast({
        title:"Failed to Add SIPOC entry",
        variant:"destructive",
        description: `${error?.response?.data?.message || "Something went wrong! Try Again"}`,
      })
    } finally {
      setModalOpen(false)
      setIsAdding(false)
    }
  }

  const handleDeleteEntry = async (id) => {
    setIsDeleting([true,id])
    try {
      await axios.delete(`${Server}/sipoc?id=${id}`,{withCredentials : true})
      toast({
        title: "Entry Deleted",
        description: "SIPOC entry has been removed",
      })
      fetchData()
    } catch (error) {
      toast({
        title: "Failed to delete SIPOC",
        type:"destructive",
        description: "Something went wrong! Try Again",
      })
    } finally{
      setIsDeleting([false,""])
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
    <div className="min-h-screen">
      <DashboardHeader user={currentUser} />

      <main className="container mx-auto py-6 px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>SIPOC Management - {capitalizeFirstLetter(currentUser?.department?.name)}</span>
             {(["admin","manager"].includes(currentUser?.role)) && <Button onClick={()=>{setModalOpen(true)}} disabled={isLoading}>
                <FaPlus className="mr-2" />
                Add Entry
              </Button>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 mb-4">
              SIPOC (Supplier, Input, Process, Output, Customer) is a tool that summarizes the inputs and outputs of one
              or more processes in table form. It is used to define a business process before work begins.
            </p>

            {sipocEntries.length>0 && 
            // <Table>
            //   <TableHeader>
            //     <TableRow>
            //       <TableHead>Details</TableHead>
            //       <TableHead>Supplier</TableHead>
            //       <TableHead>Input</TableHead>
            //       <TableHead>Process</TableHead>
            //       <TableHead>Output</TableHead>
            //       <TableHead>Customer</TableHead>
            //       {(["admin","manager"].includes(currentUser?.role)) && <TableHead className="w-[80px]">Actions</TableHead>}
            //     </TableRow>
            //   </TableHeader>
            //   <TableBody>
            //     { sipocEntries.map((entry, index) => (
            //       <TableRow key={index}>
            //         <TableCell>
            //           <Button variant="outline" onClick={() => setDetailModal({ open: true, entry })}>View Details</Button>
            //         </TableCell>
            //         <TableCell title={entry?.entries?.supplier}>{entry?.entries?.supplier?.slice(0, 15)}...</TableCell>
            //         <TableCell title={entry?.entries?.input}>{entry?.entries?.input?.slice(0, 15)}...</TableCell>
            //         <TableCell><div className="flex flex-col gap-1">{(entry?.entries?.process?.input.slice(0,15)) ? (entry?.entries?.process?.input.slice(0,15)+"...") : ""} {entry?.entries?.process?.file && <span className="underline cursor-pointer text-blue-600" onClick={() => setImageModal({ open: true, src: entry?.entries?.process?.file })}> View Image </span> }</div></TableCell>
            //         <TableCell title={entry?.entries?.output}>{entry?.entries?.output?.slice(0, 15)}...</TableCell>
            //         <TableCell title={entry?.entries?.customer}>{entry?.entries?.customer?.slice(0, 15)}...</TableCell>
            //         {(["admin","manager"].includes(currentUser?.role)) && <TableCell>
            //           {!(isDeleting[1]===entry._id) ? <Button variant="ghost" className="p-2" onClick={() => handleDeleteEntry(entry._id)}>
            //             <svg
            //               xmlns="http://www.w3.org/2000/svg"
            //               className="h-4 w-4"
            //               viewBox="0 0 20 20"
            //               fill="currentColor"
            //             >
            //               <path
            //                 fillRule="evenodd"
            //                 d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            //                 clipRule="evenodd"
            //               />
            //             </svg>
            //           </Button> :"Loading.."}
            //         </TableCell>}
            //       </TableRow>
            //     ))}
            //   </TableBody>
            // </Table>

             <Table className="table-fixed w-full bg-black/20">
                                <TableHeader>
                                  <TableRow className="bg-[#29252c]/50 border-b-2 border-gray-300/70 overflow-auto">
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-gray-200 font-bold text-base py-5 px-2 tracking-wide">Supplier</TableHead>
                                    <TableHead className="text-gray-200 font-bold text-base py-5 px-2 tracking-wide">Input</TableHead>
                                    <TableHead className="text-gray-200 font-bold text-base py-5 px-2 tracking-wide">Process</TableHead>
                                    <TableHead className="text-gray-200 font-bold text-base py-5 px-2 tracking-wide">Output</TableHead>
                                    <TableHead className="text-gray-200 font-bold text-base py-5 px-2 tracking-wide">Customer</TableHead>
                                    {(["admin", "manager"].includes(currentUser?.role)) && (
                                      <TableHead className="w-[140px] text-gray-200 font-bold text-center py-5 px-2">Actions</TableHead>
                                    )}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {sipocEntries.map((entry, index) => (
                                    <TableRow 
                                      key={index} 
                                      className={`border-b-2 border-gray-200/70 transition-all duration-200 group
                                        ${index % 2 === 0 
                                          ? 'bg-[#83725E]/5' 
                                          : 'bg-white/5'
                                        }`}
                                    > 
                                      <TableCell>
                                          <Button variant="outline" className="text-xs border-[#93725E] hover:border-yellow-500 text-[#93725E] hover:text-yellow-500" onClick={() => setDetailModal({ open: true, entry })}>View Details</Button>
                                      </TableCell>
                                      <TableCell className="text-gray-200 align-top p-4 max-w-[200px] transition-all duration-200">
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
                                      <TableCell className="text-gray-200 align-top p-4 max-w-[200px] transition-all duration-200">
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
                                      <TableCell className="text-gray-200 align-top p-4 max-w-[300px] transition-all duration-200">
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
                                              className="text-[#93725E] hover:text-yellow-500 underline transition-colors text-xs mt-3 hover:scale-[1.02] transform duration-200 flex items-center gap-1.5 group-hover:font-medium"
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
                                      <TableCell className="text-gray-200 align-top p-4 max-w-[200px] transition-all duration-200">
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
                                      <TableCell className="text-gray-200 align-top p-4 max-w-[200px] transition-all duration-200">
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
                                        <TableCell className="align-top transition-all duration-200">
                                          <div className="flex items-center justify-center gap-2">
                                            {/* // <Button 
                                            //   variant="ghost" 
                                            //   className="p-2 text-[#93725E] hover:text-[#6e5f4d] hover:bg-[#83725E]/10 transition-all duration-200 hover:scale-110"
                                            //   onClick={() => setEditModal({ open: true, entry })}
                                            // >
                                            //   <FaEdit className="w-4 h-4" />
                                            // </Button> */}
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
                                }
            
          </CardContent>
        </Card>
      </main>

      {/* Add Entry Modal */}
    {modalOpen && (
      <div className="fixed inset-0 bg-black/10 backdrop-blur-lg bg-opacity-40 flex justify-center items-center z-50 px-4">
        <div className="rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative bg-[#1c1c1e] text-white">
          <h2 className="text-xl font-semibold mb-4">Add New SIPOC Entry</h2>
          <form onSubmit={handleAddEntry} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Supplier <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Enter suppliers (one per line)..."
                value={newEntry.supplier}
                onChange={(e) => handleInputChange("supplier", e.target.value)}
                className="w-full bg-[#2a2a2d] border border-gray-600 p-2 rounded text-white"
                rows={3}
              />
            </div>

            {/* Output */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Output <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Enter outputs (one per line)..."
                value={newEntry.output}
                onChange={(e) => handleInputChange("output", e.target.value)}
                className="w-full bg-[#2a2a2d] border border-gray-600 p-2 rounded text-white"
                rows={3}
              />
            </div>

            {/* Input */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Input <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Enter inputs (one per line)..."
                value={newEntry.input}
                onChange={(e) => handleInputChange("input", e.target.value)}
                className="w-full bg-[#2a2a2d] border border-gray-600 p-2 rounded text-white"
                rows={3}
              />
            </div>

            {/* Customer */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Enter customers (one per line)..."
                value={newEntry.customer}
                onChange={(e) => handleInputChange("customer", e.target.value)}
                className="w-full bg-[#2a2a2d] border border-gray-600 p-2 rounded text-white"
                rows={3}
              />
            </div>

            {/* Process + File Upload Row */}
            <div className="sm:col-span-2 flex flex-col sm:flex-row gap-4">
              {/* Process Textarea */}
              <div className="sm:w-1/2">
                <label className="block text-sm font-medium mb-1">Process</label>
                <textarea
                  placeholder="Enter process steps (one per line)..."
                  value={newEntry.process.input}
                  onChange={(e) => handleInputChange("process", e.target.value)}
                  className="w-full bg-[#2a2a2d] border border-gray-600 p-2 rounded text-white"
                  rows={3}
                />
              </div>

              {/* File Input */}
              <div className="sm:w-1/2">
                <label className="block text-sm font-medium mb-1">
                  Process Diagram (Optional)
                </label>
                <input
                  id="processPicture"
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-300 file:bg-[#3c3c3e] file:text-white file:border-0 file:rounded file:px-4 file:py-2"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="sm:col-span-2 flex justify-end gap-4 mt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded flex items-center"
              >
                {!isAdding ? (
                  <>
                    <FaPlus className="mr-2" /> Add Entry
                  </>
                ) : (
                  "Loading..."
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}




      {/* Detail Modal */}
      {detailModal.open && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-lg bg-opacity-40 flex justify-center items-center z-50">
          <div className=" rounded-lg shadow-lg bg-black/30 w-full max-w-xl p-6 relative">
            <h2 className="text-xl font-semibold mb-4">SIPOC Entry Details</h2>
            <div className="space-y-2">
              <p><strong>Supplier:</strong> {detailModal.entry.entries.supplier}</p>
              <p><strong>Input:</strong> {detailModal.entry.entries.input}</p>
              <p><strong>Process:</strong> {detailModal.entry.entries.process.input}</p>
              { detailModal?.entry?.entries?.process?.file && <div>
                <strong>Image:</strong> <button className="text-blue-600 underline" onClick={() => setImageModal({ open: true, src: detailModal.entry.entries.process.file })}>View Image</button>
              </div>}
              <p><strong>Output:</strong> {detailModal.entry.entries.output}</p>
              <p><strong>Customer:</strong> {detailModal.entry.entries.customer}</p>
            </div>
            <div className="mt-4 text-right">
              <button onClick={() => setDetailModal({ open: false, entry: null })} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
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
    </div>
  )
}

export default SIPOCPage
