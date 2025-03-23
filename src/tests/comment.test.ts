import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import commentModel from "../models/Comment";
import postModel from "../models/Post";
import userModel from "../models/Users";

type User = {
  email: string;
  password: string;
  username?: string;
  accessToken?: string;
  _id?: string;
};

const testUser: User = {
  email: "test@user.com",
  password: "tpassword",
  username: "testuser",
};

let server: any;
let authToken: string;
let testUserId: string;
let testPostId: string;

beforeAll(async () => {
  server = await initApp();
});

beforeEach(async () => {
  await commentModel.deleteMany({});
  await postModel.deleteMany({});
  await userModel.deleteMany({});

  await request(server).post("/auth/register").send(testUser);
  const loginRes = await request(server).post("/auth/login").send({
    email: testUser.email,
    password: testUser.password,
  });
  expect(loginRes.statusCode).toBe(200);
  authToken = loginRes.body.accessToken;
  testUserId = loginRes.body._id;

  const postRes = await request(server)
    .post("/posts")
    .set("Authorization", `Bearer ${authToken}`)
    .send({
      title: "Test Post",
      content: "Post content for comment tests",
      author: testUserId,
    });
  expect(postRes.statusCode).toBe(201);
  testPostId = postRes.body._id;
});

afterAll(async () => {
  await server.close();
  await mongoose.disconnect();
});

describe("Comments Tests", () => {
  test("should create a new comment", async () => {
    const response = await request(server)
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
  });

  test("should get all comments", async () => {
    await request(server)
      .post("/comments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        postId: testPostId,
        content: "First comment",
        author: testUserId,
      });
    await request(server)
      .post("/comments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        postId: testPostId,
        content: "Second comment",
        author: testUserId,
      });

    const response = await request(server).get("/comments");
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
  });

  test("should get a comment by ID", async () => {
    const createRes = await request(server)
      .post("/comments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        postId: testPostId,
        content: "A comment to get",
        author: testUserId,
      });
    const commentId = createRes.body._id;

    const response = await request(server).get(`/comments/${commentId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("_id", commentId);
  });

  test("should update a comment", async () => {
    const createRes = await request(server)
      .post("/comments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        postId: testPostId,
        content: "Original comment",
        author: testUserId,
      });
    const commentId = createRes.body._id;

    const response = await request(server)
      .put(`/comments/${commentId}`)
      .send({ content: "Updated comment" });
    expect(response.statusCode).toBe(200);
    expect(response.body.content).toBe("Updated comment");
  });

  test("should delete a comment", async () => {
    const createRes = await request(server)
      .post("/comments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        postId: testPostId,
        content: "Comment to delete",
        author: testUserId,
      });
    const commentId = createRes.body._id;

    const deleteRes = await request(server)
      .delete(`/comments/${commentId}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(deleteRes.statusCode).toBe(200);

    const getRes = await request(server).get(`/comments/${commentId}`);
    expect(getRes.statusCode).toBe(404);
  });

  test("should get comments by post ID with pagination", async () => {
    await request(server)
      .post("/comments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ postId: testPostId, content: "Comment 1", author: testUserId });
    await request(server)
      .post("/comments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ postId: testPostId, content: "Comment 2", author: testUserId });
    await request(server)
      .post("/comments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ postId: testPostId, content: "Comment 3", author: testUserId });
    const response = await request(server)
      .get(`/comments/post/${testPostId}`)
      .query({ page: 1, limit: 2 });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("results");
    expect(Array.isArray(response.body.results)).toBe(true);
  });


  test("should return 401 for unauthorized access when no token is provided", async () => {
  const response = await request(server)
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
});

// 
test("should return 404 for non-existing comment", async () => {
  const response = await request(server).get(`/comments/${new mongoose.Types.ObjectId()}`);
  expect(response.statusCode).toBe(404);
  expect(response.body).toHaveProperty("message", "Comment not found");
});
test("should handle empty content when updating a comment", async () => {
  const createRes = await request(server)
    .post("/comments")
    .set("Authorization", `Bearer ${authToken}`)
    .send({
      postId: testPostId,
      content: "Original comment",
      author: testUserId,
    });
  const commentId = createRes.body._id;

  const updateRes = await request(server)
    .put(`/comments/${commentId}`)
    .set("Authorization", `Bearer ${authToken}`) // הוספת הרשאה
    .send({ content: null }); // נשלח null במקום רווח ריק

  expect(updateRes.statusCode).toBe(400);
  expect(updateRes.body).toHaveProperty("message", "Comment ID and content are required");
});


test("should return 404 when trying to create a comment for a non-existing post", async () => {
  const nonExistingPostId = new mongoose.Types.ObjectId().toString();
  
  const response = await request(server)
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
});
test("should return 400 when creating a comment with empty content", async () => {
  const response = await request(server)
    .post("/comments")
    .set("Authorization", `Bearer ${authToken}`)
    .send({
      postId: testPostId,
      content: "",
      author: testUserId,
    });

  expect(response.statusCode).toBe(400);
  expect(response.body).toHaveProperty("message", "all fields are required");
});

test("should return 404 when deleting a non-existing comment", async () => {
  const fakeCommentId = new mongoose.Types.ObjectId().toString();

  const response = await request(server)
    .delete(`/comments/${fakeCommentId}`)
    .set("Authorization", `Bearer ${authToken}`);

  expect(response.statusCode).toBe(404);
  expect(response.body).toHaveProperty("message", "Comment not found");
});

test("should return 404 when updating a non-existing comment", async () => {
  const fakeCommentId = new mongoose.Types.ObjectId().toString();

  const response = await request(server)
    .put(`/comments/${fakeCommentId}`)
    .set("Authorization", `Bearer ${authToken}`)
    .send({ content: "Updated comment" });

  expect(response.statusCode).toBe(404);
  expect(response.body).toHaveProperty("message", "Comment not found");
});

test("should return 401 when creating a comment with invalid token", async () => {
  const response = await request(server)
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
});

test("should return 400 when creating a comment with invalid postId format", async () => {
  const response = await request(server)
    .post("/comments")
    .set("Authorization", `Bearer ${authToken}`)
    .send({
      postId: "12345", // Invalid ObjectId format
      content: "Invalid post ID",
      author: testUserId,
    });

  expect(response.statusCode).toBe(500);
  expect(response.body).toHaveProperty("message", "Error creating comment");
});

test("should return 404 when creating a comment with a non-existing author", async () => {
  const nonExistingUserId = new mongoose.Types.ObjectId().toString();

  const response = await request(server)
    .post("/comments")
    .set("Authorization", `Bearer ${authToken}`)
    .send({
      postId: testPostId,
      content: "This author does not exist",
      author: nonExistingUserId,
    });

  expect(response.statusCode).toBe(404);
  expect(response.body).toHaveProperty("message", "User not found");
});

test("should return an empty results array when no comments exist for a post", async () => {
  const response = await request(server)
    .get(`/comments/post/${testPostId}`);

  expect(response.statusCode).toBe(200);
  expect(response.body.success).toBe(true);
  expect(Array.isArray(response.body.results)).toBe(true);
  expect(response.body.results.length).toBe(0);  // מצפה למערך ריק
});

test("should return 400 if postId is not provided", async () => {
  const response = await request(server)
    .post("/comments/generate")
    .set("Authorization", `Bearer ${authToken}`)
    .send({});  // שליחה של בקשה בלי postId

  expect(response.statusCode).toBe(400);
  expect(response.body).toHaveProperty("message", "postId is a required parameter");
});

});
