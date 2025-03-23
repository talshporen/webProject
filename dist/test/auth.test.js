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
const auth_controller_1 = __importDefault(require("../controllers/auth_controller"));
const testUser = {
    email: "test@user.com",
    password: "testpassword",
    username: "testuser",
    profilePicture: "",
    posts: []
};
const baseUrl = "/auth";
let app;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("beforeAll");
    app = yield (0, server_1.default)();
    yield Users_1.default.deleteMany({});
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("afterAll");
    yield Post_1.default.deleteMany({});
    yield Users_1.default.deleteMany({});
    yield mongoose_1.default.disconnect();
    app.close();
}));
describe("Auth Tests", () => {
    test("Auth test register", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/register").send(testUser);
        expect(response.statusCode).toBe(201);
    }));
    test("Auth test register fail when user already exists", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(app).post(baseUrl + "/register").send(testUser);
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/register").send(testUser);
        expect(response.statusCode).not.toBe(201);
    }));
    test("Auth test register fail with invalid data", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/register").send({
            email: "invalidEmail",
        });
        expect(response.statusCode).not.toBe(201);
        const response2 = yield (0, supertest_1.default)(app).post(baseUrl + "/register").send({
            email: "",
            password: "sdfsd",
        });
        expect(response2.statusCode).not.toBe(201);
    }));
    test("Auth test login", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(app).post(baseUrl + "/register").send(testUser);
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send({
            email: testUser.email,
            password: testUser.password,
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
        expect(response.body._id).toBeDefined();
        testUser.accessToken = response.body.accessToken;
        testUser.refreshToken = response.body.refreshToken;
        testUser._id = response.body._id;
    }));
    test("Check tokens are not the same on subsequent login", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send({
            email: testUser.email,
            password: testUser.password,
        });
        const newAccessToken = response.body.accessToken;
        const newRefreshToken = response.body.refreshToken;
        expect(newAccessToken).not.toBe(testUser.accessToken);
        expect(newRefreshToken).not.toBe(testUser.refreshToken);
    }));
    test("Auth test login fail with wrong credentials", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send({
            email: testUser.email,
            password: "wrongpassword",
        });
        expect(response.statusCode).not.toBe(200);
        const response2 = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send({
            email: "nonexistent@user.com",
            password: "wrongpassword",
        });
        expect(response2.statusCode).not.toBe(200);
    }));
    test("Test refresh token", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/refresh").send({
            refreshToken: testUser.refreshToken,
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
        testUser.accessToken = response.body.accessToken;
        testUser.refreshToken = response.body.refreshToken;
    }));
    /*
      test("Double use refresh token should fail", async () => {
        const response = await request(app).post(baseUrl + "/refresh").send({
          refreshToken: testUser.refreshToken,
        });
        expect(response.statusCode).toBe(200);
        const newRefreshToken = response.body.refreshToken;
    
        const response2 = await request(app).post(baseUrl + "/refresh").send({
          refreshToken: testUser.refreshToken,
        });
        expect(response2.statusCode).not.toBe(200);
    
        const response3 = await request(app).post(baseUrl + "/refresh").send({
          refreshToken: newRefreshToken,
        });
        expect(response3.statusCode).not.toBe(200);
      });
    
      */
    test("Auth test logout", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send(testUser);
        expect(response.statusCode).toBe(200);
        testUser.accessToken = response.body.accessToken;
        testUser.refreshToken = response.body.refreshToken;
        const response2 = yield (0, supertest_1.default)(app).post(baseUrl + "/logout").send({
            refreshToken: testUser.refreshToken,
        });
        expect(response2.statusCode).toBe(200);
        const response3 = yield (0, supertest_1.default)(app).post(baseUrl + "/refresh").send({
            refreshToken: testUser.refreshToken,
        });
        expect(response3.statusCode).not.toBe(200);
    }));
    test("Test timeout token", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send(testUser);
        expect(response.statusCode).toBe(200);
        testUser.accessToken = response.body.accessToken;
        testUser.refreshToken = response.body.refreshToken;
        yield new Promise((resolve) => setTimeout(resolve, 5000));
        const response2 = yield (0, supertest_1.default)(app)
            .post("/posts")
            .set({ authorization: "JWT " + testUser.accessToken })
            .send({
            title: "Test Post",
            content: "Test Content",
            author: "invalid",
        });
        expect(response2.statusCode).not.toBe(201);
        const response3 = yield (0, supertest_1.default)(app).post(baseUrl + "/refresh").send({
            refreshToken: testUser.refreshToken,
        });
        expect(response3.statusCode).toBe(200);
        testUser.accessToken = response3.body.accessToken;
        const response4 = yield (0, supertest_1.default)(app)
            .post("/posts")
            .set({ authorization: "JWT " + testUser.accessToken })
            .send({
            title: "Test Post",
            content: "Test Content",
            author: "invalid",
        });
        expect(response4.statusCode).toBe(201);
    }));
    test("Test verifyRefreshToken user fail", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/refresh").send({});
        expect(response.statusCode).not.toBe(200);
    }));
    test("should return error if TOKEN_SECRET is not set", () => __awaiter(void 0, void 0, void 0, function* () {
        const oldTokenSecret = process.env.TOKEN_SECRET;
        delete process.env.TOKEN_SECRET;
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send(testUser);
        expect(response.statusCode).not.toBe(200);
        process.env.TOKEN_SECRET = oldTokenSecret;
    }));
    test("Create post should fail if TOKEN_SECRET is not set", () => __awaiter(void 0, void 0, void 0, function* () {
        const oldTokenSecret = process.env.TOKEN_SECRET;
        delete process.env.TOKEN_SECRET;
        const response = yield (0, supertest_1.default)(app)
            .post("/posts")
            .set({ authorization: "JWT " + testUser.accessToken })
            .send({
            title: "Test Post",
            content: "Test Content",
            author: "invalid",
        });
        expect(response.statusCode).not.toBe(201);
        process.env.TOKEN_SECRET = oldTokenSecret;
    }));
    test("Test verifyRefreshToken with invalid token", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/refresh").send({
            refreshToken: "invalidToken",
        });
        expect(response.statusCode).not.toBe(200);
    }));
    test("Test refresh with valid token not in user's token list", () => __awaiter(void 0, void 0, void 0, function* () {
        // Register a new user
        const newUser = {
            username: "refreshFail",
            email: "refreshfail@user.com",
            password: "testpassword",
            profilePicture: "",
            posts: []
        };
        yield (0, supertest_1.default)(app).post(baseUrl + "/register").send(newUser);
        const loginResponse = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send({
            email: newUser.email,
            password: newUser.password,
        });
        expect(loginResponse.statusCode).toBe(200);
        // Generate a refresh token manually that is valid but not stored in the user's refreshToken list
        const refreshResponse = yield (0, supertest_1.default)(app).post(baseUrl + "/refresh").send({
            refreshToken: 'fakeRefreshToken',
        });
        expect(refreshResponse.statusCode).not.toBe(200);
    }));
    test("Auth test login fail with missing password", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post(baseUrl + "/login")
            .send({ email: testUser.email });
        expect(response.statusCode).not.toBe(200);
    }));
    test("Auth test login fail with missing email", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post(baseUrl + "/login")
            .send({ password: testUser.password });
        expect(response.statusCode).not.toBe(200);
    }));
    test("Auth test logout fail with missing refresh token", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post(baseUrl + "/logout")
            .send({});
        expect(response.statusCode).not.toBe(200);
    }));
    test("Auth test logout fail with invalid refresh token", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post(baseUrl + "/logout")
            .send({ refreshToken: "invalidToken" });
        expect(response.statusCode).not.toBe(200);
    }));
    test("Auth test refresh fail with no token provided", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post(baseUrl + "/refresh")
            .send({});
        expect(response.statusCode).not.toBe(200);
    }));
    test("Auth test google login - missing user ID", () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeReq = {
            user: { _id: undefined, username: "googleUser" }
        };
        const fakeRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        yield auth_controller_1.default.googleCallback(fakeReq, fakeRes);
        expect(fakeRes.status).toHaveBeenCalledWith(500);
        expect(fakeRes.json).toHaveBeenCalledWith({ message: 'User ID is undefined' });
    }));
    test("Auth test google login - no token generated", () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeUser = { _id: "12345", username: "googleUser", refreshToken: [] };
        const fakeReq = { user: fakeUser };
        const fakeRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        yield auth_controller_1.default.googleCallback(fakeReq, fakeRes);
        expect(fakeRes.status).toHaveBeenCalledWith(500);
        expect(fakeRes.json).toHaveBeenCalledWith({ message: 'Error' });
    }));
    jest.setTimeout(10000);
});
//# sourceMappingURL=auth.test.js.map