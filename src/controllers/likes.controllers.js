import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError, catchError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Likes } from "../models/likes.models.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";
import { Post } from "../models/post.models.js";
import mongoose from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  try {
    if (!videoId) {
      throw new ApiError(400, "Required URL parameter is missing videoId");
    }
    //TODO: toggle like on video
    const checkVideoAvailable = await Video.exists(
      new mongoose.Types.ObjectId(videoId)
    );

    if (!checkVideoAvailable) {
      throw new ApiError(404, "Video not found");
    }

    var likeToggle;

    const alreadyLiked = await Likes.find({
      video: videoId,
      likedBy: req.user?._id.toString(),
    });

    if (alreadyLiked.length > 0) {
      const likeToggleDelete = await Likes.deleteOne({
        _id: alreadyLiked[0]._id,
      });

      if (!likeToggleDelete) {
        throw new ApiError(500, "Something went wrong while toggle like");
      }

      likeToggle = false;
    } else {
      const likeToggleCreate = await Likes.create({
        video: videoId,
        likedBy: req.user?._id,
      });

      if (!likeToggleCreate) {
        throw new ApiError(500, "Something went wrong while toggle like");
      }

      likeToggle = true;
    }

    return res
      .status(200)
      .json(new ApiResponse(200, likeToggle, "Like toggle succesfully"));
  } catch (error) {
    catchError(error, res, "Toggle Like");
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  try {
    if (!commentId) {
      throw new ApiError(400, "Required URL parameter is missing commentId");
    }

    const isCommentExists = await Comment.exists(
      new mongoose.Types.ObjectId(commentId)
    );

    if (!isCommentExists) {
      throw new ApiError(404, "Comment not found");
    }

    let likeToggle;

    const alreadyLiked = await Likes.find({
      comment: commentId,
      likedBy: req.user?._id,
    });

    if (alreadyLiked.length > 0) {
      const likeToggleDelete = await Likes.deleteOne({
        _id: alreadyLiked[0]._id,
      });

      if (!likeToggleDelete) {
        throw new ApiError(500, "Something went wrong while toggle like");
      }

      likeToggle = false;
    } else {
      const likeToggleCreate = await Likes.create({
        comment: commentId,
        likedBy: req.user?._id,
      });

      if (!likeToggleCreate) {
        throw new ApiError(500, "Something went wrong while toggle like");
      }

      likeToggle = true;
    }

    return res
      .status(200)
      .json(new ApiResponse(200, likeToggle, "Like toggle succesfully"));
  } catch (error) {
    catchError(error, res, "Toggle Like");
  }
});

const togglePostLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  try {
    if (!postId) {
      throw new ApiError(400, "Required URL parameter is missing postId");
    }

    const isPostExists = await Post.exists(new mongoose.Types.ObjectId(postId));

    if (!isPostExists) {
      throw new ApiError(404, "Post not found");
    }

    let likeToggle;

    const alreadyLiked = await Likes.find({
      post: postId,
      likedBy: req.user?._id,
    });

    if (alreadyLiked.length > 0) {
      const likeToggleDelete = await Likes.deleteOne({
        _id: alreadyLiked[0]._id,
      });

      if (!likeToggleDelete) {
        throw new ApiError(500, "Something went wrong while toggle like");
      }

      likeToggle = false;
    } else {
      const likeToggleCreate = await Likes.create({
        post: postId,
        likedBy: req.user?._id,
      });

      if (!likeToggleCreate) {
        throw new ApiError(500, "Something went wrong while toggle like");
      }

      likeToggle = true;
    }

    return res
      .status(200)
      .json(new ApiResponse(200, likeToggle, "Like toggle succesfully"));
  } catch (error) {
    catchError(error, res, "Toggle Like");
  }
});

const togglePostCommentLike = asyncHandler(async (req, res) => {
  const { postCommentId } = req.params;

  try {
    if (!postCommentId) {
      throw new ApiError(
        400,
        "Required URL parameter is missing postCommentId"
      );
    }

    const comment = await Comment.exists(
      new mongoose.Types.ObjectId(postCommentId)
    );

    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    let likeToggle;

    const alreadyLiked = await Likes.find({
      postComment: postCommentId,
      likedBy: req.user?._id,
    });

    if (alreadyLiked.length > 0) {
      const likeToggleDelete = await Likes.deleteOne({
        _id: alreadyLiked[0]._id,
      });

      if (!likeToggleDelete) {
        throw new ApiError(500, "Something went wrong while toggle like");
      }

      likeToggle = false;
    } else {
      const likeToggleCreate = await Likes.create({
        postComment: postCommentId,
        likedBy: req.user?._id,
      });

      if (!likeToggleCreate) {
        throw new ApiError(500, "Something went wrong while toggle like");
      }

      likeToggle = true;
    }

    return res
      .status(200)
      .json(new ApiResponse(200, likeToggle, "Like toggle succesfully"));
  } catch (error) {
    catchError(error, res, "Toggle Like");
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  try {
    const likedVideos = await Likes.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(req.user?._id),
          video: {
            $exists: true,
          },
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "likedVideos",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "likedVideos.owner",
          foreignField: "_id",
          as: "videoOwner",
        },
      },
      {
        $project: {
          _id: 1,
          likedVideos: {
            _id: 1,
            videoFile: 1,
            thumbnail: 1,
            title: 1,
            description: 1,
            duration: 1,
            views: 1,
          },
          videoOwner: {
            _id: 1,
            userName: 1,
            fullName: 1,
            avatar: 1,
            coverImage: 1,
          },
        },
      },
    ]);

    if (likedVideos.length == 0) {
      throw new ApiError(404, "Liked Videos not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, likedVideos, "Succesfully liked videos"));
  } catch (error) {
    catchError(error, res, "Fetching liked videos");
  }
});

export {
  toggleCommentLike,
  togglePostLike,
  toggleVideoLike,
  togglePostCommentLike,
  getLikedVideos,
};
