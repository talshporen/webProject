import request from "supertest";
import initApp from "../server";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
import { cache } from "../controllers/chatGPT_controller";
let app: any;


//onst OPENAI_API_KEY = process.env.OPENAI_API_KEY;
jest.mock("node-fetch");
const { Response } = jest.requireActual("node-fetch");
afterAll(async () => {

    if (app && app.close) {
      await app.close();
    }
  
    // Close mongoose connection if opened:
    const mongoose = require("mongoose");
    await mongoose.disconnect();
  
    // Also clear any timers or intervals if necessary
  });
  beforeAll(async () => {
    app = await initApp();
    });
describe("chatWithGPT API Tests", () => {
  

  beforeEach( async() => {
  

    cache.flushAll(); 
  });

  it("should return an error if no message is provided", async () => {
    const response = await request(app)
      .post("/api/chatgpt") 
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Message is required");
  });

  it("should return a cached response if the message is in cache", async () => {
    const message = "Hello GPT!";
    const cachedResponse = "Cached response";

    
    cache.set(message, cachedResponse);

    const response = await request(app)
      .post("/api/chatgpt")
      .send({ message });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(cachedResponse);
  });

  it("should call OpenAI API when message is not in cache", async () => {
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
    (fetch as unknown as jest.Mock).mockResolvedValueOnce(new Response(JSON.stringify(gptResponse), { status: 200 }));

    const response = await request(app)
      .post("/api/chatgpt")
      .send({ message });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Hi, how can I help you?");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("should handle OpenAI API error gracefully", async () => {
    const message = "Hello GPT!";

    (fetch as unknown as jest.Mock).mockResolvedValueOnce(new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 }));

    const response = await request(app)
      .post("/api/chatgpt")
      .send({ message });

    expect(response.statusCode).toBe(400);
    expect(response.body.error.error).toBe("Invalid request");
  });

  it("should return 500 if there is an error in the server or OpenAI API", async () => {
    const message = "Hello GPT!";

    // Mock של fetch שיחזיר שגיאה כלשהי
    (fetch as unknown as jest.Mock).mockRejectedValueOnce(new Error("Internal Server Error"));

    const response = await request(app)
      .post("/api/chatgpt")
      .send({ message });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Internal server error");
  });
});
