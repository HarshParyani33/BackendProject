import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
 
const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {channelId} = req.params
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel Id")
    }
    const totalVideos = await Video.countDocuments({ channel: channelId });

    // Fetch total views across all videos of the channel
    const totalViews = await Video.aggregate([
        { $match: { channel: mongoose.Types.ObjectId(channelId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const totalViewsCount = totalViews.length > 0 ? totalViews[0].totalViews : 0;

    // Fetch total subscribers for the channel
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    // Fetch total likes across all videos of the channel
    const totalLikes = await Like.countDocuments({ videoId: { $in: await Video.find({ channel: channelId }).distinct("_id") } });

    // Respond with the stats
    res
    .status(200)
    .json(new ApiResponse(200, {
        totalVideos,
        totalViews: totalViewsCount,
        totalSubscribers,
        totalLikes
    }, "Channel stats fetched successfully"));

})
 
const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { channelId } = req.params;

    // Validate channelId
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel Id");
    }

    // Fetch all videos uploaded by the channel
    const videos = await Video.find({ channel: channelId }).sort({ createdAt: -1 });

    // Check if videos exist
    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos found for this channel");
    }

    // Respond with the videos
    res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
})
 
export {
    getChannelStats, 
    getChannelVideos
    }