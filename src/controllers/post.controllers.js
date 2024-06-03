import mongoose from "mongoose";
import { Post } from "../models/post.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createPost = asyncHandler(async (req, res) => {
  const content = req.body;

  if (!content) {
    throw new ApiError(400, "Content is Mandatory");
  }

  const imageFilePath = req.file?.path;
  let image;

  if (imageFilePath) {
    image = await uploadOnCloudinary(imageFilePath);
  }

  const post = await Post.create({
    content: content.content,
    image: image?.url || "",
    owner: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post uploaded Succesfully"));
});

const getUserPosts = asyncHandler(async (req, res) => {
  // TODO: get user tweets
});

const updatePost = asyncHandler(async (req, res) => {
  //TODO: update tweet
});

const deletePost = asyncHandler(async (req, res) => {
  //TODO: delete tweet
});

export { createPost, getUserPosts, updatePost, deletePost };
