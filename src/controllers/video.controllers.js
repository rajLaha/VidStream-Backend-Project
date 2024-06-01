import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";

import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteOnCloudinary,
  deleteVideoOnCloudinary,
  getVideoDuration,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  console.log(page, limit, query, sortBy, sortType, userId);
  console.log(req.query);
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    throw new ApiError(400, "Title is Necessary");
  }

  let localVideoPath;
  let localThumbnailPath;

  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) {
    localVideoPath = req.files.videoFile[0].path;
  } else {
    throw new ApiError(400, "Video is mandatory");
  }

  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    localThumbnailPath = req.files.thumbnail[0].path;
  } else {
    throw new ApiError(400, "Thumbnail is Mandatory");
  }

  const videoFile = await uploadOnCloudinary(localVideoPath);
  const thumbnail = await uploadOnCloudinary(localThumbnailPath);

  const duration = await getVideoDuration(videoFile.public_id);

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: duration,
    owner: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video upload succesfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  // console.log(video);
  const { title, description } = req.body;

  if (!title && !description) {
    throw new ApiError(404, "At least one field is required");
  }

  if (title) {
    video.title = title;
    await video.save();
  }

  if (description) {
    video.description = description;
    await video.save();
  }

  const newThumbnail = req.file?.path;

  if (newThumbnail) {
    if (video.thumbnail) {
      await deleteOnCloudinary(video.thumbnail);
    }
    const thumbnail = await uploadOnCloudinary(newThumbnail);
    video.thumbnail = thumbnail.url;
    video.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated succesfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(404, "unauthorrized user access");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  const videoUrl = await video.videoFile;
  const thumbnailUrl = await video.thumbnail;
  const deleteVideo = await deleteVideoOnCloudinary(videoUrl);
  const deleteThumbnail = await deleteOnCloudinary(thumbnailUrl);

  if (!deleteVideo) {
    throw new ApiError(401, "Can not find Video");
  }

  if (!deleteThumbnail) {
    throw new ApiError(401, "Can not find Thumbnail");
  }

  await Video.deleteOne({
    _id: videoId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video Delete Succcesfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
