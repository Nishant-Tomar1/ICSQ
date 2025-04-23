import {ActionPlan} from "../models/ActionPlan.model.js"

// Get all action plans with optional filters
export async function getActionPlans(req, res) {
  try {
    const { department, status } = req.query

    const filters = {}
    if (department) filters.department = department
    if (status) filters.status = status

    const plans = await ActionPlan.find(filters)
    return res.json(plans)
  } catch (error) {
    console.error("Error fetching action plans:", error)
    return res.status(500).json({ message: "Failed to fetch action plans" })
  }
}

// Get action plan by ID
export async function getActionPlanById(req, res) {
  try {
    const plan = await ActionPlan.findById(req.params.id)

    if (!plan) {
      return res.status(404).json({ message: "Action plan not found" })
    }

    return res.json(plan)
  } catch (error) {
    console.error(`Error fetching action plan ${req.params.id}:`, error)
    return res.status(500).json({ message: "Failed to fetch action plan" })
  }
}

// Create a new action plan
export async function createActionPlan(req, res) {
  try {
    const { department, category, expectation, action, owner, targetDate, status } = req.body

    if (!department || !category || !expectation || !action || !owner || !targetDate) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const plan = new ActionPlan({
      department,
      category,
      expectation,
      action,
      owner,
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

// Update an action plan
export async function updateActionPlan(req, res) {
  try {
    const { department, category, expectation, action, owner, targetDate, status } = req.body

    const plan = await ActionPlan.findById(req.params.id)

    if (!plan) {
      return res.status(404).json({ message: "Action plan not found" })
    }

    if (department) plan.department = department
    if (category) plan.category = category
    if (expectation) plan.expectation = expectation
    if (action) plan.action = action
    if (owner) plan.owner = owner
    if (targetDate) plan.targetDate = new Date(targetDate)
    if (status) plan.status = status

    await plan.save()

    return res.json(plan)
  } catch (error) {
    console.error(`Error updating action plan ${req.params.id}:`, error)
    return res.status(500).json({ message: "Failed to update action plan" })
  }
}

// Update multiple action plans
export async function updateActionPlans(req, res) {
  try {
    const { plans } = req.body

    if (!plans || !Array.isArray(plans)) {
      return res.status(400).json({ message: "Plans array is required" })
    }

    const updatePromises = plans.map(async (plan) => {
      const { _id, ...updateData } = plan
      return ActionPlan.findByIdAndUpdate(_id, updateData, { new: true })
    })

    await Promise.all(updatePromises)

    return res.json({
      message: "Action plans updated successfully",
      modifiedCount: plans.length,
    })
  } catch (error) {
    console.error("Error updating action plans:", error)
    return res.status(500).json({ message: "Failed to update action plans" })
  }
}

// Delete an action plan
export async function deleteActionPlan(req, res) {
  try {
    const plan = await findById(req.params.id)

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
