import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, catchError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Subscription } from '../models/subscription.models.js';
import { User } from '../models/user.models.js';

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  try {
    if (!channelId) {
      throw new ApiError(400, 'Required URL parameter is missing channelId');
    }

    const isChannelExists = await User.exists(
      new mongoose.Types.ObjectId(channelId)
    );

    if (!isChannelExists) {
      throw new ApiError(404, 'Channel not found');
    }

    let subscriberToggle;

    const isAlreadySubscribed = await Subscription.find({
      channel: channelId,
      subscriber: req.user?._id.toString(),
    });

    if (isAlreadySubscribed.length > 0) {
      const deleteSubscription = await Subscription.deleteOne({
        _id: isAlreadySubscribed[0]._id,
      });

      if (!deleteSubscription) {
        throw new ApiError(
          500,
          'Something went wrong while toggle subscription'
        );
      }

      subscriberToggle = false;
    } else {
      const createSubscripton = await Subscription.create({
        channel: channelId,
        subscriber: req.user?._id,
      });

      if (!createSubscripton) {
        throw new ApiError(
          500,
          'Something went wrong while toggle subscription'
        );
      }

      subscriberToggle = true;
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, subscriberToggle, 'Subscriber toggled succesfully')
      );
  } catch (error) {
    catchError(error, res, 'Toggleing Subscription');
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  try {
    if (!channelId) {
      throw new ApiError(400, 'Required URL parameter is missing channelId');
    }

    const isChannelExists = await User.exists(
      new mongoose.Types.ObjectId(channelId)
    );

    if (!isChannelExists) {
      throw new ApiError(404, 'Channel not found');
    }

    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribers[0]?.count || 0,
          'Subscriber fetched succesfully'
        )
      );
  } catch (error) {
    catchError(error, res, 'Fetching Subscriber');
  }
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  try {
    if (!subscriberId) {
      throw new ApiError(400, 'Required URL parameter is missing subscriberId');
    }

    const isSubscriberExists = await User.exists(
      new mongoose.Types.ObjectId(subscriberId)
    );

    if (!isSubscriberExists) {
      throw new ApiError(404, 'User not found');
    }

    const subscribedChannels = await Subscription.aggregate([
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(subscriberId),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'channel',
          foreignField: '_id',
          as: 'Channels',
        },
      },
      {
        $project: {
          Channels: {
            _id: 1,
            userName: 1,
            fullName: 1,
            avatar: 1,
            coverImage: 1,
            createdAt: 1,
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribedChannels,
          'Subscribed Channels fetched succesfully'
        )
      );
  } catch (error) {
    catchError(error, res, 'Fetching Subscribed channels');
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
