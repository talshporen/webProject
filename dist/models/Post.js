"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const postSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    image: {
        type: String,
        default: "",
    },
    comments: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Comment",
        },
    ],
    likesCount: {
        type: Number,
        default: 0,
    },
});
const postModel = mongoose_1.default.model("Post", postSchema);
exports.default = postModel;
//# sourceMappingURL=Post.js.map