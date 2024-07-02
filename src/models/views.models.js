import mongoose, { Schema } from "mongoose";

const viewsSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    viewers: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Views = mongoose.model("Views", viewsSchema);
