
import mongoose from "mongoose";
export interface IUser {
  username: string;
  email: string;
  password?: string;
  _id?: string;
  profilePicture: string; 
  posts: mongoose.Types.ObjectId[];
  refreshToken?: string[];
  likedPosts?: mongoose.Schema.Types.ObjectId[]; 
  googleId?: string;
}

const userSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  profilePicture: { 
    type: String,
    default: '' 
  },
  posts: [{ 
    type: mongoose.Types.ObjectId,
     ref: 'Post'
  }],
  refreshToken: {
    type: [String],
    default: [],
    }, 
    likedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
	googleId: { 
      type: String,
      unique: true,
      sparse: true,
    },
});

const userModel = mongoose.model<IUser>("Users", userSchema);

export default userModel;