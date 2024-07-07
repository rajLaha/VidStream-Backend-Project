import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { Views } from "../models/views.models.js";
import { ApiError, catchError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteOnCloudinary,
  deleteVideoOnCloudinary,
  getVideoDuration,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  try {
    // Build match condition based on query and userId
    const matchCondition = {};

    if (query) {
      matchCondition.$text = { $search: query };
    }

    if (userId) {
      matchCondition.owner = new mongoose.Types.ObjectId(userId);
    }

    const videosQuery = Video.aggregate([
      {
        $match: matchCondition,
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails",
        },
      },
      {
        $sort: { [sortBy]: sortType === "desc" ? -1 : 1 },
      },
      {
        $project: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
          updatedAt: 1,
          ownerDetails: {
            _id: 1,
            userName: 1,
            fullName: 1,
            avatar: 1,
          },
        },
      },
    ]);

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    const videos = await Video.aggregatePaginate(videosQuery, options);

    if (videos.length == 0) {
      throw new ApiError(404, "Videos not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, videos, "Videos fetched succesfully"));
  } catch (error) {
    catchError(error, res, "Fetching Videos");
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  try {
    if (!title) {
      throw new ApiError(400, "Title is Required");
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
      throw new ApiError(400, "Thumbnail is mandatory");
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
      .json(new ApiResponse(200, video, "Video uploaded succesfully"));
  } catch (error) {
    catchError(error, res, "Publish Video");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  try {
    if (!videoId) {
      throw new ApiError(400, "Required URL parameter is missing videoId");
    }

    const isVideoExists = await Video.exists(
      new mongoose.Types.ObjectId(videoId)
    );

    if (!isVideoExists) {
      throw new ApiError(404, "Video Not Found");
    }

    const isAlreadyViewed = await Views.exists({
      video: new mongoose.Types.ObjectId(videoId),
      viewers: new mongoose.Types.ObjectId(req.user?._id),
    });

    if (!isAlreadyViewed) {
      const viewedUser = await Views.create({
        video: videoId,
        viewers: req.user?._id,
      });

      if (!viewedUser) {
        throw new ApiError(
          500,
          "Something went wrong at increase views on video"
        );
      }

      const incViews = await Video.updateOne(
        {
          _id: videoId,
        },
        {
          $inc: {
            views: 1,
          },
        }
      );

      if (!incViews) {
        throw new ApiError(
          500,
          "Something went wrong at increase views on video"
        );
      }
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!Array.isArray(user.watchHistory)) {
      user.watchHistory = [];
    }

    user.watchHistory.push(videoId);

    const userWatchHistory = await user.save();

    if (!userWatchHistory) {
      throw new ApiError(
        500,
        "Something went wrong while adding video in watch history"
      );
    }

    const video = await Video.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "videoOwner",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "video",
          as: "comments",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "commentOwner",
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
          videoOwner: {
            _id: 1,
            userName: 1,
            fullName: 1,
            avatar: 1,
          },
          comments: {
            _id: 1,
            content: 1,
            commentOwner: {
              _id: 1,
              userName: 1,
              fullName: 1,
              avatar: 1,
            },
            createdAt: 1,
            updatedAt: 1,
          },
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video Fetched Succesfully"));
  } catch (error) {
    catchError(error, res, "Fetching video");
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  try {
    if (!videoId) {
      throw new ApiError(400, "Required URL parameter is missing videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not foundf");
    }

    if (video.owner.toString() != req.user._id.toString()) {
      throw new ApiError(401, "Unauthorized User Access");
    }

    if (!title && !description) {
      throw new ApiError(404, "At least one field is required");
    }

    if (title && description) {
      video.title = title;
      video.description = description;
      await video.save();
    } else {
      if (title) {
        video.title = title;
        await video.save();
      }

      if (description) {
        video.description = description;
        await video.save();
      }
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
  } catch (error) {
    catchError(error, res, "Updating Video");
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  try {
    if (!videoId) {
      throw new ApiError(400, "Required URL parameter is missing videoId");
    }
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    if (req.user._id.toString() != video.owner.toString()) {
      throw new ApiError(401, "Unauthorized user access");
    }

    const deleteVideo = await deleteVideoOnCloudinary(video.videoFile);
    const deleteThumbnail = await deleteOnCloudinary(video.thumbnail);

    if (!deleteVideo) {
      throw new ApiError(401, "Something went wrong while delete video");
    }

    if (!deleteThumbnail) {
      throw new ApiError(401, "Something went wrong while delete video");
    }

    await Video.deleteOne({
      _id: videoId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video Deleted Succcesfully"));
  } catch (error) {
    catchError(error, res, "Deleting Video");
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  try {
    if (!videoId) {
      throw new ApiError(401, "Required URL parameter is missing videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    if (req.user._id.toString() != video.owner.toString()) {
      throw new ApiError(401, "Unauthorized user access");
    }

    if (video.isPublished == true) {
      video.isPublished = false;
      await video.save();
    } else {
      video.isPublished = true;
      await video.save();
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          video.isPublished,
          "Publish status changed succesfully"
        )
      );
  } catch (error) {
    catchError(error, res, "Toggle publish status");
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
