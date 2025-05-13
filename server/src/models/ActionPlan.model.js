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
    expectations: [{
      type: String,
    }],
    actions: [{
      type: String,
    }],
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
