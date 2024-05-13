import dbConnection from "./db/db.js";
import dotnev from "dotenv";
import { app } from "./app.js";
const port = process.env.PORT || 3000;

dotnev.config({
  path: `./.env`,
});

dbConnection()
  .then(() => {
    app.listen(port, () => {
      console.log(`http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log(`Error at (index.js): ${err}`);
  });
