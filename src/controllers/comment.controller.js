import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
 
const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    // videoId given find comments,
    // videoId mei owner bhi daalna hai
    // page and limit ka user karna hai
    const comments = await Comment.find({ video: videoId })
        .populate("owner", "name email") // Populate owner details (e.g., name and email)
        .skip((page - 1) * limit) // Skip documents for pagination
        .limit(parseInt(limit)) // Limit the number of documents
        .sort({ createdAt: -1 }); // Sort by creation date (newest first)

    // Check if comments exist
    if (!comments || comments.length === 0) {
        throw new ApiError(404, "No comments found for this video");
    }

    // Respond with the comments
    res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
 
})
 
const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { userId } = req.user;
    const { text } = req.body;

    // Validate videoId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    // Validate text
    if (!text || text.trim() === "") {
        throw new ApiError(400, "Comment text is required");
    }

    // Create a new comment
    const comment = await Comment.create({
        video: videoId,
        owner: userId,
        text,
    });

    // Respond with the created comment
    res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"));
})
 
const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})
 
const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})
 
export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }