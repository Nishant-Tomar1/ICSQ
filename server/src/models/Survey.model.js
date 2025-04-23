import { Schema, model } from "mongoose"

const SurveySchema = new Schema(
  {
    fromDepartment: {
      type: String,
      required: true,
    },
    toDepartment: {
      type: String,
      required: true,
    },
    responses: {
      type: Map,
      of: {
        rating: Number,
        expectations: [String],
        priority: String,
      },
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

export const Survey = model("Survey", SurveySchema)
