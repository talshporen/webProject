"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false,
    },
    profilePicture: {
        type: String,
        default: ''
    },
    posts: [{
            type: mongoose_1.default.Types.ObjectId,
            ref: 'Post'
        }],
    refreshToken: {
        type: [String],
        default: [],
    },
    likedPosts: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Post",
        },
    ],
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
});
const userModel = mongoose_1.default.model("Users", userSchema);
exports.default = userModel;
//# sourceMappingURL=Users.js.map