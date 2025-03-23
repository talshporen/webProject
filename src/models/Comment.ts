import mongoose, { Document, Model, Schema } from "mongoose";

// Interface for Comment
export interface IComment extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  content: string;
  author: string;
  postId: mongoose.Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const commentSchema: Schema<IComment> = new mongoose.Schema<IComment>(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Comment Model
const commentModel: Model<IComment> = mongoose.model<IComment>("Comment", commentSchema);

export default commentModel;