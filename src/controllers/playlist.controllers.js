import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    throw new ApiError(400, "Name is mandatory");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "Something went wrong while create playlists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist create Succesfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "Unauthorised user access");
  }

  if (!videoId) {
    throw new ApiError(400, "Unauthorised user access");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
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
        "Video added in playlist succesfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
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
