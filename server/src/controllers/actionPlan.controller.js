import mongoose from "mongoose"
import {ActionPlan} from "../models/ActionPlan.model.js"

// Get all action plans (admin only, with filters)
export async function getActionPlansForAdmin(req, res) {
  try {
    const { departmentId, status, categoryId, assignedTo } = req.query
    const filters = {}
    if (departmentId) filters.department = new mongoose.Types.ObjectId(departmentId)
    if (status) filters.status = status
    if (categoryId) filters.category = new mongoose.Types.ObjectId(categoryId)
    if (assignedTo) filters.assignedTo = new mongoose.Types.ObjectId(assignedTo)
    const plans = await ActionPlan.find(filters)
      .populate('department')
      .populate('category')
      .populate('assignedBy')
      .populate('assignedTo')
    return res.json(plans)
  } catch (error) {
    console.error("Error fetching action plans (admin):", error)
    return res.status(500).json({ message: "Failed to fetch action plans" })
  }
}

// Get all action plans for HOD's current department
export async function getActionPlansForHOD(req, res) {
  try {
    const departmentId = req.user.currentDepartment
    if (!departmentId) return res.status(400).json({ message: "No current department found for HOD" })
    const plans = await ActionPlan.find({ department: departmentId })
      .populate('department')
      .populate('category')
      .populate('assignedBy')
      .populate('assignedTo')
    return res.json(plans)
  } catch (error) {
    console.error("Error fetching action plans (HOD):", error)
    return res.status(500).json({ message: "Failed to fetch action plans" })
  }
}

// Get all action plans assigned to the current user
export async function getActionPlansForUser(req, res) {
  try {
    const userId = req.user._id
    const plans = await ActionPlan.find({ assignedTo: userId })
      .populate('department')
      .populate('category')
      .populate('assignedBy')
      .populate('assignedTo')
    return res.json(plans)
  } catch (error) {
    console.error("Error fetching action plans (user):", error)
    return res.status(500).json({ message: "Failed to fetch action plans" })
  }
}

// Create a new action plan (HOD or admin)
export async function createActionPlan(req, res) {
  try {
    const { departmentId, categoryId, expectations, actions, instructions, assignedTo, targetDate, status } = req.body
    if (!departmentId || !categoryId || !expectations || !assignedTo || !targetDate) {
      return res.status(400).json({ message: "Missing required fields" })
    }
    const plan = new ActionPlan({
      department: new mongoose.Types.ObjectId(departmentId),
      category: new mongoose.Types.ObjectId(categoryId),
      expectations,
      actions,
      instructions,
      assignedBy: req.user._id,
      assignedTo: new mongoose.Types.ObjectId(assignedTo),
      targetDate: new Date(targetDate),
      status: status || "pending",
    })
    await plan.save()
    return res.status(201).json(plan)
  } catch (error) {
    console.error("Error creating action plan:", error)
    return res.status(500).json({ message: "Failed to create action plan" })
  }
}

// Update an action plan (HOD or admin)
export async function updateActionPlan(req, res) {
  try {
    const { department, category, expectations, actions, instructions, assignedTo, targetDate, status } = req.body
    const plan = await ActionPlan.findById(req.params.id)
    if (!plan) {
      return res.status(404).json({ message: "Action plan not found" })
    }
    // Authorization: allow HODs, admins, or assigned user (with restrictions)
    const isAdmin = req.user.role === 'admin';
    const isHOD = req.user.role === 'hod';
    const isAssignedUser = String(plan.assignedTo) === String(req.user._id);
    if (!isAdmin && !isHOD && !isAssignedUser) {
      return res.status(403).json({ message: "Not authorized to update this action plan" })
    }
    // Only allow assigned user to update 'actions' and 'status'
    if (isAssignedUser && !isAdmin && !isHOD) {
      if (actions !== undefined) plan.actions = actions;
      if (status !== undefined) plan.status = status;
      // Block all other fields
    } else {
      if (department) plan.department = department
      if (category) plan.category = category
      if (expectations) plan.expectations = expectations
      if (actions !== undefined) plan.actions = actions
      if (instructions) plan.instructions = instructions
      if (assignedTo) plan.assignedTo = assignedTo
      if (targetDate) plan.targetDate = new Date(targetDate)
      if (status !== undefined) plan.status = status
    }
    await plan.save()
    return res.json(plan)
  } catch (error) {
    console.error(`Error updating action plan ${req.params.id}:`, error)
    console.error('User:', req.user)
    console.error('Body:', req.body)
    return res.status(500).json({ message: "Failed to update action plan", error: error?.message, stack: error?.stack })
  }
}

// User updates status of their assigned action plan
export async function updateActionPlanStatus(req, res) {
  try {
    const { status } = req.body
    const plan = await ActionPlan.findById(req.params.id)
    if (!plan) {
      return res.status(404).json({ message: "Action plan not found" })
    }
    if (String(plan.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to update this action plan" })
    }
    plan.status = status
    await plan.save()
    return res.json(plan)
  } catch (error) {
    console.error(`Error updating action plan status ${req.params.id}:`, error)
    console.error('User:', req.user)
    console.error('Body:', req.body)
    return res.status(500).json({ message: "Failed to update action plan status", error: error?.message, stack: error?.stack })
  }
}

// Delete an action plan (admin only)
export async function deleteActionPlan(req, res) {
  try {
    const plan = await ActionPlan.findById(req.params.id)
    if (!plan) {
      return res.status(404).json({ message: "Action plan not found" })
    }
    await plan.deleteOne()
    return res.json({ message: "Action plan deleted successfully" })
  } catch (error) {
    console.error(`Error deleting action plan ${req.params.id}:`, error)
    return res.status(500).json({ message: "Failed to delete action plan" })
  }
}
