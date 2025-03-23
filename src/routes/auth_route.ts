import express from "express";
import authController, { authMiddleware } from "../controllers/auth_controller";
import passport from "passport";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
console.log("🔹 Auth routes initialized.");
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: The Authentication API
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's username.
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email.
 *               password:
 *                 type: string
 *                 description: The user's password.
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: The user's profile picture (optional).
 *             required:
 *               - username
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: User registered successfully.
 *       400:
 *         description: Bad request, missing parameters.
 *       409:
 *         description: Conflict, user already exists.
 *       500:
 *         description: Internal server error.
 */
router.post("/register", upload.single('profilePicture'), (req, res, next) => {
  console.log("📩 Register request received");
  if (!req.file) {
    console.error("❌ No file uploaded!");
  } else {
    console.log("📸 Uploaded file:", req.file);
  }
  next();
}, authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to the application
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email.
 *               password:
 *                 type: string
 *                 description: The user's password.
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login successful and tokens returned.
 *       400:
 *         description: Bad request, invalid credentials.
 *       500:
 *         description: Internal server error.
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout a user by invalidating the refresh token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token to be invalidated.
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Logout successful.
 *       400:
 *         description: Logout failed.
 *       500:
 *         description: Internal server error.
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh authentication tokens.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token to be used for generating new tokens.
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully.
 *       400:
 *         description: Bad request, invalid refresh token.
 *       500:
 *         description: Internal server error.
 */
router.post("/refresh", authController.refresh);

/**
 * @swagger
 * /auth/protected-route:
 *   get:
 *     summary: Access a protected route (authentication required).
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Access granted.
 *       401:
 *         description: Unauthorized.
 */
router.get("/protected-route", authMiddleware, (req, res) => {
  res.send("This is a protected route");
});

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Initiate Google OAuth login.
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth consent screen.
 */
router.get("/google", passport.authenticate('google', { scope: ['profile', 'email'] }));
console.log("🔹 Google login route hit.");
/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback URL.
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects after successful Google authentication.
 *       400:
 *         description: Bad request or authentication failed.
 */
router.get(
  "/google/callback",
  (req, res, next) => {
    console.log("🔹 Google callback route hit."); // ✅ בדיקה אם הקובץ callback נקרא
    next();
  },
  passport.authenticate('google', { session: false, failureRedirect: '/auth/login' }),
  authController.googleCallback
  
);

export default router;
