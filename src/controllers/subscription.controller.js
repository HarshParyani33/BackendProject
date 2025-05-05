import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
 
 
const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const {userId} = req.user

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
    }
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel Id")
    }
    const channel = await User.findById(channelId).select("-password -refreshToken")
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }
    const subscription = await Subscription.findOne({subscriber: userId, channel: channelId})
    if (subscription) {
        await Subscription.deleteOne({subscriber: userId, channel: channelId})
        channel.subscriberCount -= 1
        await channel.save()
        return res
        .status(200)
        .json(new ApiResponse(200, subscription, "Unsubscribed Successfully"))
    } else {
        await Subscription.create({subscriber: userId, channel: channelId})
        channel.subscriberCount += 1
        await channel.save()
        return res
        .status(200)
        .json(new ApiResponse(200, subscription, "Subscribed Successfully"))
    }
})
 
// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const {userId} = req.user
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
    }
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel Id")
    }
    const channel = await User.findById(channelId).select("-password -refreshToken")
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }
    const subscribers = await Subscription.aggregate([
        { $match: { channel: mongoose.Types.ObjectId(channelId) } }, // Match subscriptions for the channel
        {
            $lookup: {
                from: "users", // Join with the User collection
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        { $unwind: "$subscriberDetails" }, // Flatten the subscriberDetails array
        { $project: { "subscriberDetails.password": 0, "subscriberDetails.refreshToken": 0 } } // Exclude sensitive fields
    ]);
    if (!subscribers) {
        throw new ApiError(404, "No subscribers found")
    }
    res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))

})
 
// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const { userId } = req.user

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
    }
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Subscriber Id")
    }
    const subscriber = await User.findById(subscriberId).select("-password -refreshToken")
    if (!subscriber) {
        throw new ApiError(404, "Subscriber not found")
    }
    const subscriptions = await Subscription.aggregate([
        { $match: { subscriber: mongoose.Types.ObjectId(subscriberId) } }, // Match subscriptions for the subscriber
        {
            $lookup: {
                from: "users", // Join with the User collection
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        { $unwind: "$channelDetails" }, // Flatten the channelDetails array
        { $project: { "channelDetails.password": 0, "channelDetails.refreshToken": 0 } } // Exclude sensitive fields
    ]);
    if (!subscriptions) {
        throw new ApiError(404, "No subscriptions found")
    }
    res
    .status(200)
    .json(new ApiResponse(200, subscriptions, "Subscriptions fetched successfully"))
})
 
export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels 
}