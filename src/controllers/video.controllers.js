import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";

import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getVideoDuration, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  console.log(page, limit, query, sortBy, sortType, userId);
  console.log(req.query);
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
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
    videoId: "1",
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: duration,
    owner: req.user?._id,
  });

  const videoId = await Video.findByIdAndUpdate(
    video._id,
    {
      $set: {
        videoId: video._id,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, videoId, "Video upload succesfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
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
