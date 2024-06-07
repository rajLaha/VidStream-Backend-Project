import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Post } from "../models/post.models.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(401, "Unauthorized Access");
  }

  const { page = 1, limit = 10 } = req.query;
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = await req.body;

  if (!videoId) {
    throw new ApiError(401, "Unauthorized Access");
  }

  const isVideoExists = await Video.findById(videoId);

  if (!isVideoExists) {
    throw ApiError(404, "Video not found");
  }

  if (!content) {
    throw new ApiError(400, "Comment is Required");
  }

  const comment = await Comment.create({
    content,
    video: isVideoExists._id,
    owner: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added on video Succesfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!commentId) {
    throw new ApiError(404, "Comment not found");
  }

  const { newComment } = req.body;

  if (!newComment) {
    throw new ApiError(400, "Comment is required");
  }

  const user = req.user?._id.toString();
  const commentIdOwner = comment.owner.toString();

  if (user != commentIdOwner) {
    throw new ApiError(401, "Unauthorized User Access");
  }

  comment.content = newComment;
  const cm = await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cm, "Comment Updated Succesfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(404, "Unauthorized user access");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const currentUser = req.user?._id.toString();
  const commentOwner = comment.owner.toString();

  if (currentUser != commentOwner) {
    throw new ApiError(401, "Unauthorized user access");
  }

  await Comment.deleteOne({
    _id: commentId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video Delete Succesfully"));
});

const getPostComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(401, "Unauthorized Access");
  }

  const { page = 1, limit = 10 } = req.query;
});

const addPostComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = await req.body;

  if (!postId) {
    throw new ApiError(401, "Unauthorized Access");
  }

  const isPostExists = await Post.findById(postId);

  if (!isPostExists) {
    throw ApiError(404, "Post not found");
  }

  if (!content) {
    throw new ApiError(400, "Comment is Required");
  }

  const comment = await Comment.create({
    content,
    post: isPostExists._id,
    owner: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added on Post Succesfully"));
});

const updatePostComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!commentId) {
    throw new ApiError(404, "Comment not found");
  }

  const { newComment } = req.body;

  if (!newComment) {
    throw new ApiError(400, "Comment is required");
  }

  const user = req.user?._id.toString();

  console.log(user, req.user._id);

  const commentIdOwner = comment.owner.toString();

  if (user != commentIdOwner) {
    throw new ApiError(401, "Unauthorized User Access");
  }

  comment.content = newComment;
  const cm = await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cm, "Comment Updated Succesfully"));
});

const deletePostComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(404, "Unauthorized user access");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const currentUser = req.user?._id.toString();
  const commentOwner = comment.owner.toString();

  if (currentUser != commentOwner) {
    throw new ApiError(401, "Unauthorized user access");
  }

  await Comment.deleteOne({
    _id: commentId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Post Delete Succesfully"));
});

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
  getPostComments,
  addPostComment,
  updatePostComment,
  deletePostComment,
};
