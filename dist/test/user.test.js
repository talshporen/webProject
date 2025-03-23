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
const Users_1 = __importDefault(require("../models/Users"));
const Post_1 = __importDefault(require("../models/Post"));
const testUser = {
    email: "test@user.com",
    password: "testpassword",
    username: "testuser",
};
let server;
let authToken;
let testUserId;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    server = yield (0, server_1.default)();
}));
beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    yield Users_1.default.deleteMany({});
    yield Post_1.default.deleteMany({});
    // הרשמה והתחברות של משתמש בדיקות
    yield (0, supertest_1.default)(server).post("/auth/register").send(testUser);
    const loginRes = yield (0, supertest_1.default)(server).post("/auth/login").send({
        email: testUser.email,
        password: testUser.password,
    });
    expect(loginRes.statusCode).toBe(200);
    authToken = loginRes.body.accessToken;
    testUserId = loginRes.body._id;
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield server.close();
    yield mongoose_1.default.disconnect();
}));
describe("User Tests", () => {
    test("should return all users", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(server)
            .get("/api/users")
            .set("Authorization", `Bearer ${authToken}`);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    }));
    test("should return user profile with posts", () => __awaiter(void 0, void 0, void 0, function* () {
        // יצירת פוסט לבדיקה
        yield Post_1.default.create({
            title: "Test Post",
            content: "Hello, this is a test post",
            author: testUser.username,
        });
        const response = yield (0, supertest_1.default)(server)
            .get(`/api/users/profile?userId=${testUserId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("user");
        expect(response.body).toHaveProperty("posts");
        expect(response.body.user.username).toBe(testUser.username);
        expect(Array.isArray(response.body.posts)).toBe(true);
    }));
    test("should return 404 if user not found in profile", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(server)
            .get(`/api/users/profile?userId=6565fdfd65fdfd6f5df6df5d`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe("User not found.");
    }));
    test("should update user profile successfully", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(server)
            .put(`/api/users/profile?userId=${testUserId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            username: "newUsername",
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("User updated successfully");
        expect(response.body.user.username).toBe("newUsername");
    }));
    test("should return 400 if username is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(server)
            .put(`/api/users/profile?userId=${testUserId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({});
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Username is required.");
    }));
    test("should return 409 if username is taken", () => __awaiter(void 0, void 0, void 0, function* () {
        // יצירת משתמש נוסף
        yield (0, supertest_1.default)(server).post("/auth/register").send({
            email: "test2@user.com",
            password: "testpassword",
            username: "takenUsername",
        });
        const response = yield (0, supertest_1.default)(server)
            .put(`/api/users/profile?userId=${testUserId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            username: "takenUsername",
        });
        expect(response.statusCode).toBe(409);
        expect(response.body.message).toBe("Username is already taken.");
    }));
});
//# sourceMappingURL=user.test.js.map