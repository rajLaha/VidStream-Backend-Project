import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError, catchError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    throw new ApiError(400, "Name is Mandatory");
  }

  try {
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
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "Required URL parameter is missing playlistId");
  }

  if (!videoId) {
    throw new ApiError(400, "Required URL parameter is missing videoId");
  }

  try {
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

  if (!playlistId) {
    throw new ApiError(400, "Required URL parameter is missing playlistId");
  }

  if (!videoId) {
    throw new ApiError(400, "Required URL parameter is missing videoId");
  }

  try {
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

  if (!playlistId) {
    throw new ApiError(400, "Required URL parameter is missing playlistId");
  }

  try {
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
  //TODO: update playlist
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
