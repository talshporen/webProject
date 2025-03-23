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
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../server"));
const mongoose_1 = __importDefault(require("mongoose"));
const Comment_1 = __importDefault(require("../models/Comment"));
const Post_1 = __importDefault(require("../models/Post"));
const Users_1 = __importDefault(require("../models/Users"));
const testUser = {
    email: "test@user.com",
    password: "tpassword",
    username: "testuser",
};
let server;
let authToken;
let testUserId;
let testPostId;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    server = yield (0, server_1.default)();
}));
beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    yield Comment_1.default.deleteMany({});
    yield Post_1.default.deleteMany({});
    yield Users_1.default.deleteMany({});
    yield (0, supertest_1.default)(server).post("/auth/register").send(testUser);
    const loginRes = yield (0, supertest_1.default)(server).post("/auth/login").send({
        email: testUser.email,
        password: testUser.password,
    });
    expect(loginRes.statusCode).toBe(200);
    authToken = loginRes.body.accessToken;
    testUserId = loginRes.body._id;
    const postRes = yield (0, supertest_1.default)(server)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
        title: "Test Post",
        content: "Post content for comment tests",
        author: testUserId,
    });
    expect(postRes.statusCode).toBe(201);
    testPostId = postRes.body._id;
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield server.close();
    yield mongoose_1.default.disconnect();
}));
describe("Comments Tests", () => {
    test("should create a new comment", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            postId: testPostId,
            content: "This is a test comment",
            author: testUserId,
        });
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("_id");
        expect(response.body.content).toBe("This is a test comment");
    }));
    test("should get all comments", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            postId: testPostId,
            content: "First comment",
            author: testUserId,
        });
        yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            postId: testPostId,
            content: "Second comment",
            author: testUserId,
        });
        const response = yield (0, supertest_1.default)(server).get("/comments");
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(2);
    }));
    test("should get a comment by ID", () => __awaiter(void 0, void 0, void 0, function* () {
        const createRes = yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            postId: testPostId,
            content: "A comment to get",
            author: testUserId,
        });
        const commentId = createRes.body._id;
        const response = yield (0, supertest_1.default)(server).get(`/comments/${commentId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("_id", commentId);
    }));
    test("should update a comment", () => __awaiter(void 0, void 0, void 0, function* () {
        const createRes = yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            postId: testPostId,
            content: "Original comment",
            author: testUserId,
        });
        const commentId = createRes.body._id;
        const response = yield (0, supertest_1.default)(server)
            .put(`/comments/${commentId}`)
            .send({ content: "Updated comment" });
        expect(response.statusCode).toBe(200);
        expect(response.body.content).toBe("Updated comment");
    }));
    test("should delete a comment", () => __awaiter(void 0, void 0, void 0, function* () {
        const createRes = yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            postId: testPostId,
            content: "Comment to delete",
            author: testUserId,
        });
        const commentId = createRes.body._id;
        const deleteRes = yield (0, supertest_1.default)(server)
            .delete(`/comments/${commentId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(deleteRes.statusCode).toBe(200);
        const getRes = yield (0, supertest_1.default)(server).get(`/comments/${commentId}`);
        expect(getRes.statusCode).toBe(404);
    }));
    test("should get comments by post ID with pagination", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ postId: testPostId, content: "Comment 1", author: testUserId });
        yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ postId: testPostId, content: "Comment 2", author: testUserId });
        yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ postId: testPostId, content: "Comment 3", author: testUserId });
        const response = yield (0, supertest_1.default)(server)
            .get(`/comments/post/${testPostId}`)
            .query({ page: 1, limit: 2 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("results");
        expect(Array.isArray(response.body.results)).toBe(true);
    }));
    test("should return 401 for unauthorized access when no token is provided", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(server)
            .post("/comments")
            .send({
            postId: testPostId,
            content: "Unauthorized comment",
            author: testUserId,
        });
        expect(response.statusCode).toBe(401);
        if (response.error && 'text' in response.error) {
            expect(response.error.text).toEqual("Access Denied");
        }
    }));
    // 
    test("should return 404 for non-existing comment", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(server).get(`/comments/${new mongoose_1.default.Types.ObjectId()}`);
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("message", "Comment not found");
    }));
    test("should handle empty content when updating a comment", () => __awaiter(void 0, void 0, void 0, function* () {
        const createRes = yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            postId: testPostId,
            content: "Original comment",
            author: testUserId,
        });
        const commentId = createRes.body._id;
        const updateRes = yield (0, supertest_1.default)(server)
            .put(`/comments/${commentId}`)
            .set("Authorization", `Bearer ${authToken}`) // הוספת הרשאה
            .send({ content: null }); // נשלח null במקום רווח ריק
        expect(updateRes.statusCode).toBe(400);
        expect(updateRes.body).toHaveProperty("message", "Comment ID and content are required");
    }));
    test("should return 404 when trying to create a comment for a non-existing post", () => __awaiter(void 0, void 0, void 0, function* () {
        const nonExistingPostId = new mongoose_1.default.Types.ObjectId().toString();
        const response = yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            postId: nonExistingPostId,
            content: "Comment for non-existing post",
            author: testUserId,
        });
        console.log("Response status:", response.statusCode);
        console.log("Response body:", response.body);
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("message", "Post not found");
    }));
    test("should return 400 when creating a comment with empty content", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            postId: testPostId,
            content: "",
            author: testUserId,
        });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("message", "all fields are required");
    }));
    test("should return 404 when deleting a non-existing comment", () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeCommentId = new mongoose_1.default.Types.ObjectId().toString();
        const response = yield (0, supertest_1.default)(server)
            .delete(`/comments/${fakeCommentId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("message", "Comment not found");
    }));
    test("should return 404 when updating a non-existing comment", () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeCommentId = new mongoose_1.default.Types.ObjectId().toString();
        const response = yield (0, supertest_1.default)(server)
            .put(`/comments/${fakeCommentId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ content: "Updated comment" });
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("message", "Comment not found");
    }));
    test("should return 401 when creating a comment with invalid token", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer invalidToken`)
            .send({
            postId: testPostId,
            content: "This should not be created",
            author: testUserId,
        });
        expect(response.statusCode).toBe(401);
        if (response.error && 'text' in response.error) {
            expect(response.error.text).toEqual("Access Denied");
        }
    }));
    test("should return 400 when creating a comment with invalid postId format", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            postId: "12345", // Invalid ObjectId format
            content: "Invalid post ID",
            author: testUserId,
        });
        expect(response.statusCode).toBe(500);
        expect(response.body).toHaveProperty("message", "Error creating comment");
    }));
    test("should return 404 when creating a comment with a non-existing author", () => __awaiter(void 0, void 0, void 0, function* () {
        const nonExistingUserId = new mongoose_1.default.Types.ObjectId().toString();
        const response = yield (0, supertest_1.default)(server)
            .post("/comments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            postId: testPostId,
            content: "This author does not exist",
            author: nonExistingUserId,
        });
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("message", "User not found");
    }));
    test("should return an empty results array when no comments exist for a post", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(server)
            .get(`/comments/post/${testPostId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.results)).toBe(true);
        expect(response.body.results.length).toBe(0); // מצפה למערך ריק
    }));
    test("should return 400 if postId is not provided", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(server)
            .post("/comments/generate")
            .set("Authorization", `Bearer ${authToken}`)
            .send({}); // שליחה של בקשה בלי postId
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("message", "postId is a required parameter");
    }));
});
//# sourceMappingURL=comment.test.js.map