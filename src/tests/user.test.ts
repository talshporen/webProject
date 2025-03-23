import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import userModel from "../models/Users";
import postModel from "../models/Post";

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

let server: any;
let authToken: string;
let testUserId: string;

beforeAll(async () => {
  server = await initApp();
});

beforeEach(async () => {
  await userModel.deleteMany({});
  await postModel.deleteMany({});

  // הרשמה והתחברות של משתמש בדיקות
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

describe("User Tests", () => {
  test("should return all users", async () => {
    const response = await request(server)
      .get("/api/users")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  test("should return user profile with posts", async () => {
    // יצירת פוסט לבדיקה
    await postModel.create({
      title: "Test Post",
      content: "Hello, this is a test post",
      author: testUser.username,
    });

    const response = await request(server)
      .get(`/api/users/profile?userId=${testUserId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body).toHaveProperty("posts");
    expect(response.body.user.username).toBe(testUser.username);
    expect(Array.isArray(response.body.posts)).toBe(true);
  });

  test("should return 404 if user not found in profile", async () => {
    const response = await request(server)
      .get(`/api/users/profile?userId=6565fdfd65fdfd6f5df6df5d`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("User not found.");
  });

  test("should update user profile successfully", async () => {
    const response = await request(server)
      .put(`/api/users/profile?userId=${testUserId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        username: "newUsername",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("User updated successfully");
    expect(response.body.user.username).toBe("newUsername");
  });

  test("should return 400 if username is missing", async () => {
    const response = await request(server)
      .put(`/api/users/profile?userId=${testUserId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Username is required.");
  });

  test("should return 409 if username is taken", async () => {
    // יצירת משתמש נוסף
    await request(server).post("/auth/register").send({
      email: "test2@user.com",
      password: "testpassword",
      username: "takenUsername",
    });

    const response = await request(server)
      .put(`/api/users/profile?userId=${testUserId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        username: "takenUsername",
      });

    expect(response.statusCode).toBe(409);
    expect(response.body.message).toBe("Username is already taken.");
  });
});
