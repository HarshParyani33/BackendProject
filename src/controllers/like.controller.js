import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js" 
import {Tweet} from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const {userId} = req.user

    if (!isValidObjectId(userId)) {
        return ApiResponse.error(res, new ApiError("Invalid user id", 400))
    }
    if (!isValidObjectId(videoId)) {
        return ApiResponse.error(res, new ApiError("Invalid video id", 400))
    }
    const video = await Video.findById(videoId)
    if (!video) {
        return ApiResponse.error(res, new ApiError("Video not found", 404))
    }

    const like = await Like.findOne({userId, videoId})
    if (like) {
        await Like.deleteOne({userId, videoId})
        video.likesCount -= 1
        await video.save()
        return res
        .status(200)
        .json(new ApiResponse(200,like,"Like Removed Successfully"))
    } else {
        await Like.create({userId, videoId})
        video.likesCount += 1
        await video.save()
        return res
        .status(200)
        .json(new ApiResponse(200,like,"Video Liked Successfully"))
    }
})
 
const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const {userId} = req.user

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
    }
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment Id")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "No comment Found")
    }

    const like  = await Like.findOne({ userId,commentId})

    if (like) {
        await like.deleteOne({userId,commentId})
        comment.likesCount -=1
        await like.save()
        return res
        .status(200)
        .json(new ApiResponse(200,like,"Comment Disliked Successfully"))
    }
    else {
        await Like.create({userId,commentId})
        comment.likesCount +=1
        await comment.save()
        return res
        .status(200)
        .json(new ApiResponse(200,like,"Comment Liked Successfully"))
    }
})
 
const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const {userId} = req.user
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
        
    }
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet Id")
    }
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "No Tweet Found")
    }
    const like = await Like.findOne({userId,tweetId})
    if (like) {
        await like.deleteOne({userId,tweetId})
        tweet.likesCount -= 1  
        await tweet.save()
        return res  
        .status(200)
        .json(new ApiResponse(200,like,"Tweet Disliked Successfully"))
    } 
    else {
        await Like.create({userId,tweetId})
        tweet.likesCount += 1
        await tweet.save()
        return res
        .status(200)
        .json(new ApiResponse(200,like,"Tweet Liked Successfully"))
    }
})
 
const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const {userId} = req.user

    if (!userId) {
        throw new ApiError(400,"User Not found")
    }
    const likedVideos = await Like.find({userId}).populate("videoId")
    if (!likedVideos) {
        throw new ApiError(404,"No liked videos found")
    }
    res
    .status(200)
    .json(new ApiResponse(200,likedVideos,"Liked Videos Fetched Successfully"))



})
 
export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}