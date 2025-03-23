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
const postModel = require('../models/posts_model');
const getAllPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerFilter = req.query.owner;
    try {
        if (ownerFilter) {
            const posts = yield postModel.find({ owner: ownerFilter });
            res.status(200).send(posts);
        }
        else {
            const posts = yield postModel.find();
            res.status(200).send(posts);
        }
    }
    catch (error) {
        res.status(400).send(error.mesege);
    }
});
const getPostById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const postId = req.params.id;
    try {
        const post = yield postModel.findById(postId);
        res.status(200).send(post);
    }
    catch (error) {
        res.status(400).send(error.mesege);
    }
});
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const post = req.body;
    try {
        const newPost = yield postModel.create(post);
        res.status(201).send(newPost);
    }
    catch (error) {
        res.status(400).send(error);
    }
});
const deletePostById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const postId = req.params.id;
    try {
        const post = yield postModel.findByIdAndDelete(postId);
        res.status(200).send(post);
    }
    catch (error) {
        res.status(204).send(error.message);
    }
});
module.exports = {
    getAllPosts,
    createPost,
    getPostById,
    deletePostById
};
//# sourceMappingURL=posts_controller.js.map