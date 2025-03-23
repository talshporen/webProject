import { Router } from "express";
import { getAllUsers, getUserProfile, updateUserProfile, upload } from "../controllers/user_controller";
import { authMiddleware } from "../controllers/auth_controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The Users API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         profilePicture:
 *           type: string
 *       example:
 *         _id: "607d1b2f5311236168a109ca"
 *         username: "johndoe"
 *         email: "john@example.com"
 *         profilePicture: "http://example.com/uploads/1631231231231-image.png"
 *
 *     Post:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         author:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *       example:
 *         _id: "607d1b2f5311236168a109cb"
 *         title: "Sample Post"
 *         content: "This is a sample post content"
 *         author: "johndoe"
 *         createdAt: "2025-02-01T12:34:56Z"
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
router.get("/", getAllUsers);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile with paginated posts
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to retrieve
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for paginated posts
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: User profile with posts returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 hasMorePosts:
 *                   type: boolean
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/profile", authMiddleware, getUserProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile with optional image upload
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: New username for the user
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Optional new profile picture
 *             required:
 *               - username
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 updatedPostsCount:
 *                   type: integer
 *       400:
 *         description: Bad request (e.g. missing username)
 *       404:
 *         description: User not found
 *       409:
 *         description: Username is already taken
 *       500:
 *         description: Server error
 */
router.put("/profile", authMiddleware, upload.single('profilePicture'), updateUserProfile);

export default router;
