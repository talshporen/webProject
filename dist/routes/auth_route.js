"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = __importStar(require("../controllers/auth_controller"));
const passport_1 = __importDefault(require("passport"));
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
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
    }
    else {
        console.log("📸 Uploaded file:", req.file);
    }
    next();
}, auth_controller_1.default.register);
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
router.post("/login", auth_controller_1.default.login);
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
router.post("/logout", auth_controller_1.default.logout);
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
router.post("/refresh", auth_controller_1.default.refresh);
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
router.get("/protected-route", auth_controller_1.authMiddleware, (req, res) => {
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
router.get("/google", passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
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
router.get("/google/callback", (req, res, next) => {
    console.log("🔹 Google callback route hit."); // ✅ בדיקה אם הקובץ callback נקרא
    next();
}, passport_1.default.authenticate('google', { session: false, failureRedirect: '/auth/login' }), auth_controller_1.default.googleCallback);
exports.default = router;
//# sourceMappingURL=auth_route.js.map