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
const Post_1 = __importDefault(require("../models/Post"));
const Users_1 = __importDefault(require("../models/Users"));
const baseUrl = "/auth";
const testUser = {
    email: "test@user.com",
    password: "testpassword",
    username: "testuser",
    profilePicture: "",
    posts: []
};
let server;
beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    yield Users_1.default.deleteMany({});
}));
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    server = yield (0, server_1.default)();
    // Clean existing posts and users before seeding
    yield Post_1.default.deleteMany({});
    yield Users_1.default.deleteMany({});
    // Seed 15 posts for paging tests
    const response3 = yield (0, supertest_1.default)(server).post(baseUrl + "/register").send(testUser);
    const response = yield (0, supertest_1.default)(server).post(baseUrl + "/login").send({
        email: testUser.email,
        password: testUser.password,
    });
    for (let i = 1; i <= 15; i++) {
        yield (0, supertest_1.default)(server)
            .post("/posts")
            .set("Authorization", `Bearer ${response.body.accessToken}`)
            .send({ title: `Test Post ${i}`, content: "Lorem ipsum", author: "test-author" });
    }
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Clean up test posts and users
    yield Post_1.default.deleteMany({});
    yield Users_1.default.deleteMany({});
    yield server.close();
    yield mongoose_1.default.disconnect();
}));
describe("Paging API Tests - Liked Posts", () => {
    it("should mark posts as liked when user exists with likedPosts", () => __awaiter(void 0, void 0, void 0, function* () {
        const postsInDB = yield Post_1.default.find({});
        expect(postsInDB.length).toBeGreaterThan(0);
        const likedPostId = postsInDB[0].id.toString();
        const userWithLikes = yield Users_1.default.create(Object.assign(Object.assign({}, testUser), { _id: new mongoose_1.default.Types.ObjectId("611111111111111111111111"), likedPosts: [likedPostId] }));
        // Call /posts with the userId query parameter.
        const response = yield (0, supertest_1.default)(server).get(`/posts?userId=${userWithLikes._id}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("results");
        expect(Array.isArray(response.body.results)).toBe(true);
        // For each returned post, if the post _id equals the likedPostId, then isLiked should be true.
        response.body.results.forEach((post) => {
            if (post._id.toString() === likedPostId) {
                expect(post).toHaveProperty("isLiked", true);
            }
            else {
                expect(post).toHaveProperty("isLiked", false);
            }
        });
    }));
    it("should not annotate posts with isLiked when user exists without likedPosts", () => __awaiter(void 0, void 0, void 0, function* () {
        const userWithoutLikes = yield Users_1.default.create(Object.assign(Object.assign({}, testUser), { _id: new mongoose_1.default.Types.ObjectId("622222222222222222222222") }));
        const response = yield (0, supertest_1.default)(server).get(`/posts?userId=${userWithoutLikes.id}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("results");
        expect(Array.isArray(response.body.results)).toBe(true);
        response.body.results.forEach((post) => {
            expect(post.isLiked).toEqual(false);
        });
    }));
});
//# sourceMappingURL=paging.test.js.map