import { v2 as cloudinary } from "cloudinary";
import { log } from "console";
import exp from "constants";
import fs from "fs";
import { loadEnvFile } from "process";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(loadEnvFile, {
      resource_type: "auto",
    });
    //   file has been upload succesfully
    console.log(`file is uploaded on cloudinary ${response.url}`);
    return response;
  } catch (error) {
    fs.unlink(localFilePath);
    // remove the locally saved temporary as the uploaded operation gets failed
    return null;
  }
};

export { uploadOnCloudinary };
