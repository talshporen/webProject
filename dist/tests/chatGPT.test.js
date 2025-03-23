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
const node_fetch_1 = __importDefault(require("node-fetch"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const chatGPT_controller_1 = require("../controllers/chatGPT_controller");
let app;
//onst OPENAI_API_KEY = process.env.OPENAI_API_KEY;
jest.mock("node-fetch");
const { Response } = jest.requireActual("node-fetch");
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    if (app && app.close) {
        yield app.close();
    }
    // Close mongoose connection if opened:
    const mongoose = require("mongoose");
    yield mongoose.disconnect();
    // Also clear any timers or intervals if necessary
}));
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    app = yield (0, server_1.default)();
}));
describe("chatWithGPT API Tests", () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        chatGPT_controller_1.cache.flushAll();
    }));
    it("should return an error if no message is provided", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post("/api/chatgpt")
            .send({});
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Message is required");
    }));
    it("should return a cached response if the message is in cache", () => __awaiter(void 0, void 0, void 0, function* () {
        const message = "Hello GPT!";
        const cachedResponse = "Cached response";
        chatGPT_controller_1.cache.set(message, cachedResponse);
        const response = yield (0, supertest_1.default)(app)
            .post("/api/chatgpt")
            .send({ message });
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe(cachedResponse);
    }));
    it("should call OpenAI API when message is not in cache", () => __awaiter(void 0, void 0, void 0, function* () {
        const message = "Hello GPT!";
        const gptResponse = {
            choices: [
                {
                    message: { content: "Hi, how can I help you?" },
                    finish_reason: "stop",
                    index: 0,
                },
            ],
        };
        // Mock של fetch כך שיחזיר תשובה לדימוי של OpenAI API
        node_fetch_1.default.mockResolvedValueOnce(new Response(JSON.stringify(gptResponse), { status: 200 }));
        const response = yield (0, supertest_1.default)(app)
            .post("/api/chatgpt")
            .send({ message });
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("Hi, how can I help you?");
        expect(node_fetch_1.default).toHaveBeenCalledTimes(1);
    }));
    it("should handle OpenAI API error gracefully", () => __awaiter(void 0, void 0, void 0, function* () {
        const message = "Hello GPT!";
        node_fetch_1.default.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 }));
        const response = yield (0, supertest_1.default)(app)
            .post("/api/chatgpt")
            .send({ message });
        expect(response.statusCode).toBe(400);
        expect(response.body.error.error).toBe("Invalid request");
    }));
    it("should return 500 if there is an error in the server or OpenAI API", () => __awaiter(void 0, void 0, void 0, function* () {
        const message = "Hello GPT!";
        // Mock של fetch שיחזיר שגיאה כלשהי
        node_fetch_1.default.mockRejectedValueOnce(new Error("Internal Server Error"));
        const response = yield (0, supertest_1.default)(app)
            .post("/api/chatgpt")
            .send({ message });
        expect(response.statusCode).toBe(500);
        expect(response.body.error).toBe("Internal server error");
    }));
});
//# sourceMappingURL=chatGPT.test.js.map