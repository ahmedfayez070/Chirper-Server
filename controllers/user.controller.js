import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Error with server" });
  }
};

export const followUnFollowUser = async (req, res) => {
  const { id } = req.params;

  try {
    const userToModify = await User.findById(id);

    const currentUser = await User.findById(req.user._id);
    if (!currentUser || !userToModify)
      return res.status(404).json({ message: "User not found" });

    if (req.user._id.toString() === id)
      return res.status(400).json({ message: "You can't follow yourself" });

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      // UnFollow
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      return res.status(200).json({ message: "User unFollowed successfully" });
    } else {
      // Follow
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      const notification = new Notification({
        type: "follow",
        from: req.user._id,
        to: id,
      });
      await notification.save();
      return res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error with server" });
  }
};

export const getSuggestedUsers = async (req, res) => {
  const userId = req.user._id;
  try {
    const userFollowedByMe = await User.findById(userId).select("following");

    const users = await User.aggregate([
      { $match: { _id: { $ne: userId } } },
      { $sample: { size: 10 } },
    ]);

    const filteringUsers = users.filter(
      (user) => !userFollowedByMe.following.includes(user._id)
    );

    const suggestedUsers = filteringUsers.slice(0, 4);
    suggestedUsers.forEach((user) => (user.password = null));
    return res.status(200).json(suggestedUsers);
  } catch (error) {
    return res.status(500).json({ message: "Error with server" });
  }
};

export const updateUserProfile = async (req, res) => {
  const { fullName, currentPassword, newPassword, bio, link } = req.body;
  let { profileImg, coverImg } = req.body;
  const userId = req.user._id;

  if ((!currentPassword && newPassword) || (currentPassword && !newPassword))
    return res.status(400).json({
      message:
        "You must enter the current password with the new password to change it",
    });
  try {
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (currentPassword && newPassword) {
      const isMatched = await bcrypt.compare(currentPassword, user.password);
      if (!isMatched)
        return res
          .status(400)
          .json({ message: "Current Password is Incorrect" });

      if (newPassword.length < 8)
        return res.status(400).json({ message: "Password is weak" });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (profileImg) {
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }

    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();
    user.password = null;
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Error with server" });
  }
};
