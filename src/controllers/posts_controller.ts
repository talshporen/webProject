import { Request, Response } from "express";
import mongoose from "mongoose";
import postModel from "../models/Post";
import userModel from "../models/Users";
import { log } from "console";

// Create a new post
export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, author } = req.body;
    let imagePath = '';

    // Check if an image was uploaded
    if (req.file) {
      const fileType = req.file.mimetype;
      if (fileType !== 'image/jpeg' && fileType !== 'image/png') {
        res.status(400).json({ message: "Only JPEG or PNG files are allowed" });
        return;
      }
      imagePath = `/uploads/${req.file.filename}`;
    }

    if (!title || !content || !author) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const post = new postModel({ title, content, author, image: imagePath });
    await post.save();
    res.status(201).json(post);
  } catch (err: any) {
    res.status(500).json({ message: "Error creating post", error: err.message });
  }
};

// Get a post by ID
export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await postModel.findById(id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    res.status(200).json(post);
  } catch (err: any) {
    res.status(500).json({ message: "Error getting post by ID", error: err.message });
  }
};

// Get posts by sender ID
export const getPostsBySenderId = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await postModel.find({ senderId: req.params.senderId });

    if (!posts.length) {
      res.status(404).json({ message: "No posts found for this sender" });
      return;
    }

    res.status(200).json(posts);
  } catch (err: any) {
    res.status(500).json({
      message: "Error getting posts by sender ID",
      error: err.message,
    });
  }
};

// Update a post
export const updatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;
    // If a file is uploaded, build the image path
    const image = req.file ? '/' + req.file.path : undefined;

    if (!title || !content) {
      res.status(400).json({ message: "Title and content are required" });
      return;
    }

    // If an image file is uploaded, check its mimetype
    if (req.file) {
      const fileType = req.file.mimetype;
      if (fileType !== "image/jpeg" && fileType !== "image/png") {
        res.status(400).json({ message: "Only JPEG or PNG files are allowed" });
        return;
      }
    }

    const updateData: any = { title, content };
    if (image) {
      updateData.image = image;
    }

    const updatedPost = await postModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedPost) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    res.status(200).json(updatedPost);
  } catch (err: any) {
    res.status(500).json({ message: "Error updating post", error: err.message });
  }
};

// Delete a post
export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedPost = await postModel.findByIdAndDelete(req.params.id);

    if (!deletedPost) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    res.status(200).json(deletedPost);
  } catch (err: any) {
    res.status(500).json({ message: "Error deleting post", error: err.message });
  }
};

// Toggle like for a post
export const toggleLike = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("req.params.userId: " + req.params.userId);
    console.log("req.query.userId: " + req.query.userId);
    const postId = req.params.id;
    const userId = req.params.userId || req.query.userId;
    
    if (!postId) {
      res.status(400).json({ message: "Post ID is required." });
      return;
    }
    console.log("user id is:" + userId);
    if (!userId) {
      res.status(401).json({ message: "User ID is required." });
      return;
    }

    const post = await postModel.findById(postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const user = await userModel.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!user.likedPosts) {
      user.likedPosts = [];
    }

    const hasLiked = user.likedPosts.some(
      (likedPostId) => likedPostId.toString() === postId
    );

    if (hasLiked) {
      user.likedPosts = user.likedPosts.filter(
        (likedPostId) => likedPostId.toString() !== postId
      );
      post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
    } else {
      user.likedPosts.push(postId as unknown as mongoose.Schema.Types.ObjectId);
      post.likesCount = (post.likesCount || 0) + 1;
    }

    await user.save();
    await post.save();

    res.status(200).json({
      message: hasLiked ? "Like removed" : "Post liked",
      likesCount: post.likesCount,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export default {
  createPost,
  getPostById,
  getPostsBySenderId,
  updatePost,
  deletePost,
  toggleLike,
};
