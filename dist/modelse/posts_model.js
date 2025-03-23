"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PostSchema = new Schema({
    owner: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: String
});
const PostModel = mongoose.model('Post', PostSchema);
module.exports = PostModel;
//# sourceMappingURL=posts_model.js.map