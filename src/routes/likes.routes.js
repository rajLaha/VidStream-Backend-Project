import { Router } from "express";
import {
  toggleCommentLike,
  getLikedVideos,
  togglePostLike,
  toggleVideoLike,
} from "../controllers/likes.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:postId").post(togglePostLike);
router.route("/videos").get(getLikedVideos);

export default router;
