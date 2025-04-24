import { Schema, model } from "mongoose"

const SurveySchema = new Schema(
  {
    fromDepartment: {
      type: Schema.Types.ObjectId,
      ref : 'Department',
      required: true,
    },
    toDepartment: {
      type : Schema.Types.ObjectId,
      ref : 'Department',
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
