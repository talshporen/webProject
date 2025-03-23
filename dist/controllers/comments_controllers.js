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
exports.createComment = void 0;
const Comment_1 = __importDefault(require("../models/Comment"));
const Post_1 = __importDefault(require("../models/Post"));
const node_fetch_1 = __importDefault(require("node-fetch"));
//get all comments
const getAll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const comments = yield Comment_1.default.find();
        res
            .status(200)
            .json(comments);
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error getting all comments", error: err.message });
    }
});
// new comment
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId, content, author } = req.body;
        if (!postId || !content || !author) {
            res.status(400).json({ message: "all fields are required" });
            return;
        }
        const post = yield Post_1.default.findById(postId);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        const comment = new Comment_1.default({ postId, content, author });
        yield comment.save();
        yield Post_1.default.findByIdAndUpdate(postId, { $push: { comments: comment._id } }, { new: true });
        res.status(201).json(comment);
    }
    catch (err) {
        res.status(500).json({ message: "Error creating comment", error: err.message });
    }
});
exports.createComment = createComment;
// get comments by post id
const getCommentsByPostId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const comments = yield Comment_1.default.find({ postId });
        res
            .status(200)
            .json(comments);
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error getting all comments", error: err.message });
    }
});
// get comment by id
const getCommentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const comment = yield Comment_1.default.findById(id);
        if (!comment) {
            return res
                .status(404)
                .json({ message: "Comment not found" });
        }
        res
            .status(200)
            .json(comment);
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error getting comment by ID", error: err.message });
    }
});
// update comment
const updateComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const content = req.body.content;
        if (!id || !content) {
            return res
                .status(400)
                .json({ message: "Comment ID and content are required" });
        }
        const updatedComment = yield Comment_1.default.findByIdAndUpdate(id, { content }, { new: true });
        if (!updatedComment) {
            return res
                .status(404)
                .json({ message: "Comment not found" });
        }
        res
            .status(200)
            .json(updatedComment);
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error updating comment", error: err.message });
    }
});
//delete comment
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return res
                .status(400)
                .json({ message: "Comment ID is required" });
        }
        const deletedComment = yield Comment_1.default.findByIdAndDelete(id);
        if (!deletedComment) {
            return res
                .status(404)
                .json({ message: "Comment not found" });
        }
        res
            .status(200)
            .json(deletedComment);
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error deleting comment", error: err.message });
    }
});
// get comment by generating suggested comment by OpenAI
const generateSuggestedComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.body;
        if (!postId) {
            return res.status(400).json({ message: "postId is a required parameter" });
        }
        const post = yield Post_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        const { title, content, author } = post;
        const prompt = `Title: "${title}"\nContent: "${content}"\n Auther: "${author}"\n\nWrite a recommended comment for this post.`;
        const openAIResponse = yield (0, node_fetch_1.default)("https://api.openai.com/v1/chat/completions", {
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
            const errorData = yield openAIResponse.json();
            console.error("OpenAI API Error:", errorData);
            return res.status(openAIResponse.status).json({ message: "Error generating comment", error: errorData });
        }
        const data = yield openAIResponse.json();
        const suggestedComment = data.choices[0].message.content.trim();
        res.status(200).json({ suggestedComment });
    }
    catch (error) {
        console.error("Error generating comment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = {
    getAll,
    createComment: exports.createComment,
    getCommentsByPostId,
    getCommentById,
    updateComment,
    deleteComment,
    generateSuggestedComment,
};
//# sourceMappingURL=comments_controllers.js.map