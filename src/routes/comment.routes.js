import { Router } from "express";
import {
  getVideoComments,
  addComment,
  deleteComment,
  updateComment,
  addPostComment,
  deletePostComment,
  updatePostComment,
  getPostComments,
} from "../controllers/comment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/p/:postId").get(getPostComments).post(addPostComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);
router
  .route("/c/p/:commentId")
  .delete(deletePostComment)
  .patch(updatePostComment);

export default router;
