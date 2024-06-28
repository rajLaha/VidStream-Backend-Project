import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controllers.js";

const router = Router();

import { verifyJWT } from "../middlewares/auth.middlewares.js";

router.use(verifyJWT);

router
  .route("/c/:channelId")
  .get(getUserChannelSubscribers)
  .post(toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router;
