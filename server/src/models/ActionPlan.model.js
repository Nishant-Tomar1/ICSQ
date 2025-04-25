import {Schema, model} from 'mongoose'

const ActionPlanSchema = new Schema(
  {
    department: {
      type: Schema.Types.ObjectId,
      ref : 'Department',
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref : 'Category',
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
      type: Schema.Types.ObjectId,
      ref : 'User',
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

export const ActionPlan = model("ActionPlan", ActionPlanSchema)
