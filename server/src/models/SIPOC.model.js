import { Schema, model } from "mongoose"

const SIPOCSchema = new Schema(
  {
    department: {
      type: Schema.Types.ObjectId,
      ref:'Department',
      required: true,
      unique: true,
    },
    entries: [
      {
        supplier: String,
        input: String,
        process: String,
        output: String,
        customer: String,
      },
    ],
  },
  {
    timestamps: true,
  },
)

export const SIPOC =  model("SIPOC", SIPOCSchema)
