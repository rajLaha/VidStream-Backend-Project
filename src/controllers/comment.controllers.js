import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { ApiError, catchError } from "../utils/apiError.js";
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

  try {
    if (!videoId) {
      throw new ApiError(400, "Required URL parameter is missing videoId");
    }

    const isVideoExists = await Video.findById(videoId);

    if (!isVideoExists) {
      throw new ApiError(404, "Video not found");
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
      .json(new ApiResponse(200, comment, "Comment added Succesfully"));
  } catch (error) {
    catchError(error, res, "Adding Comment in Video");
  }
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { newComment } = req.body;

  try {
    if (!commentId) {
      throw new ApiError(400, "Required URL parameter is missing commentId");
    }

    if (!newComment) {
      throw new ApiError(400, "Comment is Mandatory");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    if (req.user?._id.toString() != comment.owner.toString()) {
      throw new ApiError(401, "Unauthorized User Access");
    }

    comment.content = newComment;
    const cm = await comment.save();

    return res
      .status(200)
      .json(new ApiResponse(200, cm, "Comment Updated Succesfully"));
  } catch (error) {
    catchError(error, res, "Updating video comment");
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  try {
    if (!commentId) {
      throw new ApiError(400, "Required URL parameter is missing commentId");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    if (req.user?._id.toString() != comment.owner.toString()) {
      throw new ApiError(401, "Unauthorized user access");
    }

    await Comment.deleteOne({
      _id: commentId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment Delete Succesfully"));
  } catch (error) {
    catchError(error, res, "Deleting Comment from Video");
  }
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

  try {
    if (!postId) {
      throw new ApiError(400, "Required URL parameter is missing postId");
    }

    if (!content) {
      throw new ApiError(400, "Comment is Mandatory");
    }

    const isPostExists = await Post.findById(postId);

    if (!isPostExists) {
      throw ApiError(404, "Post not found");
    }

    const comment = await Comment.create({
      content,
      post: isPostExists._id,
      owner: req.user?._id,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "Comment added Succesfully"));
  } catch (error) {
    catchError(error, res, "Adding Comment in Post");
  }
});

const updatePostComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { newComment } = req.body;

  try {
    if (!commentId) {
      throw new ApiError(400, "Requierd URL paramater is missing commentId");
    }

    if (!newComment) {
      throw new ApiError(400, "Comment is Mandatory");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    if (req.user?._id.toString() != comment.owner.toString()) {
      throw new ApiError(401, "Unauthorized User Access");
    }

    comment.content = newComment;
    const cm = await comment.save();

    return res
      .status(200)
      .json(new ApiResponse(200, cm, "Comment Updated Succesfully"));
  } catch (error) {
    catchError(error, res, "Updating Post Comment");
  }
});

const deletePostComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  try {
    if (!commentId) {
      throw new ApiError(400, "Required URL paramater is missing commentId");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    if (req.user?._id.toString() != comment.owner.toString()) {
      throw new ApiError(401, "Unauthorized user access");
    }

    await Comment.deleteOne({
      _id: commentId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment Delete Succesfully"));
  } catch (error) {
    catchError(error, res, "Deleting Post Comment");
  }
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
