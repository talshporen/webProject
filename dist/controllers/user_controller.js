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
exports.upload = exports.updateUserProfile = exports.getUserProfile = exports.getAllUsers = void 0;
const Users_1 = __importDefault(require("../models/Users"));
const Post_1 = __importDefault(require("../models/Post"));
const multer_1 = __importDefault(require("multer"));
const SERVER_CONNECT = process.env.SERVER_CONNECT;
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = (0, multer_1.default)({ storage });
exports.upload = upload;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield Users_1.default.find();
        res.json(users);
    }
    catch (error) {
        const errorMessage = error.message;
        res.status(500).json({ message: "Error fetching users", error: errorMessage });
    }
});
exports.getAllUsers = getAllUsers;
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.query.userId;
        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 5;
        const user = yield Users_1.default.findById(userId).select("-password");
        if (!user) {
            res.status(404).json({ message: "User not found." });
            return;
        }
        const filter = { author: user.username };
        const skipCount = (page - 1) * limit;
        const totalPosts = yield Post_1.default.countDocuments(filter);
        const posts = yield Post_1.default
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skipCount)
            .limit(limit);
        const hasMorePosts = skipCount + posts.length < totalPosts;
        res.status(200).json({
            user,
            posts,
            hasMorePosts,
        });
    }
    catch (err) {
        res.status(500).json({ message: "Server Error." });
    }
});
exports.getUserProfile = getUserProfile;
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.query.userId;
    const { username } = req.body;
    // טיפול בהעלאת תמונה אם קיימת
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : undefined;
    try {
        if (!username) {
            res.status(400).json({ message: 'Username is required.' });
            return;
        }
        const existingUser = yield Users_1.default.findOne({ username, _id: { $ne: userId } });
        if (existingUser) {
            res.status(409).json({ message: 'Username is already taken.' });
            return;
        }
        const user = yield Users_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        const oldUsername = user.username;
        user.username = username;
        if (profilePicture) {
            user.profilePicture = `${SERVER_CONNECT}${profilePicture}`; // עדכון תמונה עם URL המלא
        }
        yield user.save();
        const updateResult = yield Post_1.default.updateMany({ author: oldUsername }, { $set: { author: username } });
        res.status(200).json({
            message: 'User updated successfully',
            user,
            updatedPostsCount: updateResult.modifiedCount
        });
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});
exports.updateUserProfile = updateUserProfile;
//# sourceMappingURL=user_controller.js.map