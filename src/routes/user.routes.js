import { Router } from "express";
import {
  loginuser,
  logoutuser,
  registeruser,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

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

router.route("/logout").post(verifyJWT, logoutuser);

export default router;
