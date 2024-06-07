import { Router } from "express";
import {
  toggleCommentLike,
  getLikedVideos,
  togglePostLike,
  togglePostCommentLike,
  toggleVideoLike,
} from "../controllers/likes.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/p/:postId").post(togglePostLike);
router.route("/toggle/p/c/:postCommentId").post(togglePostCommentLike);
router.route("/videos").get(getLikedVideos);

export default router;
