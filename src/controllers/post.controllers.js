import mongoose from "mongoose";
import { Post } from "../models/post.models.js";
import { ApiError, catchError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Likes } from "../models/likes.models.js";
import { User } from "../models/user.models.js";
import { Comment } from "../models/comment.models.js";

const createPost = asyncHandler(async (req, res) => {
  const content = req.body;

  try {
    if (!content) {
      throw new ApiError(400, "Content is Mandatory");
    }

    const imageFilePath = req.file?.path;
    let image;

    if (imageFilePath) {
      image = await uploadOnCloudinary(imageFilePath);
    }

    const post = await Post.create({
      content: content.content,
      image: image?.url || "",
      owner: req.user?._id,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, post, "Post uploaded Succesfully"));
  } catch (error) {
    catchError(error, res, "Create Post");
  }
});

const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      throw new ApiError(400, "Required URL parameter is missing userId");
    }

    const ifUserExists = await User.exists(new mongoose.Types.ObjectId(userId));

    if (!ifUserExists) {
      throw new ApiError(404, "User not found");
    }

    const posts = await Post.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
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
          image: 1,
          ownerDetails: {
            _id: 1,
            userName: 1,
            fullName: 1,
            avatar: 1,
            coverImage: 1,
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    if (posts.length == 0) {
      throw new ApiError(404, "Post not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, posts, "Post of user fetched succesfully"));
  } catch (error) {
    catchError(error, res, "Fetching User Post");
  }
});

const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  try {
    if (!postId) {
      throw new ApiError(400, "Required URL parameter is missing postId");
    }

    const post = await Post.findById(postId);

    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    if (post.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(401, "Unauthorized user access");
    }

    const { content } = req.body;

    post.content = content;
    const updatedPost = await post.save();

    return res
      .status(200)
      .json(new ApiResponse(200, updatedPost, "Post updatation Succesfully"));
  } catch (error) {
    catchError(error, res, "Update Post");
  }
});

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  try {
    if (!postId) {
      throw new ApiError(400, "Required URL parameter is missing postId");
    }

    const post = await Post.findById(postId);

    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    if (post.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(401, "Unauthorized user access");
    }

    if (post.image) {
      await deleteOnCloudinary(post.image);
    }

    await Post.deleteOne({
      _id: postId,
    });

    await Likes.deleteMany({
      post: postId,
    });

    await Comment.deleteMany({
      post: postId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Post Delete Succesfully"));
  } catch (error) {
    catchError(error, res, "Deleting Post");
  }
});

export { createPost, getUserPosts, updatePost, deletePost };
