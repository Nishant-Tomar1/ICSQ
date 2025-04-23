import { Schema, model } from "mongoose"

const DepartmentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

export default model("Department", DepartmentSchema)
