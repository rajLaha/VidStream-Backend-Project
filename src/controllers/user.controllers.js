import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
      "something went wrong while create Access and Refresh Token"
    );
  }
};

// code for register user
// get userdetails from frontend
// validation - email etc. not empty
// check if user is already exits : username, email
// check for images and avatar
// upload images to cloudinary, avatar
// create user object and stored in DB
// remove password and refresh token field from response
// check for user creation
// return response

const registeruser = asyncHandler(async (req, res) => {
  // whenever we get data from "form" or "json" then we can access the data in backend with req.body

  const { userName, email, fullName, password } = req.body;

  // console.log(userName, email); // we get the value of userName and email in the format of string
  // console.log(req.body); // here we get the total of form data in the format of object

  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }
  if (email.includes(!"@")) {
    throw new ApiError(400, "please enter a valid email");
  }

  // we can check or perform different operation on fineOne with $ sign
  // const existedUser = User.findOne({
  //   $or: [{ userName }, { email }],
  // });

  // findOne method return the boolean value on the basis of data is availabe or not
  const existedUserWithEmail = await User.findOne({ email });
  const existedUserWithUserName = await User.findOne({ userName });

  if (existedUserWithEmail) {
    throw new ApiError(409, "user with this email is already exists");
  }

  if (existedUserWithUserName) {
    throw new ApiError(409, "This User Name is already take by another one");
  }

  let localAvatarPath;
  let localCoverImagePath;

  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    localAvatarPath = req.files.avatar[0].path;
    // console.log(req.files.avatar); // it shows all the predifened keys with values whih multer creates in the form of object
    // fieldname
    // originalname
    // encoding
    // mimetype
    // destination
    // filename
    // path
    // size
  } else {
    throw new ApiError(400, "Avatar is mandatory");
  }

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    localCoverImagePath = req.files.coverImage[0].path;
  }

  const avatar = await uploadOnCloudinary(localAvatarPath);
  const coverImage = await uploadOnCloudinary(localCoverImagePath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is mandatory");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  // console.log(user); // it shows the whole database query with the field and data in object format

  const createdUser = await User.findById(user._id).select(
    "-password -refreshTokens"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registred succesfully"));
});

// Login User code
// get data from body
// validation for username or email
// check for password
// if password is correct then create access and refreshtoken
// send cookies

const loginuser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  if (!(userName || email)) {
    throw new ApiError(400, "Username or Email required!");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: accessToken, refreshToken, loggedInUser },
        "User Succesfully LoggedIn"
      )
    );
});

// logout user code
// first we need to access the user we cannot directly use the req.user because it is declared in another block of code than we need a middleware to inject the user so we can use the req.user method for access the user's credientals
// we create a middleware auth.middlewares.js for access and verify the user
// clear refreshToken from database
// clear cookie of refreshToken and accessToken

const logoutuser = asyncHandler(async (req, res) => {
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
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Succesfully"));
});

// Refresh Access Token code

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
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
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "new accessToken and RefreshToken is generated succesfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!(oldPassword || newPassword || confirmPassword)) {
    throw ApiError(404, "All Fields are required");
  }

  if (!(newPassword === confirmPassword)) {
    throw ApiError(
      404,
      "New Password is not matched with the Confirm Password"
    );
  }

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({
    validateBeforeSave: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change Succesfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "fetched current user data succesfully")
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) {
    throw new ApiError(404, "at least one fields is required");
  }

  const user = await User.findById(req.user?._id).select("-password");

  if (fullName) {
    user.fullName = fullName;
    await user.save({
      validateBeforeSave: false,
    });
  }

  if (email) {
    user.email = email;
    await user.save({
      validateBeforeSave: false,
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "account update succesfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const newAvatarLocalPath = req.file?.path;
  if (!newAvatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(newAvatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error accur while file upload on cloudinary");
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
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const newCoverImageLocalPath = req.file?.path;
  if (!newCoverImageLocalPath) {
    throw new ApiError(400, "Cover Image is required");
  }

  const coverImage = await uploadOnCloudinary(newCoverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error accur while file upload on cloudinary");
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
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName?.trim()) {
    throw new ApiError(400, "UserName not found");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribed",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscriber",
        },
        subscribedCount: {
          $size: "$subscribed",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscriber.subscriber"],
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
    throw new ApiError(400, "Channel doesnot exits");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "user channel fetched succesfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: mongoose.Schema.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
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
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch History fetched succefully"
      )
    );
});

export {
  registeruser,
  loginuser,
  logoutuser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
