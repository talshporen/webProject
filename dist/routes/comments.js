"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const comments_controllers_1 = __importDefault(require("../controllers/comments_controllers"));
const auth_controller_1 = require("../controllers/auth_controller");
const Paging_1 = require("../Middlewares/Paging");
const Comment_1 = __importDefault(require("../models/Comment"));
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: The Comments API
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - content
 *         - postId
 *         - author
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the comment
 *         content:
 *           type: string
 *           description: The comment content
 *         postId:
 *           type: string
 *           description: The ID of the post
 *         author:
 *           type: string
 *           description: The author of the comment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The creation date of the comment
 *       example:
 *         _id: "607d1b2f5311236168a109ca"
 *         content: "This is a sample comment"
 *         postId: "PostId"
 *         author: "John Doe"
 *         createdAt: "2025-02-01T12:34:56Z"
 */
/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The comment content
 *               postId:
 *                 type: string
 *                 description: The ID of the post
 *               author:
 *                 type: string
 *                 description: The author of the comment
 *             required:
 *               - content
 *               - postId
 *               - author
 *     responses:
 *       201:
 *         description: The created comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request (e.g. missing required fields)
 *       500:
 *         description: Server error
 */
router.post("/", auth_controller_1.authMiddleware, (req, res) => {
    comments_controllers_1.default.createComment(req, res);
});
/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get all comments
 *     tags: [Comments]
 *     responses:
 *       200:
 *         description: List of all comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Server error
 */
router.get("/", (req, res) => {
    comments_controllers_1.default.getAll(req, res);
});
/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Get a comment by ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment ID
 *     responses:
 *       200:
 *         description: The comment data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.get("/:id", (req, res) => {
    comments_controllers_1.default.getCommentById(req, res);
});
/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update a comment by ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The updated content of the comment
 *             required:
 *               - content
 *     responses:
 *       200:
 *         description: The updated comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request (e.g. missing ID or content)
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.put("/:id", (req, res) => {
    comments_controllers_1.default.updateComment(req, res);
});
/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment by ID
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", auth_controller_1.authMiddleware, (req, res) => {
    comments_controllers_1.default.deleteComment(req, res);
});
/**
 * @swagger
 * /comments/post/{postId}:
 *   get:
 *     summary: Get comments by post ID with pagination
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of comments per page
 *     responses:
 *       200:
 *         description: List of comments for the specified post with pagination details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalCount:
 *                   type: integer
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *       404:
 *         description: No comments found for this post
 *       500:
 *         description: Server error
 */
router.get("/post/:postId", (req, res, next) => {
    req.query.filter = JSON.stringify({ postId: req.params.postId });
    next();
}, (0, Paging_1.paginatedResults)(Comment_1.default), (req, res) => {
    const paginatedComments = res.locals.paginatedResults;
    res.status(200).json(Object.assign({ success: true }, paginatedComments));
});
/**
 * @swagger
 * /comments/generate:
 *   post:
 *     summary: Generate a suggested comment for a post using OpenAI
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               postId:
 *                 type: string
 *                 description: The ID of the post for which to generate a comment
 *             required:
 *               - postId
 *     responses:
 *       200:
 *         description: Suggested comment generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestedComment:
 *                   type: string
 *                   description: The generated suggested comment
 *                   example: "This post is really insightful, thanks for sharing!"
 *       400:
 *         description: Bad request (e.g. missing postId)
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post("/generate", auth_controller_1.authMiddleware, (req, res) => {
    comments_controllers_1.default.generateSuggestedComment(req, res);
});
exports.default = router;
//# sourceMappingURL=comments.js.map