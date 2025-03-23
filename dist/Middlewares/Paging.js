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
exports.paginatedResults = paginatedResults;
const Users_1 = __importDefault(require("../models/Users"));
function paginatedResults(model) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        console.log("🔹 New pagination request received.");
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sort = req.query.sort ? JSON.parse(req.query.sort) : { createdAt: -1 }; // Default sorting
        const filter = req.query.filter ? JSON.parse(req.query.filter) : {}; // Default to no filter
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const results = { results: [] };
        const userId = req.query.userId; // Assuming userId is sent in the route
        try {
            const totalDocuments = yield model.countDocuments(filter).exec(); // Count only filtered documents
            if (endIndex < totalDocuments) {
                results.next = { page: page + 1, limit };
            }
            if (startIndex > 0) {
                results.previous = { page: page - 1, limit };
            }
            // Fetch paginated posts
            const fetchedResults = yield model
                .find(filter)
                .sort(sort)
                .limit(limit)
                .skip(startIndex)
                .exec();
            if (userId) {
                const user = yield Users_1.default.findById(userId).lean();
                if (user && user.likedPosts) {
                    const likedPostIds = user.likedPosts.map((id) => id.toString()); // Convert to strings for comparison
                    results.results = fetchedResults.map((post) => {
                        const postObject = post.toObject(); // Extend the type to include `isLiked`
                        return Object.assign(Object.assign({}, postObject), { isLiked: likedPostIds.includes(post._id.toString()) });
                    });
                }
                else {
                    results.results = fetchedResults.map((post) => post.toObject()); // Default conversion if no userId or likedPosts
                }
            }
            else {
                results.results = fetchedResults.map((post) => post.toObject()); // Convert to plain object
            }
            res.locals.paginatedResults = results;
            next();
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    });
}
//# sourceMappingURL=Paging.js.map