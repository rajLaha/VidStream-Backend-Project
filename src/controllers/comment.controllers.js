import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
  // TODO: update a comment
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
});

export { getVideoComments, addComment, updateComment, deleteComment };
