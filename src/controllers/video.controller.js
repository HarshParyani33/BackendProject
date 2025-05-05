import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
 
 
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const filter = {};
    if (query) {
        filter.title = { $regex: query, $options: "i" }; // Case-insensitive search
    }
    if (userId) {
        filter.owner = userId;
    }

    // Fetch videos with pagination and sorting
    const videos = await Video.find(filter)
        .sort({ [sortBy]: sortType }) // Sort by the specified field
        .skip((page - 1) * limit) // Skip documents for pagination
        .limit(parseInt(limit)); // Limit the number of documents

    // Respond with the videos
    res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
})
 
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    const { file } = req; // Multer will handle the file upload
    const { userId } = req.user;

    // Validate input
    if (!title || !description || !file) {
        throw new ApiError(400, "Title, description, and video file are required");
    }

    // Upload video to Cloudinary
    const uploadResult = await uploadOnCloudinary(file.path);

    if (!uploadResult) {
        throw new ApiError(500, "Failed to upload video to Cloudinary");
    }

    // Create a new video record in the database
    const video = await Video.create({
        title,
        description,
        url: uploadResult.secure_url, // Cloudinary video URL
        owner: userId,
        thumbnail: uploadResult.secure_url.replace(".mp4", ".jpg"), // Assuming thumbnail is derived from the video
    });

    // Respond with the created video
    res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
})
 
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})
 
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
 
})
 
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})
 
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})
 
export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}