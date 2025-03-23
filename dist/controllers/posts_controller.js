"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleLike = exports.deletePost = exports.updatePost = exports.getPostsBySenderId = exports.getPostById = exports.createPost = void 0;
const Post_1 = __importDefault(require("../models/Post"));
const Users_1 = __importDefault(require("../models/Users"));
// Create a new post
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const post = new Post_1.default({ title, content, author, image: imagePath });
        yield post.save();
        res.status(201).json(post);
    }
    catch (err) {
        res.status(500).json({ message: "Error creating post", error: err.message });
    }
});
exports.createPost = createPost;
// Get a post by ID
const getPostById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const post = yield Post_1.default.findById(id);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        res.status(200).json(post);
    }
    catch (err) {
        res.status(500).json({ message: "Error getting post by ID", error: err.message });
    }
});
exports.getPostById = getPostById;
// Get posts by sender ID
const getPostsBySenderId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield Post_1.default.find({ senderId: req.params.senderId });
        if (!posts.length) {
            res.status(404).json({ message: "No posts found for this sender" });
            return;
        }
        res.status(200).json(posts);
    }
    catch (err) {
        res.status(500).json({
            message: "Error getting posts by sender ID",
            error: err.message,
        });
    }
});
exports.getPostsBySenderId = getPostsBySenderId;
// Update a post
const updatePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const updateData = { title, content };
        if (image) {
            updateData.image = image;
        }
        const updatedPost = yield Post_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedPost) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        res.status(200).json(updatedPost);
    }
    catch (err) {
        res.status(500).json({ message: "Error updating post", error: err.message });
    }
});
exports.updatePost = updatePost;
// Delete a post
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedPost = yield Post_1.default.findByIdAndDelete(req.params.id);
        if (!deletedPost) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        res.status(200).json(deletedPost);
    }
    catch (err) {
        res.status(500).json({ message: "Error deleting post", error: err.message });
    }
});
exports.deletePost = deletePost;
// Toggle like for a post
const toggleLike = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const post = yield Post_1.default.findById(postId);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        const user = yield Users_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (!user.likedPosts) {
            user.likedPosts = [];
        }
        const hasLiked = user.likedPosts.some((likedPostId) => likedPostId.toString() === postId);
        if (hasLiked) {
            user.likedPosts = user.likedPosts.filter((likedPostId) => likedPostId.toString() !== postId);
            post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
        }
        else {
            user.likedPosts.push(postId);
            post.likesCount = (post.likesCount || 0) + 1;
        }
        yield user.save();
        yield post.save();
        res.status(200).json({
            message: hasLiked ? "Like removed" : "Post liked",
            likesCount: post.likesCount,
        });
    }
    catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.toggleLike = toggleLike;
exports.default = {
    createPost: exports.createPost,
    getPostById: exports.getPostById,
    getPostsBySenderId: exports.getPostsBySenderId,
    updatePost: exports.updatePost,
    deletePost: exports.deletePost,
    toggleLike: exports.toggleLike,
};
//# sourceMappingURL=posts_controller.js.map