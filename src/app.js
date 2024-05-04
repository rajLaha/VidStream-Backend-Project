import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

// .use is used for configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credential: true,
  })
);
app.use(express.json({ limit: `16kb` }));
app.use(express.urlencoded({ extended }));
app.use(express.static("public"));
app.use(cookieParser());

export { app };

// app.get("/", (req, res) => {
//   res.send("<h1>DataBase Connected</h1>");
// });
