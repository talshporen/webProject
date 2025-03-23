import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  title: string;
  content: string;
  author: String;
  createdAt?: Date;
  image?: string;
  comments?: mongoose.Schema.Types.ObjectId[];
  likesCount?: number; 
}

const postSchema = new mongoose.Schema<IPost>({
  title: {
    type: String,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  image: {
    type: String,
    default: "",
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  likesCount: {
    type: Number,
    default: 0, 
  },
});

const postModel = mongoose.model<IPost>("Post", postSchema);

export default postModel;