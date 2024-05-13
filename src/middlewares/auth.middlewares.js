import { User } from "../models/user.models";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookie?.accessToken ||
      req.header("Authorization")?.replace("bearer ", "");

    if (!token) {
      throw new ApiError(401, "unauthorized user access");
    }

    console.log(token);

    const decodeToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    console.log(decodeToken);

    const user = User.findById(decodeToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(500, error?.message || "Invalid access token");
  }
});
