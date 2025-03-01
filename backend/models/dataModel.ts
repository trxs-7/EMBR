import mongoose from "mongoose";

const dataSchema = new mongoose.Schema(
  {
    img: {
      type: String,
      required: true,
    },
    data: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Data", dataSchema);
