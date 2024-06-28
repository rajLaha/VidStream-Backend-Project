import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// .use is used for configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes

import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likesRouter from "./routes/likes.routes.js";
import postRouter from "./routes/post.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";

// routes declarations
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likesRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/subscription", subscriptionRouter);
// http://localhost:8000/api/v1/usesrs/register

export { app };
