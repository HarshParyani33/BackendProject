import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
 
const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    if (!content) {
        throw new ApiError(400, "Content of the Tweet is not Found")
    }
    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    if (!user) {
        throw new ApiError(400, "User not found")
    }
    const tweet = await tweet.create({
        content,
        owner: user,
    })

    res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"))
})
 
const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User ID is not valid")
    }
    const user = await User.findById(userId).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(400, "User not found")
    }
    const tweets = await Tweet.find({owner: userId}).populate("owner", "-password -refreshToken")
    if (!tweets) {
        throw new ApiError(400, "Tweets not found")
    }
    res
    .status(200)   
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"))
})
 
const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet ID is not valid")
    }
    const tweet = await Tweet.findById(tweetId).select("-password -refreshToken")
    if (!tweet) {
        throw new ApiError(400, "Tweet not found")
    }
    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You are not the owner of this tweet")
    }
    if (!content) {
        throw new ApiError(400, "Content of the Tweet is not Found")
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {content}, {new: true})
    if (!updatedTweet) {
        throw new ApiError(400, "Tweet not found")
    }   
    res
    .status(200)     
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
})
 
const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet ID is not valid")
    }
    const tweet = await Tweet.findById(tweetId).select("-password -refreshToken")
    if (!tweet) {
        throw new ApiError(400, "Tweet not found")
    }
    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You are not the owner of this tweet")
    }
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    if (!deletedTweet) {
        throw new ApiError(400, "Tweet not found")
    }
    res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"))
})
 
export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}