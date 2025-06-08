import mongoose from "mongoose"
import { Department } from "../models/Department.model.js"
import {SIPOC} from "../models/SIPOC.model.js"
import { deleteFileFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"

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

    const sipoc = await SIPOC.aggregate([{ 
      $match :{
        department :new mongoose.Types.ObjectId(departmentId)
       }
      }])

    if (!sipoc) {
      return res.status(404).json({ message: "SIPOC not found for this department" })
    }

    return res.json(sipoc)
  } catch (error) {
    console.error("Error fetching SIPOC:", error)
    return res.status(500).json({ message: "Failed to fetch SIPOC data" })
  }
}

export async function getSIPOCById(req, res) {
  try {
    const sipoc = await SIPOC.findById(req.params.id )

    if (!sipoc) {
      return res.status(404).json({ message: "SIPOC not found" })
    }

    return res.json(sipoc)
  } catch (error) {
    console.error("Error fetching SIPOC:", error)
    return res.status(500).json({ message: "Failed to fetch SIPOC data" })
  }
}

// Create SIPOC
export async function createSIPOC(req, res) {
  try {
    let { departmentId, entries } = req.body

    if (!departmentId || !entries) {
      return res.status(400).json({ message: "DepartmentId and entries are required" })
    }

    const department = await Department.findById(departmentId)
    if(!department){
      return res.status(404).json({message :"Invalid DepartmentId"})
    }

    const processLocalPath = req.files?.processPicture ? req.files?.processPicture[0].path : "";
    
    let processFile ="";
    if (processLocalPath){
      processFile = await uploadOnCloudinary(processLocalPath);
    }
    entries = JSON.parse(entries);
    entries = {...entries, process : {...entries.process , file : processFile.url, input : entries?.process?.input || ""} };
    
    const sipoc = await SIPOC.create({ department : new mongoose.Types.ObjectId(departmentId), entries })

    return res.json(sipoc)
  } catch (error) {
    console.error("Error updating SIPOC:", error)
    return res.status(500).json({ message: "Failed to create SIPOC data" })
  }
}

//Update SIPOC
export async function updateSIPOC(req, res) {
  try {
    let { entries } = req.body
    if (!req.params.id){
      return res.status(400).json({message : "SIPOC Id is required"})
    }
    const sipoc = await SIPOC.findById( req.params.id);
    if (!sipoc){
      return res.status(404).json({message : "SIPOC not found"})
    }
    entries = JSON.parse(entries)
    
    const newProcessLocalPath = req?.files?.processPicture ? req.files?.processPicture[0].path : "";
    if (newProcessLocalPath){
      if (entries?.process?.file){
        await deleteFileFromCloudinary(entries?.process?.file)
      }
      const newProcessFile = await uploadOnCloudinary(newProcessLocalPath);
      entries = {...entries, process : {...entries.process , file : newProcessFile.url, input : entries.process?.text} };
    }

    sipoc.entries = entries;
    await sipoc.save()

    return res.json(sipoc)
  } catch (error) {
    console.error("Error updating SIPOC:", error)
    return res.status(500).json({ message: "Failed to update SIPOC data" })
  }
}

// Delete SIPOC
export async function deleteSIPOC(req, res) {
  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ message: "id parameter is required" })
    }

    const sipoc = await SIPOC.findById(id);
    if(!sipoc){
      return res.status(404).json({message : "SIPOC does not exist"})
    }

    const processFile = sipoc?.entries?.process?.file || ""

    if (processFile) await deleteFileFromCloudinary(processFile);

    const result = await SIPOC.deleteOne({ _id : new mongoose.Types.ObjectId(id) })

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "SIPOC not found for this department" })
    }

    return res.json({ message: "SIPOC deleted successfully" })
  } catch (error) {
    console.error("Error deleting SIPOC:", error)
    return res.status(500).json({ message: "Failed to delete SIPOC data" })
  }
}
