const express = require('express');
const router = express.Router();
const postService = require('./post.service');
const { isAuthenticated } = require("../middlewares");

router.get('/', isAuthenticated(), postService.getPosts);
router.get("/:id", isAuthenticated(), postService.getPost);
router.post("/", isAuthenticated(), postService.addPost);
router.patch("/:id", isAuthenticated(), postService.modifyPost)
module.exports = router;
