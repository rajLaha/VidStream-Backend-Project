import { Router } from "express";
import {
  deleteAvatar,
  deleteCoverImage,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginuser,
  logoutuser,
  refreshAccessToken,
  registeruser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { changeCurrentPassword } from "../controllers/user.controllers.js";
import multer from "multer";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registeruser
);

router.route("/login").post(loginuser);

// secured routes
router.route("/logout").post(verifyJWT, logoutuser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router.route("/delete-avatar").get(verifyJWT, deleteAvatar );

router.route("/delete-cover-image").get(verifyJWT, deleteCoverImage );

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);

router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

router.route("/channel/:userName").get(verifyJWT, getUserChannelProfile);

router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;
