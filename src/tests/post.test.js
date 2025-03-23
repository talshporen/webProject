import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/Post";
import userModel from "../models/Users";
import { Express } from "express";

type User = {
  email: string;
  password: string;
  username?: string;
  accessToken?: string;
  _id?: string;
};

const testUser: User = {
  email: "test@user.com",
  password: "testpassword",
  username: "testuser",
};

var server: any;
let authToken: string;
let testUserId: string;

beforeAll(async () => {
  server = await initApp();
});

beforeEach(async () => {
  await postModel.deleteMany({});
  await userModel.deleteMany({});

  // Регистрируем и логиним тестового пользователя
  await request(server).post("/auth/register").send(testUser);
  const loginRes = await request(server).post("/auth/login").send({
    email: testUser.email,
    password: testUser.password,
  });
  expect(loginRes.statusCode).toBe(200);
  authToken = loginRes.body.accessToken;
  testUserId = loginRes.body._id;
});

afterAll(async () => {
  await server.close();
  await mongoose.disconnect();
});

describe("Additional Posts Tests", () => {
  test("should not create a post without required fields", async () => {
    const response = await request(server)
      .post("/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({});
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "All fields are required");
  });

  test("should not allow uploading an invalid image format", async () => {
    const response = await request(server)
    .post("/posts")
    .set("Authorization", `Bearer ${authToken}`)
    .field("title", "Test")
    .field("content", "Content")
    .field("author", testUserId)
    .attach("image", Buffer.from("test"), { filename: "test.txt", contentType: "text/plain" });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Only JPEG or PNG files are allowed");
  });

  test("should return 404 for a non-existent post", async () => {
    const response = await request(server).get("/posts/654321abcdef123456789abc");
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message", "Post not found");
  });

  test("should not update a non-existent post", async () => {
    const response = await request(server)
      .put("/posts/654321abcdef123456789abc")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Updated", content: "Updated content" });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message", "Post not found");
  });

  test("should not update a post without required fields", async () => {
    const createRes = await request(server)
      .post("/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Test", content: "Test content", author: testUserId });

    const postId = createRes.body._id;

    const response = await request(server)
      .put(`/posts/${postId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Title and content are required");
  });

  test("should return 404 when deleting a non-existent post", async () => {
    const response = await request(server)
      .delete("/posts/654321abcdef123456789abc")
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message", "Post not found");
  });

  test("should return 404 when liking a non-existent post", async () => {
    const response = await request(server)
      .post("/posts/654321abcdef123456789abc/like?userId=" + testUserId)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message", "Post not found");
  });
   
  test("should return 401 if userId is missing when liking a post", async () => {
    const createRes = await request(server)
      .post("/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Test Post", content: "Test content", author: testUserId });
  
    const postId = createRes.body._id;
  
    // Append an empty userId query parameter
    const response = await request(server)
      .post(`/posts/${postId}/like/${""}`)
    expect(response.statusCode).toBe(401);
  });

  test("should correctly increase and decrease likes count", async () => {
    const createRes = await request(server)
      .post("/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Test Post", content: "Test content", author: testUserId });

    const postId = createRes.body._id;

    // Like the post
    const likeRes1 = await request(server)
      .post(`/posts/${postId}/like?userId=${testUserId}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(likeRes1.statusCode).toBe(200);
    expect(likeRes1.body).toHaveProperty("likesCount", 1);

    // Unlike the post
    const likeRes2 = await request(server)
      .post(`/posts/${postId}/like?userId=${testUserId}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(likeRes2.statusCode).toBe(200);
    expect(likeRes2.body).toHaveProperty("likesCount", 0);
  
  });

  test("should return 404 when no posts found for the given sender ID", async () => {
    const response = await request(server)
      .get(`/posts/sender/${new mongoose.Types.ObjectId()}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message", "No posts found for this sender");
  });

  test("should return 500 if there is a database error", async () => {
    // סימולציה של תקלה במסד נתונים
    jest.spyOn(postModel, "find").mockRejectedValue(new Error("Database error"));

    const response = await request(server)
      .get(`/posts/sender/${testUserId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("message", "Error getting posts by sender ID");

    // שחזור הפונקציה המקורית
    jest.restoreAllMocks();
  });

  test("should return 404 when senderId is not a valid ObjectId", async () => {
    const response = await request(server)
      .get("/posts/sender/invalid-id")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(404); // Mongo יגרום לשגיאה בגלל ObjectId לא חוקי
  });
  test("should allow creating a post without an image", async () => {
    const response = await request(server)
      .post("/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Test Post Without Image",
        content: "Test Content",
        author: testUserId,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).not.toHaveProperty("imagePath");
  });

  test("should return 500 if an unexpected error occurs", async () => {
    jest.spyOn(postModel, "findById").mockImplementationOnce(() => {
      throw new Error("Database connection error");
    });
    const createRes = await request(server)
      .post("/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Test Post", content: "Test content", author: testUserId });

    const postId = createRes.body._id;

    const response = await request(server)
      .post(`/posts/${postId}/like?userId=${testUserId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("message", "Internal server error");
  });
  
  test("should return 404 if user not found", async () => {
    jest.spyOn(userModel, "findById").mockResolvedValueOnce(null);

    const createRes = await request(server)
      .post("/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Test Post", content: "Test content", author: testUserId });

    const postId = createRes.body._id;
  
    const response = await request(server)
      .post(`/posts/${postId}/like?userId=${testUserId}`)
      .set("Authorization", `Bearer ${authToken}`);
  
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message", "User not found");
  
    jest.restoreAllMocks(); // מחזיר את הפונקציה למצבה המקורי
  });
  
  test("should return 500 if there is a server error during deletion", async () => {
    jest.spyOn(postModel, "findByIdAndDelete").mockRejectedValueOnce(new Error("Database error"));
  
    const response = await request(server)
      .delete(`/posts/${testUserId}`)
      .set("Authorization", `Bearer ${authToken}`);
  
    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("message", "Error deleting post");
    expect(response.body).toHaveProperty("error", "Database error");
  
    jest.restoreAllMocks(); 
  });
    
});