import express from "express";
import {
  getAllPosts,
  createPost,
  deletePost,
  likeUnLikePost,
  commentOnPost,
  getLikedPosts,
  getFollowingPosts,
  getUserPosts,
} from "../controllers/post.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/all/:page", protectRoute, getAllPosts);
router.get("/following/:page", protectRoute, getFollowingPosts);
router.get("/likes/:id/:page", protectRoute, getLikedPosts);
router.get("/user/:username/:page", protectRoute, getUserPosts);
router.post("/create", protectRoute, createPost);
router.post("/like/:id", protectRoute, likeUnLikePost);
router.post("/comment/:id", protectRoute, commentOnPost);
router.delete("/:id", protectRoute, deletePost);

export default router;
