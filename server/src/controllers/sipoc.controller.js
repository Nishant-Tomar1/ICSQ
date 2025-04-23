import {SIPOC} from "../models/SIPOC.model.js"

// Get SIPOC by department
export async function getSIPOCByDepartment(req, res) {
  try {
    const { department } = req.query

    if (!department) {
      return res.status(400).json({ message: "Department parameter is required" })
    }

    const sipoc = await SIPOC.findOne({ department })

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
    const { department, entries } = req.body

    if (!department || !entries) {
      return res.status(400).json({ message: "Department and entries are required" })
    }

    // Find and update if exists, create if not
    const sipoc = await SIPOC.findOneAndUpdate({ department }, { department, entries }, { new: true, upsert: true })

    return res.json(sipoc)
  } catch (error) {
    console.error("Error updating SIPOC:", error)
    return res.status(500).json({ message: "Failed to update SIPOC data" })
  }
}

// Delete SIPOC
export async function deleteSIPOC(req, res) {
  try {
    const { department } = req.query

    if (!department) {
      return res.status(400).json({ message: "Department parameter is required" })
    }

    const result = await SIPOC.deleteOne({ department })

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "SIPOC not found for this department" })
    }

    return res.json({ message: "SIPOC deleted successfully" })
  } catch (error) {
    console.error("Error deleting SIPOC:", error)
    return res.status(500).json({ message: "Failed to delete SIPOC data" })
  }
}
