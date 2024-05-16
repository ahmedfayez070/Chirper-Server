import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import { v2 as cloudinary } from "cloudinary";

export const getAllPosts = async (req, res) => {
  const page = parseInt(req.params.page) - 1;

  try {
    const posts = await Post.find()
      .skip(page * 15)
      .limit(15)
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    if (posts.length === 0) return res.status(200).json([]);

    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ message: "Error with server" });
  }
};

export const createPost = async (req, res) => {
  const { text } = req.body;
  let { img } = req.body;
  const userId = req.user._id.toString();

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User Not Found" });

    if (!text && !img)
      return res
        .status(400)
        .json({ message: "Post must have img or text or both" });

    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({ user: userId, img, text });
    await newPost.save();

    return res.status(201).json(newPost);
  } catch (error) {
    return res.status(500).json({ message: "Error with server" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "No post found" });

    if (post.user.toString() !== req.user._id.toString())
      return res
        .status(401)
        .json({ message: "You can delete only your posts" });

    if (post.img) {
      await cloudinary.uploader.destroy(
        post.img.split("/").pop().split(".")[0]
      );
    }

    await Post.findByIdAndDelete(req.params.id);
    return res
      .status(200)
      .json({ message: "Post has been deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error with server" });
  }
};

export const likeUnLikePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user._id;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      // Unlike post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

      const updatedLikes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      return res.status(200).json(updatedLikes);
    }

    //Like post
    post.likes.push(userId);
    await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
    await post.save();

    const notification = new Notification({
      from: userId,
      to: post.user,
      type: "like",
    });
    await notification.save();

    const updatedLikes = post.likes;
    return res.status(200).json(updatedLikes);
  } catch (error) {
    return res.status(500).json({ message: "Error with server" });
  }
};

export const commentOnPost = async (req, res) => {
  const postId = req.params.id;
  const { text } = req.body;
  const userId = req.user._id;

  if (!text) return res.status(400).json({ message: "Text field is required" });
  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post Not Found" });

    const comment = { user: userId, text };
    post.comments.push(comment);
    await post.save();

    const newPost = await Post.findById(postId).populate({
      path: "comments.user",
      select: "-password",
    });

    return res.status(200).json(newPost);
  } catch (error) {
    return res.status(500).json({ message: "Error with server" });
  }
};

export const getLikedPosts = async (req, res) => {
  const userId = req.params.id;
  const page = parseInt(req.params.page) - 1;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const likedPosts = await Post.find({
      _id: { $in: user.likedPosts },
    })
      .skip(page * 15)
      .limit(15)
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(likedPosts);
  } catch (error) {
    return res.status(500).json({ message: "Error with server" });
  }
};

export const getFollowingPosts = async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.params.page) - 1;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const followingPosts = user.following;

    const feedPosts = await Post.find({ user: { $in: followingPosts } })
      .skip(page * 15)
      .limit(15)
      .sort({
        createdAt: -1,
      })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(feedPosts);
  } catch (error) {
    return res.status(500).json({ message: "Error with server" });
  }
};

export const getUserPosts = async (req, res) => {
  const { username } = req.params;
  const page = parseInt(req.params.page) - 1;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.find({ user: user._id })
      .skip(page * 15)
      .limit(15)
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ message: "Error with server" });
  }
};
