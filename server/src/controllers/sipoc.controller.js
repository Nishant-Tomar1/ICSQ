import mongoose from "mongoose"
import { Department } from "../models/Department.model.js"
import {SIPOC} from "../models/SIPOC.model.js"

// Get SIPOC by department
export async function getSIPOCByDepartment(req, res) {
  try {
    const { departmentId } = req.query

    if (!departmentId) {
      return res.status(400).json({ message: "DepartmentId parameter is required" })
    }

    const department = await Department.findById(departmentId)
    if(!department){
      return res.status(404).json({message :"Invalid DepartmentId"})
    }

    const sipoc = await SIPOC.findOne({ department : departmentId })

    if (!sipoc) {
      return res.status(404).json({ message: "SIPOC not found for this department" })
    }

    return res.json(sipoc)
  } catch (error) {
    console.error("Error fetching SIPOC:", error)
    return res.status(500).json({ message: "Failed to fetch SIPOC data" })
  }
}

// Create or update SIPOC
export async function createOrUpdateSIPOC(req, res) {
  try {
    const { departmentId, entries } = req.body

    if (!departmentId || !entries) {
      return res.status(400).json({ message: "DepartmentId and entries are required" })
    }

    const department = await Department.findById(departmentId)
    if(!department){
      return res.status(404).json({message :"Invalid DepartmentId"})
    }

    // Find and update if exists, create if not
    const sipoc = await SIPOC.findOneAndUpdate({ department : new mongoose.Types.ObjectId(departmentId) }, { department : new mongoose.Types.ObjectId(departmentId), entries }, { new: true, upsert: true })

    return res.json(sipoc)
  } catch (error) {
    console.error("Error updating SIPOC:", error)
    return res.status(500).json({ message: "Failed to update SIPOC data" })
  }
}

// Delete SIPOC
export async function deleteSIPOC(req, res) {
  try {
    const { departmentId } = req.query

    if (!departmentId) {
      return res.status(400).json({ message: "DepartmentId parameter is required" })
    }

    const department = await Department.findById(departmentId)
    if(!department){
      return res.status(404).json({message :"Invalid DepartmentId"})
    }

    const result = await SIPOC.deleteOne({ department : new mongoose.Types.ObjectId(departmentId) })

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "SIPOC not found for this department" })
    }

    return res.json({ message: "SIPOC deleted successfully" })
  } catch (error) {
    console.error("Error deleting SIPOC:", error)
    return res.status(500).json({ message: "Failed to delete SIPOC data" })
  }
}
