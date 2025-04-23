import { Schema, model } from "mongoose"

const SIPOCSchema = new Schema(
  {
    department: {
      type: String,
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

export default model("SIPOC", SIPOCSchema)
