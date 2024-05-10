import { Router } from "express";
import { registeruser } from "../controllers/user.controllers.js";

const router = Router();

router.route("/register").post(registeruser);

export default router;
