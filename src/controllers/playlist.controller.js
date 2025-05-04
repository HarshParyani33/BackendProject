import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"
 
 
const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    

    if (!name || !description) {
        throw new ApiError(400, "Name or Description of the Playlist is not Found")
    }
    const user = await User.findById(req.user?._id).select("-password -refreshToken")
    
    if (!user) {
        throw new ApiError(400, "User not found")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: user,
        videos: [],
    }
)
    res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"))
    //TODO: create playlist
})
 
const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    const playlists = await Playlist.find({owner: userId})
    
    if (!playlists) {
        throw new ApiError(400, "Playlists not found")
    }

    res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
})
 
const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }
    res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})
 
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID") 
    }
    const playlist  = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
        
    }

    playlist.video.push(videoId)

    await playlist.save()

    res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added to playlist successfully"))   

})
 
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID") 
    }
    const playlist  = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
        
    }

    const videoIndex = playlist.video.indexOf(videoId)
    if (videoIndex === -1) {
        throw new ApiError(400, "Video not found in playlist")
    }
    playlist.video.splice(videoIndex, 1)
    await playlist.save()

    res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed from playlist successfully"))
})
 
const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID") 
    }
    const playlist  = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
        
    }
    await playlist.remove()
    res
    .status(200)
    .json(new ApiResponse(200, null, "Playlist deleted successfully"))
})
 
const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID") 
    }

    const playlist  = await Playlist.findByIdAndUpdate(playlistId,
        {$set: {name, description}},
        {new: true}
    )
    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
        
    }
    res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"))

})
 
export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}