import express from "express";
import Post from "../controllers/posts_controller";
import { authMiddleware } from "../controllers/auth_controller";
import { paginatedResults } from "../Middlewares/Paging";
import PostModel from "../models/Post";
import multer from "multer";
import path from "path";

const router = express.Router();

// Configure multer storage and file filter
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG or PNG files are allowed'));
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: The Posts API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - senderId
 *       properties:
 *         title:
 *           type: string
 *           description: The post title
 *         content:
 *           type: string
 *           description: The post content
 *         senderId:
 *           type: string
 *           description: The ID of the sender
 *       example:
 *         title: 'Sample Post'
 *         content: 'This is a sample post content'
 *         senderId: '12345'
 */

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The post title
 *               content:
 *                 type: string
 *                 description: The post content
 *               senderId:
 *                 type: string
 *                 description: The ID of the sender
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The image file for the post
 *             required:
 *               - title
 *               - content
 *               - senderId
 *     responses:
 *       201:
 *         description: The created post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
// router.post("/", authMiddleware, upload.single('image'), (req, res) => {
//   Post.createPost(req, res);
// });
router.post('/', authMiddleware,(req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      // If there's an error (e.g., from fileFilter), send a 400 response
      return res.status(400).json({ message: err.message });
    }
    // Proceed to your controller if there's no error
    Post.createPost(req, res);
  });
});
/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts with pagination
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of posts per page
 *     responses:
 *       200:
 *         description: List of all posts with pagination details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
 *                     $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error
 */
router.get("/", paginatedResults(PostModel), (req, res) => {
  res.json(res.locals.paginatedResults);
});

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     responses:
 *       200:
 *         description: The post data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.get("/:id", (req, res) => {
  Post.getPostById(req, res);
});

/**
 * @swagger
 * /posts/sender/{senderId}:
 *   get:
 *     summary: Get posts by sender ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: senderId
 *         schema:
 *           type: string
 *         required: true
 *         description: The sender ID
 *     responses:
 *       200:
 *         description: List of posts by sender
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       404:
 *         description: No posts found for this sender
 *       500:
 *         description: Server error
 */
router.get("/sender/:senderId", (req, res) => {
  Post.getPostsBySenderId(req, res);
});

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The updated title
 *               content:
 *                 type: string
 *                 description: The updated content
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: An optional new image file
 *             required:
 *               - title
 *               - content
 *     responses:
 *       200:
 *         description: The updated post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.put("/:id", authMiddleware, upload.single("PostImage"), (req, res) => {
  Post.updatePost(req, res);
});



/**
 * @swagger
 * /posts/{id}/like:
 *   post:
 *     summary: Like or dislike a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: Bearer token for authentication
 *     responses:
 *       200:
 *         description: Successfully toggled like
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post liked"
 *                 likesCount:
 *                   type: number
 *                   example: 11
 *       404:
 *         description: Post or user not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/like", authMiddleware, Post.toggleLike);

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authMiddleware, (req, res) => {
  Post.deletePost(req, res);
});

export default router;