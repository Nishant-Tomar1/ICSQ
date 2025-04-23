import {Schema, model} from 'mongoose'

const ActionPlanSchema = new Schema(
  {
    department: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    expectation: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    targetDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
)

export default ActionPlan = model("ActionPlan", ActionPlanSchema)
