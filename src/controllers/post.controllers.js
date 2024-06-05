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
  const user = req.user?._id;

  if (!user) {
    throw new ApiError(401, "Unauthorized user access");
  }

  const post = await Post.find({
    owner: user,
  });

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post of user fetched succesfully"));
});

const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(401, "Unauthorized User Access");
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "Unauthorized user access");
  }

  const { content } = req.body;

  post.content = content;
  const updatedPost = await post.save();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPost, "Post updatation Succesfully"));
});

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  console.log(postId);
  if (!postId) {
    throw new ApiError(401, "Unauthorized user access");
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "Unauthorized user access");
  }

  await Post.deleteOne({
    _id: postId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Post Delete Succesfully"));
});

export { createPost, getUserPosts, updatePost, deletePost };
