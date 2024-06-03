import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Likes } from "../models/likes.models.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";
import { Post } from "../models/post.models.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(401, "Unauthorized user access");
  }
  //TODO: toggle like on video
  const checkVideoAvailable = await Video.findById(videoId);

  if (!checkVideoAvailable) {
    throw new ApiError(404, "Video is not available");
  }

  const user = req.user?._id.toString();

  var likeToggle;

  const alreadyLiked = await Likes.find({
    video: videoId,
    likedBy: user,
  });

  const toStringConv = alreadyLiked.toString();

  if (toStringConv) {
    likeToggle = false;
    await Likes.deleteOne({
      _id: alreadyLiked[0]._id,
    });
  } else {
    await Likes.create({
      video: videoId,
      likedBy: req.user?._id,
    });
    likeToggle = true;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likeToggle, "Video Like toggle succesfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(401, "Unauthorized user access");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  let likeToggle;

  const alreadyLiked = await Likes.find({
    comment: commentId,
    likedBy: req.user?._id,
  });

  const toStringConv = alreadyLiked.toString();

  if (toStringConv) {
    likeToggle = false;
    await Likes.deleteOne({
      _id: alreadyLiked[0]._id,
    });
  } else {
    await Likes.create({
      comment: commentId,
      likedBy: req.user?._id,
    });
    likeToggle = true;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likeToggle, "Comment Like toggle succesfully"));
});

const togglePostLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(401, "Unauthorized user access");
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  let likeToggle;

  const alreadyLiked = await Likes.find({
    post: postId,
    likedBy: req.user?._id,
  });

  const toStringConv = alreadyLiked.toString();

  if (toStringConv) {
    likeToggle = false;
    await Likes.deleteOne({
      _id: alreadyLiked[0]._id,
    });
  } else {
    await Likes.create({
      post: postId,
      likedBy: req.user?._id,
    });
    likeToggle = true;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likeToggle, "Post Like toggle succesfully"));
});

const getLikedVideos = asyncHandler(async () => {
  //TODO: get all liked videos
});

export { toggleCommentLike, togglePostLike, toggleVideoLike, getLikedVideos };
