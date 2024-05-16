import express from "express";
import {
  getUser,
  login,
  logout,
  register,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/get-me", protectRoute, getUser);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

export default router;
