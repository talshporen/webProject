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
exports.chatWithGPT = exports.cache = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const node_cache_1 = __importDefault(require("node-cache"));
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    throw new Error("Missing OpenAI API Key in environment variables");
}
exports.cache = new node_cache_1.default({ stdTTL: 3600 });
const chatWithGPT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { message, store } = req.body;
    if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
    }
    const cachedResponse = exports.cache.get(message);
    if (cachedResponse) {
        res.json({ message: cachedResponse });
        return;
    }
    try {
        const response = yield (0, node_fetch_1.default)("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are an AI assistant for doctors. Your task is to provide concise, accurate, and relevant answers to medical questions. Focus on health-related topics, and avoid giving personal advice or recommending specific treatments unless asked.",
                    },
                    {
                        role: "user",
                        content: message,
                    },
                ],
                max_tokens: 250,
            }),
        });
        if (!response.ok) {
            const errorData = yield response.json();
            if (process.env.NODE_ENV !== "test") {
                console.error("OpenAI API Error:", errorData.error);
            }
            res.status(response.status).json({ error: errorData });
            return;
        }
        const data = (yield response.json());
        let gptMessage = ((_c = (_b = (_a = data.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim()) || "";
        gptMessage = gptMessage.replace(/recommended comment[:]?/gi, "").trim();
        gptMessage = gptMessage.replace(/^"(.*)"$/, "$1").trim();
        exports.cache.set(message, gptMessage);
        res.json({ message: gptMessage });
    }
    catch (error) {
        if (process.env.NODE_ENV !== "test") {
            console.error("Error communicating with OpenAI API:", error);
        }
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.chatWithGPT = chatWithGPT;
//# sourceMappingURL=chatGPT_controller.js.map