// import mongoose from "mongoose";
// import { DB_NAME } from "../constants.js";

// const dbConnection = async () => {
//   try {
//     const connection_instance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     console.log(`MongoDB connected! HOST: ${connection_instance.connection.host}`);

//   } catch (error) {
//     console.log(`DB connection failed: ${error}`);
//     process.exit(1);
//   }
// };

// export default dbConnection;

// import mongoose from "mongoose";
// import { DB_NAME } from "../constants.js";

// const dbConnection = async () => {
//   try {
//     const connection_instance = await mongoose.connect(
//       `${process.env.MONGODB_URI}/${DB_NAME}`
//     );
//     console.log(
//       `MongoDB connected! HOST: ${connection_instance.connection.host}`
//     );
//   } catch (error) {
//     console.log(`MongoDB connection Failed: ${error}`);
//     process.exit(1);
//   }
// };

// export default dbConnection;

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const dbConnection = async () => {
  try {
    const connection_instance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`MongoDB connected and HOST at: ${connection_instance.connection.host}`);
  } catch (error) {
    console.log(`MongoDB connection Failed: ${error}`);
    process.exit(1);
  }
};

export default dbConnection;
