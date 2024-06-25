import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { ApiError, catchError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Post } from "../models/post.models.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    if (!videoId) {
      throw new ApiError(400, "Required URL parameter is missing videoId");
    }

    const isVideoExists = await Video.exists(
      new mongoose.Types.ObjectId(videoId)
    );

    if (!isVideoExists) {
      throw new ApiError(404, "Video not found");
    }

    const commentsFetchQuery = Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "video",
        },
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
        $project: {
          _id: 1,
          content: 1,
          video: {
            _id: 1,
            videoFile: 1,
            thumbnail: 1,
            title: 1,
            description: 1,
            duration: 1,
            views: 1,
          },
          ownerDetails: {
            _id: 1,
            userName: 1,
            email: 1,
            fullName: 1,
            avatar: 1,
            coverImage: 1,
          },
        },
      },
    ]);

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    // aggregatePaginate returns object type of result
    const comments = await Comment.aggregatePaginate(
      commentsFetchQuery,
      options
    );

    if (!comments) {
      throw new ApiError(404, "Comments not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, comments, "Comments fetched succesfully"));
  } catch (error) {
    catchError(error, res, "Fetching Comments");
  }
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = await req.body;

  try {
    if (!videoId) {
      throw new ApiError(400, "Required URL parameter is missing videoId");
    }

    const isVideoExists = await Video.findById(videoId);

    if (!isVideoExists) {
      throw new ApiError(404, "Video not found");
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
      .json(new ApiResponse(200, comment, "Comment added Succesfully"));
  } catch (error) {
    catchError(error, res, "Adding Comment in Video");
  }
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { newComment } = req.body;

  try {
    if (!commentId) {
      throw new ApiError(400, "Required URL parameter is missing commentId");
    }

    if (!newComment) {
      throw new ApiError(400, "Comment is Mandatory");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    if (req.user?._id.toString() != comment.owner.toString()) {
      throw new ApiError(401, "Unauthorized User Access");
    }

    comment.content = newComment;
    const cm = await comment.save();

    return res
      .status(200)
      .json(new ApiResponse(200, cm, "Comment Updated Succesfully"));
  } catch (error) {
    catchError(error, res, "Updating video comment");
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  try {
    if (!commentId) {
      throw new ApiError(400, "Required URL parameter is missing commentId");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    if (req.user?._id.toString() != comment.owner.toString()) {
      throw new ApiError(401, "Unauthorized user access");
    }

    await Comment.deleteOne({
      _id: commentId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment Delete Succesfully"));
  } catch (error) {
    catchError(error, res, "Deleting Comment from Video");
  }
});

const getPostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    if (!postId) {
      throw new ApiError(401, "Unauthorized Access");
    }

    const isPostExists = await Post.exists(new mongoose.Types.ObjectId(postId));

    if (!isPostExists) {
      throw new ApiError(404, "Post not found");
    }

    const commentsFetchQuery = Comment.aggregate([
      {
        $match: {
          post: new mongoose.Types.ObjectId(postId),
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "post",
          foreignField: "_id",
          as: "post",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
    ]);

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    const comments = await Comment.aggregatePaginate(
      commentsFetchQuery,
      options
    );

    if (!comments) {
      throw new ApiError(404, "Comments not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, comments, "Comments fetched succesfully"));
  } catch (error) {
    catchError(error, res, "Fetching Comments");
  }
});

const addPostComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = await req.body;

  try {
    if (!postId) {
      throw new ApiError(400, "Required URL parameter is missing postId");
    }

    if (!content) {
      throw new ApiError(400, "Comment is Mandatory");
    }

    const isPostExists = await Post.findById(postId);

    if (!isPostExists) {
      throw ApiError(404, "Post not found");
    }

    const comment = await Comment.create({
      content,
      post: isPostExists._id,
      owner: req.user?._id,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "Comment added Succesfully"));
  } catch (error) {
    catchError(error, res, "Adding Comment in Post");
  }
});

const updatePostComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { newComment } = req.body;

  try {
    if (!commentId) {
      throw new ApiError(400, "Requierd URL paramater is missing commentId");
    }

    if (!newComment) {
      throw new ApiError(400, "Comment is Mandatory");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    if (req.user?._id.toString() != comment.owner.toString()) {
      throw new ApiError(401, "Unauthorized User Access");
    }

    comment.content = newComment;
    const cm = await comment.save();

    return res
      .status(200)
      .json(new ApiResponse(200, cm, "Comment Updated Succesfully"));
  } catch (error) {
    catchError(error, res, "Updating Post Comment");
  }
});

const deletePostComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  try {
    if (!commentId) {
      throw new ApiError(400, "Required URL paramater is missing commentId");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    if (req.user?._id.toString() != comment.owner.toString()) {
      throw new ApiError(401, "Unauthorized user access");
    }

    await Comment.deleteOne({
      _id: commentId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment Delete Succesfully"));
  } catch (error) {
    catchError(error, res, "Deleting Post Comment");
  }
});

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
  getPostComments,
  addPostComment,
  updatePostComment,
  deletePostComment,
};
