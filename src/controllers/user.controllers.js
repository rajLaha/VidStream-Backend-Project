import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, catchError } from '../utils/apiError.js';
import { User } from '../models/user.models.js';
import { uploadOnCloudinary, deleteOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import fs from 'fs';

const generateAccessAndRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      'something went wrong while create Access and Refresh Token'
    );
  }
};

const registeruser = asyncHandler(async (req, res) => {
  const { userName, email, fullName, password } = req.body;
  try {
    if (
      [userName, email, fullName, password].some(
        (field) => field?.trim() === ''
      )
    ) {
      throw new ApiError(400, 'All fields are required');
    }
    if (email.includes(!'@')) {
      throw new ApiError(400, 'Please enter a valid email');
    }

    let localAvatarPath;
    let localCoverImagePath;

    if (
      req.files &&
      Array.isArray(req.files.avatar) &&
      req.files.avatar.length > 0
    ) {
      localAvatarPath = req.files.avatar[0].path;
    } else {
      throw new ApiError(400, 'Avatar is mandatory');
    }

    if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
    ) {
      localCoverImagePath = req.files.coverImage[0].path;
    } else {
      throw new ApiError(400, 'Cover Image is mandatory');
    }

    const existedUserWithEmail = await User.findOne({ email });
    const existedUserWithUserName = await User.findOne({ userName });

    if (existedUserWithEmail) {
      fs.unlinkSync(localAvatarPath);
      fs.unlinkSync(localCoverImagePath);
      throw new ApiError(409, 'User with this email is already exists');
    }

    if (existedUserWithUserName) {
      fs.unlinkSync(localAvatarPath);
      fs.unlinkSync(localCoverImagePath);
      throw new ApiError(409, 'This User Name is already take by another user');
    }

    const avatar = await uploadOnCloudinary(localAvatarPath);
    const coverImage = await uploadOnCloudinary(localCoverImagePath);

    if (!avatar) {
      throw new ApiError(
        500,
        'Something went wrong while uploading Avatar in cloudinary'
      );
    }

    if (!coverImage) {
      throw new ApiError(
        500,
        'Something went wrong while uploading Cover Image in cloudinary'
      );
    }

    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || '',
      email,
      password,
      userName: userName.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
      '-password -refreshToken'
    );

    if (!createdUser) {
      throw new ApiError(500, 'Something went wrong while Registering User');
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, 'User Registred succesfully'));
  } catch (error) {
    catchError(error, res, 'Register user');
  }
});

const loginuser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  try {
    if (!(userName || email)) {
      throw new ApiError(400, 'Username or Email is required!');
    }

    const user = await User.findOne({
      $or: [{ userName }, { email }],
    });

    if (!user) {
      throw new ApiError(404, 'User does not exists');
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(401, 'invalid user credentials');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const loggedInUser = await User.findOne(user._id).select(
      '-password -refreshToken'
    );

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: 'None', // Required for cross-origin requests
    };

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user: accessToken, refreshToken, loggedInUser },
          'User Succesfully LoggedIn'
        )
      );
  } catch (error) {
    catchError(error, res, 'Login User');
  }
});

const logoutuser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: 'None', // Required for cross-origin requests
    };

    return res
      .status(200)
      .clearCookie('accessToken', options)
      .clearCookie('refreshToken', options)
      .json(new ApiResponse(200, {}, 'User Logged Out Succesfully'));
  } catch (error) {
    catchError(error, res, 'Logout');
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  try {
    if (!incomingRefreshToken) {
      throw new ApiError(401, 'unauthorized request');
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, 'invalid refresh token');
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'Refresh token is expired or used');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user?._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          'new accessToken and RefreshToken is generated succesfully'
        )
      );
  } catch (error) {
    catchError(error, res, 'Refresh access token');
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  try {
    if (!(oldPassword || newPassword || confirmPassword)) {
      throw ApiError(404, 'All Fields are required');
    }

    if (!(newPassword === confirmPassword)) {
      throw new ApiError(
        400,
        'New Password is not matched with the Confirm Password'
      );
    }

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(400, 'Invalid old password');
    }

    user.password = newPassword;
    await user.save({
      validateBeforeSave: false,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Password change Succesfully'));
  } catch (error) {
    catchError(error, res, 'Change current user password');
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const userName = req.user.userName;

  try {
    if (!userName?.trim()) {
      throw new ApiError(400, 'UserName not found');
    }

    const channel = await User.aggregate([
      {
        $match: {
          userName: userName?.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'channel',
          as: 'subscribers',
        },
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'subscriber',
          as: 'subscribed',
        },
      },
      {
        $addFields: {
          subscriberCount: {
            $size: '$subscribers',
          },
          subscribedCount: {
            $size: '$subscribed',
          },
          isSubscribed: {
            $cond: {
              if: {
                $in: [req.user?._id, '$subscribers.subscriber'],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullName: 1,
          userName: 1,
          subscriberCount: 1,
          subscribedCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1,
        },
      },
    ]);

    if (!channel?.length) {
      throw new ApiError(400, 'Channel doesnot exists');
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          channel[0],
          'fetched current user data succesfully'
        )
      );
  } catch (error) {
    catchError(error, res, 'fetch current user');
  }
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, userName } = req.body;
  try {
    if (!fullName && !userName) {
      throw new ApiError(400, 'at least one fields is required');
    }

    const user = await User.findById(req.user?._id).select('-password');

    if (fullName) {
      user.fullName = fullName;
      await user.save({
        validateBeforeSave: false,
      });
    }

    if (userName) {
      user.userName = userName;
      await user.save({
        validateBeforeSave: false,
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, 'account update succesfully'));
  } catch (error) {
    catchError(error, res, 'Updating account details');
  }
});

const deleteAvatar = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const avatar = await user.avatar;

    const delAvatar = await deleteOnCloudinary(avatar);

    if (!delAvatar) {
      throw new ApiError(404, 'Some thing went wrong while deleting avatar');
    }

    user.avatar = '';
    await user.save({
      validateBeforeSave: false,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'avatar delete succesfully'));
  } catch (error) {
    catchError(error, res, 'Delete Avatar');
  }
});

