"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatGPT_controller_1 = require("../controllers/chatGPT_controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: ChatGPT
 *   description: The ChatGPT API
 */
/**
 * @swagger
 * /chatgpt:
 *   post:
 *     summary: Chat with GPT-3.5 Turbo
 *     tags: [ChatGPT]
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The user's message to send to GPT.
 *               store:
 *                 type: boolean
 *                 description: Optional flag to indicate whether to store the conversation (not used in this example).
 *             required:
 *               - message
 *     responses:
 *       200:
 *         description: Successfully received response from GPT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The reply from GPT.
 *                   example: "Hello, how can I help you today?"
 *       400:
 *         description: Bad request (e.g. missing message).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Message is required"
 *       500:
 *         description: Server error or error communicating with OpenAI API.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post("/chatgpt", chatGPT_controller_1.chatWithGPT);
exports.default = router;
//# sourceMappingURL=chatgpt_route.js.map