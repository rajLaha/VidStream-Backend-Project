import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError, catchError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  try {
    if (!name) {
      throw new ApiError(400, "Name is Mandatory");
    }

    const playlist = await Playlist.create({
      name,
      description,
      owner: req.user?._id,
    });

    if (!playlist) {
      throw new ApiError(500, "Something went wrong while Creating Playlists");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist create succesfully"));
  } catch (error) {
    catchError(error, res, "Creating Playlist");
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  try {
    if (!playlistId) {
      throw new ApiError(400, "Required URL parameter is missing playlistId");
    }

    const playlist = await Playlist.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(playlistId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "videoDetails",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          videoDetails: {
            _id: 1,
            videoFile: 1,
            thumbnail: 1,
            title: 1,
            description: 1,
            duration: 1,
            views: 1,
            owner: 1,
            createdAt: 1,
            updatedAt: 1,
          },
          owner: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    if (playlist.length == 0) {
      throw new ApiError(404, "Playlist not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist fetched succesfully"));
  } catch (error) {
    catchError(error, res, "Fetching Video");
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  try {
    if (!playlistId) {
      throw new ApiError(400, "Required URL parameter is missing playlistId");
    }

    if (!videoId) {
      throw new ApiError(400, "Required URL parameter is missing videoId");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() != req.user?._id) {
      throw new ApiError(401, "Unauthorized user access");
    }

    const videos = videoId.split(",");

    videos.forEach((element) => {
      playlist.video.forEach((vid) => {
        if (element == vid) {
          throw new ApiError(
            400,
            "One or more videos is already added in playlist"
          );
        }
      });
    });

    const video = await Video.find({
      _id: {
        $in: videos,
      },
    });

    if (video.length != videos.length) {
      throw new ApiError(400, "One or more videos do not exist");
    }

    // Ensure the playlist's videos field is an array before updating
    if (!Array.isArray(playlist.video)) {
      playlist.video = [];
    }

    // Update the playlist to add the video IDs
    playlist.video.push(...videos);
    const playlistWithVideo = await playlist.save();

    if (!playlistWithVideo) {
      throw new ApiError(
        500,
        "Something went wrong while adding Videos in playlist"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { playlistWithVideo },
          "Video added in Playlist succesfully"
        )
      );
  } catch (error) {
    catchError(error, res, "Adding Video in Playlist");
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  try {
    if (!playlistId) {
      throw new ApiError(400, "Required URL parameter is missing playlistId");
    }

    if (!videoId) {
      throw new ApiError(400, "Required URL parameter is missing videoId");
    }

    const videos = videoId.split(",");

    const video = await Video.find({
      _id: {
        $in: videos,
      },
    });

    if (video.length != videos.length) {
      throw new ApiError(400, "One or more videos do not exist");
    }

    const playlist = await Playlist.findOne({
      _id: playlistId,
      video: {
        $all: videos,
      },
    });

    if (!playlist) {
      throw new ApiError(
        404,
        "The Video do not exist in the playlist or the Playlist does not exist"
      );
    }

    if (playlist.owner.toString() != req.user?._id.toString()) {
      throw new ApiError(400, "Unauthorized user Access");
    }

    const playlistAfterRemoveVideo = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $pull: {
          video: {
            $in: videos,
          },
        },
      },
      {
        new: true,
      }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          playlistAfterRemoveVideo,
          "Video Removed from Playlist Succesfully"
        )
      );
  } catch (error) {
    catchError(error, res, "Remove Video from Playlist");
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  try {
    if (!playlistId) {
      throw new ApiError(400, "Required URL parameter is missing playlistId");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() != req.user?._id.toString()) {
      throw new ApiError(401, "Unauthorized user access");
    }

    const playlistDelete = await Playlist.findByIdAndDelete(playlist);

    if (!playlistDelete) {
      throw new ApiError(404, "Playlist not found while Playlist Delete");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Playlist Delete Succesfully"));
  } catch (error) {
    catchError(error, res, "Delete Playlist");
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  try {
    if (!playlistId) {
      throw new ApiError(400, "Required URL parameter is missing playlistId");
    }

    if (!name && !description) {
      throw new ApiError(400, "At least one field is required");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() != req.user?._id.toString()) {
      throw new ApiError(401, "Unauthorized user access");
    }

    if (name) {
      playlist.name = name;
    }

    if (description) {
      playlist.description = description;
    }

    await playlist.save();

    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist Update Succesfully"));
  } catch (error) {
    catchError(error, res, "Updating Playlist");
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