const deleteCoverImage = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const coverImage = await user.coverImage;

    const delCoverImage = await deleteOnCloudinary(coverImage);

    if (!delCoverImage) {
      throw new ApiError(
        400,
        'Something went wrong while deletiing cover image'
      );
    }

    user.coverImage = '';
    await user.save({
      validateBeforeSave: false,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'cover-image delete succesfully'));
  } catch (error) {
    catchError('Delete Cover Image');
  }
});

const updateAvatar = asyncHandler(async (req, res) => {
  const checkAvatar = await User.findById(req.user?._id).select('-password');
  try {
    const isAvatarAvailable = await checkAvatar.avatar;
    if (isAvatarAvailable) {
      await deleteOnCloudinary(isAvatarAvailable);
    }

    const newAvatarLocalPath = req.file?.path;
    if (!newAvatarLocalPath) {
      throw new ApiError(400, 'Avatar is required');
    }

    const avatar = await uploadOnCloudinary(newAvatarLocalPath);

    if (!avatar.url) {
      throw new ApiError(400, 'Error accur while file upload on cloudinary');
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      {
        new: true,
      }
    ).select('-password');

    return res
      .status(200)
      .json(new ApiResponse(200, user, 'Avatar updated successfully'));
  } catch (error) {
    catchError(error, res, 'Update Avatar');
  }
});

const updateCoverImage = asyncHandler(async (req, res) => {
  try {
    const checkCoverImage = await User.findById(req.user?._id).select(
      '-password'
    );
    const isCoverImageAvailable = await checkCoverImage.coverImage;
    if (isCoverImageAvailable) {
      await deleteOnCloudinary(isCoverImageAvailable);
    }

    const newCoverImageLocalPath = req.file?.path;
    if (!newCoverImageLocalPath) {
      throw new ApiError(400, 'Cover Image is required');
    }

    const coverImage = await uploadOnCloudinary(newCoverImageLocalPath);

    if (!coverImage.url) {
      throw new ApiError(400, 'Error accur while file upload on cloudinary');
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      {
        new: true,
      }
    ).select('-password');

    return res
      .status(200)
      .json(new ApiResponse(200, user, 'cover image updated successfully'));
  } catch (error) {
    catchError(error, res, 'Updating Cover image');
  }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  try {
    if (!userName?.trim()) {
      throw new ApiError(400, 'UserName not found');
    }

    const channel = await User.aggregate([
      {
        $match: {
          userName: userName?.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'channel',
          as: 'subscribers',
        },
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'subscriber',
          as: 'subscribed',
        },
      },
      {
        $addFields: {
          subscriberCount: {
            $size: '$subscribers',
          },
          subscribedCount: {
            $size: '$subscribed',
          },
          isSubscribed: {
            $cond: {
              if: {
                $in: [req.user?._id, '$subscribers.subscriber'],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullName: 1,
          userName: 1,
          subscriberCount: 1,
          subscribedCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1,
        },
      },
    ]);

    if (!channel?.length) {
      throw new ApiError(400, 'Channel doesnot exists');
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, channel[0], 'user channel fetched succesfully')
      );
  } catch (error) {
    catchError(error, res, 'Fetching user profile');
  }
});

const getWatchHistory = asyncHandler(async (req, res) => {
  try {
    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $lookup: {
          from: 'videos',
          localField: 'watchHistory',
          foreignField: '_id',
          as: 'watchHistory',
          pipeline: [
            {
              $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner',
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
                      userName: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                owner: {
                  $first: '$owner',
                },
              },
            },
            {
              $project: {
                _id: 1,
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                owner: 1,
              },
            },
          ],
        },
      },
      // {
      //   $project: {
      //     watchHistory: {
      //       _id: 1,
      //       videoFile: 1,
      //       thumbnail: 1,
      //       title: 1,
      //       description: 1,
      //       views: 1,
      //       createdAt: 1,
      //       owner: 1,
      //     },
      //   },
      // },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user[0].watchHistory,
          'watch History fetched succefully'
        )
      );
  } catch (error) {
    catchError(error, res, 'fetching Watch histsory');
  }
});

export {
  registeruser,
  loginuser,
  logoutuser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  deleteAvatar,
  deleteCoverImage,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
