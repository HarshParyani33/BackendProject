import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";
import { subscribe } from 'diagnostics_channel';
import mongoose from 'mongoose';

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went Wrong while generating Refresh and Access token")
    }
}

const registerUser = asyncHandler( async (req,res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: via username and email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response

    const {fullName, email, username, password} = req.body
    //console.log(req.body)
    console.log("email", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim ==="")
    ) {
        throw new ApiError(400, "All Fields are required")
    }

    const existinguUser = await  User.findOne({
        $or: [{ username }, { email }]
    })
    
    if (existinguUser) {
        throw new ApiError(409, "User with email or Username already exists")
    }

    const avtarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0].path;

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    //console.log(avtarLocalPath);
    //console.log(coverImageLocalPath);

    if (!avtarLocalPath) {
        throw new ApiError(400, "avatar file is required")
    }
    
    const avatar = await uploadOnCloudinary(avtarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        username: username.toLowerCase(),
        email
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something Went Wrong while registering the user!")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered successfully")
    )

} )

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token 
    // send cookie

    const {email,password,username} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const loginUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!loginUser){
        throw new ApiError(404,"User does not exist")
    }
    console.log(loginUser);

    const isPasswordValid = await loginUser.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(404,"Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(loginUser._id)

    const loggedInUser = await User.findById(loginUser._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,

    }

    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken", refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req,res)=>{

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,

    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {},"User Logged Out Successfully"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken =  jwt.verify(
            incomingRefreshToken,
             process.env.REFRESH_TOKEN_SECRET)
    
        const user  = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is Expired or used")
        }
    
        const options = {
            httpOnly: true,
            Secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken,options)
        .cookie("refreshToken", newRefreshToken,options)
        .json
            (
                new ApiResponse(
                    200,
                    {accessToken, refreshToken: newRefreshToken},
                    "Access Token Refreshed"
                )
            )
        
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const{oldPassword, newPassword} = req.body


    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Password is Incorrect")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password is Saved Successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=> {
    return res
    .status(200)
    .json(200,req.user,"Current User Fetched Successfully")
})

const updateAccountDetails = asyncHandler(async (req,res) => {
    const {fullName,email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All Fields are Needed")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set: {
            fullName: fullName,
            email: email,
        }},
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Detais updated Successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        new ApiError(400, "Avatar File is Missing")
    }

    const avatar  = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(200,user, "Avatar Image Updated Successfully")

})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        new ApiError(400, "Cover Image is Missing")
    }

    const coverImage  = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on CoverImage")
    }

    const user  = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(200,user, "Cover Image Updated Successfully")

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if(!username?.trim()) {
        throw new ApiError(400,"Username is Missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {$lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }},
        {
            $lookup: {
                from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCound: {
                    $size: "$subscribedTo"
                },
                isSubscribed : {
                    $cond:{
                        if: {$in: [req.user?.id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCound: 1,
                isSubscribed : 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel Does Not Exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetched successflly"))

})

const watchHistory = asyncHandler(async(req,res)=>{
    const user  = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "WatchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [{
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1,
                                }
                            }]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,user[0].watchHistory, "Watch History fetched Successfully"))
    
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword, 
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    watchHistory
}