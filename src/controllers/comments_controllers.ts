import { Request, Response } from "express";
import CommentModel from "../models/Comment";
import PostModel from "../models/Post";
import fetch from "node-fetch";

//get all comments

const getAll = async(req: Request, res: Response) =>{
  try {
    const comments = await CommentModel.find();
    res
    .status(200)
    .json(comments);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error getting all comments", error: err.message });
  }
};

// new comment
export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId, content, author } = req.body;

    if (!postId || !content || !author) {
      res.status(400).json({ message: "all fields are required" });
      return;
    }
    const post = await PostModel.findById(postId);
     if (!post) {
       res.status(404).json({ message: "Post not found" });
       return;
      }

    const comment = new CommentModel({ postId, content, author });
    await comment.save();

    await PostModel.findByIdAndUpdate(
      postId,
      { $push: { comments: comment._id } }, 
      { new: true }
    );

    res.status(201).json(comment);
  } catch (err: any) {
    res.status(500).json({ message: "Error creating comment", error: err.message });
  }
};




// get comments by post id
const getCommentsByPostId = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const comments = await CommentModel.find({ postId });
    res
    .status(200)
    .json(comments);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error getting all comments", error: err.message });
  }
};

// get comment by id
const getCommentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const comment = await CommentModel.findById(id);

    if (!comment) {
      return res
      .status(404)
      .json({ message: "Comment not found" });
    }

    res
    .status(200)
    .json(comment);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error getting comment by ID", error: err.message });
  }
};

// update comment
const updateComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const  content = req.body.content;

    if (!id || !content) {
      return res
        .status(400)
        .json({ message: "Comment ID and content are required" });
    }

    const updatedComment = await CommentModel.findByIdAndUpdate(
      id,
      { content },
      { new: true }
    );

    if (!updatedComment) {
      return res
      .status(404)
      .json({ message: "Comment not found" });
    }

    res
    .status(200)
    .json(updatedComment);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error updating comment", error: err.message });
  }
};

//delete comment
const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
      .status(400)
      .json({ message: "Comment ID is required" });
    }

    const deletedComment = await CommentModel.findByIdAndDelete(id);

    if (!deletedComment) {
      return res
      .status(404)
      .json({ message: "Comment not found" });
    }

    res
      .status(200)
      .json(deletedComment);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error deleting comment", error: err.message });
  }
};

// get comment by generating suggested comment by OpenAI
const generateSuggestedComment = async (req: Request, res: Response) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ message: "postId is a required parameter" });
    }

    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    
    const { title, content, author } = post;

    const prompt = `Title: "${title}"\nContent: "${content}"\n Auther: "${author}"\n\nWrite a recommended comment for this post.`;

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", 
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 100, 
        temperature: 0.7, 
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error("OpenAI API Error:", errorData);
      return res.status(openAIResponse.status).json({ message: "Error generating comment", error: errorData });
    }

    const data = await openAIResponse.json() as { choices: { message: { content: string } }[] };
    const suggestedComment = data.choices[0].message.content.trim();

    res.status(200).json({ suggestedComment });
  } catch (error: any) {
    console.error("Error generating comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export default {
  getAll,
  createComment,
  getCommentsByPostId,
  getCommentById,
  updateComment,
  deleteComment,
  generateSuggestedComment, 
};
