import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/Post";
import userModel from "../models/Users";
const baseUrl = "/auth";

interface User {
  email: string;
  password: string;
  username: string;
  profilePicture: string;
  posts: any[];
  likedPosts?: string[];
}

const testUser: User = {
  email: "test@user.com",
  password: "testpassword",
  username: "testuser",
  profilePicture: "",
  posts: []
};

let server: any;
beforeEach(async () => {
    await userModel.deleteMany({});

  });
beforeAll(async () => {
  server = await initApp();

  // Clean existing posts and users before seeding
  await postModel.deleteMany({});
  await userModel.deleteMany({});

  // Seed 15 posts for paging tests
  const response3 = await request(server).post(baseUrl + "/register").send(testUser);
  const response = await request(server).post(baseUrl + "/login").send({
        email: testUser.email,
        password: testUser.password,
      });
  for (let i = 1; i <= 15; i++) {
    await request(server)
      .post("/posts")
      .set("Authorization", `Bearer ${response.body.accessToken}`)
      .send({ title: `Test Post ${i}`, content: "Lorem ipsum", author: "test-author" });
  }
});

afterAll(async () => {
  // Clean up test posts and users
  await postModel.deleteMany({});
  await userModel.deleteMany({});

  await server.close();
  await mongoose.disconnect();
});

describe("Paging API Tests - Liked Posts", () => {
  it("should mark posts as liked when user exists with likedPosts", async () => {
    const postsInDB = await postModel.find({});
    expect(postsInDB.length).toBeGreaterThan(0);
    const likedPostId = postsInDB[0].id.toString();

    const userWithLikes = await userModel.create({
      ...testUser,
      _id: new mongoose.Types.ObjectId("611111111111111111111111"),
      likedPosts: [likedPostId]
    });

    // Call /posts with the userId query parameter.
    const response = await request(server).get(`/posts?userId=${userWithLikes._id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(Array.isArray(response.body.results)).toBe(true);

    // For each returned post, if the post _id equals the likedPostId, then isLiked should be true.
    response.body.results.forEach((post: any) => {
      if (post._id.toString() === likedPostId) {
        expect(post).toHaveProperty("isLiked", true);
      } else {
        expect(post).toHaveProperty("isLiked", false);
      }
    });
  });

  it("should not annotate posts with isLiked when user exists without likedPosts", async () => {
    const userWithoutLikes = await userModel.create({
      ...testUser,
      _id: new mongoose.Types.ObjectId("622222222222222222222222")
    });

    const response = await request(server).get(`/posts?userId=${userWithoutLikes.id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(Array.isArray(response.body.results)).toBe(true);

    response.body.results.forEach((post: any) => {
      expect(post.isLiked).toEqual(false);
    });
  });
});