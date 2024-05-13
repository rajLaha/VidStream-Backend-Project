import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  isPasswordCorrect,
  generateAccessToken,
  generateRefreshToken,
} from "../models/user.models.js";

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

// algorithm for register user
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
    // fieldname: 'avatar',
    // originalname: 'avatar.jpg',
    // encoding: '7bit',
    // mimetype: 'image/jpeg',
    // destination: './public/temp',
    // filename: 'avatar.jpg',
    // path: 'public\\temp\\avatar.jpg',
    // size: 102278
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

// Login User algotithm
// get data from body
// validation for username or email
// check for password
// if password is correct then create access and refreshtoken
// send cookies

const loginuser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  if (!userName || !email) {
    throw new ApiError(400, "Username or Email required!");
  }

  const user = User.findOne({
    $or: [userName, email],
  });

  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  const passwordValid = await user.isPasswordCorrect(password);

  if (!passwordValid) {
    throw new ApiError(401, "invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = User.findOne(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
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

// logout user algorithm
// first we need to access the user we cannot directly use the req.user because it is declared in another block of code than we need a middleware to inject the user so we can use the req.user method for access the user's credientals
// we create a middleware auth.middlewares.js for access and verify the user
// clear refreshToken from database
// clear cookie of refreshToken and accessToken

const logoutuser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
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

  res
    .status(200)
    .clearCookie(accessToken, options)
    .clearCookie(refreshToken, options)
    .json(200, {}, "User Logged Out Succesfully");
});
export { registeruser, loginuser, logoutuser };
