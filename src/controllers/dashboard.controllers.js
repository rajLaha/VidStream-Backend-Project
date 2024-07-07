import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError, catchError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      throw new ApiError(400, "Required URL parameter is missing userId");
    }

    const owner = await User.findById(userId).select(
      "-password -refreshToken"
    );

    if (!owner) {
      throw new ApiError(404, "User not found");
    }

    const getChannelTotalViews = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          totalViews: {
            $sum: "$views",
          },
        },
      },
    ]);

    const getTotalSubscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const getTotalVideos = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $project: {
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
        },
      },
    ]);

    const totalViews = getChannelTotalViews[0]?.totalViews || 0;
    const totalSubscriber = getTotalSubscribers[0]?.count || 0;

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { owner, totalViews, totalSubscriber, getTotalVideos },
          "Channel data fetched succesfully"
        )
      );
  } catch (error) {
    catchError(error, res, "Fetching channel stats");
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  try {
    const userChannelVideos = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $project: {
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
        },
      },
    ]);

    if (userChannelVideos.length < 0) {
      throw new ApiError(404, "Channel does upload any videos");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          userChannelVideos,
          "All videos fetched succesfully"
        )
      );
  } catch (error) {
    catchError(error, res, "Fetching channel videos");
  }
});

export { getChannelStats, getChannelVideos };
