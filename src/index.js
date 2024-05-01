// require("dotenv").config({ path: `./env` });
import dbConnection from "./db/db.js";
import dotnev from "dotenv";

dotnev.config({
  path: `./env`,
});

dbConnection();

// import express from "express";
// const app = express();

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log(`Error: ${error}`);
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`app is listning on port no ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error(`Error: ${error}`);
//     throw error;
//   }
// })();
