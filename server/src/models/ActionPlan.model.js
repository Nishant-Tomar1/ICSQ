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
    expectations: {
      type: String,
      required: true,
    },
    actions: {
      type: String,
    },
    instructions: {
      type: String,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref : 'User',
      required: true,
    },
    assignedTo: {
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
    originalSurveyRespondents: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      surveyId: {
        type: Schema.Types.ObjectId,
        ref: 'Survey'
      },
      originalExpectation: {
        type: String,
        required: true
      },
      category: {
        type: String,
        required: true
      }
    }],
  },
  {
    timestamps: true,
  },
)

export const ActionPlan = model("ActionPlan", ActionPlanSchema)
