import { Request, Response, NextFunction } from "express";
import { Document, Model } from "mongoose";
import userModel from "../models/Users";
import { IPost } from "../models/Post"; 

export interface PaginatedResults<T> {
  next?: { page: number; limit: number };
  previous?: { page: number; limit: number };
  results: T[];
}

export function paginatedResults<T extends Document>(model: Model<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    console.log("🔹 New pagination request received.");
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = req.query.sort ? JSON.parse(req.query.sort as string) : { createdAt: -1 }; // Default sorting
    const filter = req.query.filter ? JSON.parse(req.query.filter as string) : {}; // Default to no filter
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results: PaginatedResults<T> = { results: [] };
    const userId = req.query.userId; // Assuming userId is sent in the route

    try {
      const totalDocuments = await model.countDocuments(filter).exec(); // Count only filtered documents

      if (endIndex < totalDocuments) {
        results.next = { page: page + 1, limit };
      }

      if (startIndex > 0) {
        results.previous = { page: page - 1, limit };
      }

      // Fetch paginated posts
      const fetchedResults = await model
        .find(filter)
        .sort(sort)
        .limit(limit)
        .skip(startIndex)
        .exec();

      if (userId) {
        const user = await userModel.findById(userId).lean(); 
        if (user && user.likedPosts) {
          const likedPostIds = user.likedPosts.map((id) => id.toString()); // Convert to strings for comparison
          results.results = fetchedResults.map((post) => {
            const postObject = post.toObject() as unknown as T & { isLiked: boolean }; // Extend the type to include `isLiked`
            return {
              ...postObject,
              isLiked: likedPostIds.includes(post._id!!.toString()), // Check if the post is liked
            };
          });
        } else {
          results.results = fetchedResults.map((post) => post.toObject() as T); // Default conversion if no userId or likedPosts
        }
      } else {
        results.results = fetchedResults.map((post) => post.toObject() as T); // Convert to plain object
      }

      res.locals.paginatedResults = results;
      next();
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  };
}
