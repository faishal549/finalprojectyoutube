const asyncHandler = require("../utils/asyncHandler")
const ApiError = require("../utils/ApiError")
const User = require("../models/user.model")
const uploadOnCloudinary = require("../utils/cloudinary")
const ApiResponse = require("../utils/ApiResponse")
const jwt = require("jsonwebtoken")


const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const AccessToken = await user.generateAccessToken()
        const RefreshToken = await user.generateRefreshToken()

        user.RefreshToken = RefreshToken
        await user.save({ validateBeforeSave: false })
        return { AccessToken, RefreshToken }

    } catch (error) {

        throw new ApiError(500, "No user found while generating token ")

    }
}


// logic building 
const userRegistration = asyncHandler(async (req, res) => {
    //1.  get user details from frontend which depend on my model
    const { fullname, email, username, password } = req.body
    //2.  validation - not empty 
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All field are required")
    }
    //3. check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    //4. check for images , check for avatar as it is required in models
    const avatarLocalPath = await req.files?.avatar[0]?.path;
    console.log(avatarLocalPath)
    //4.0 if we use multer as a middleware it provides us files access
    const coverImageLocalPath = await req.files?.coverImage[0]?.path;
    console.log(coverImageLocalPath)

    //4.1 check avatar properly uploaded or not 
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file required")
    }
    //5. upload them at cloudinary, avatar
    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // console.log("cloudinary", avatar)
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    // //5.1 checks for avatar

    // if (!avatar) {
    //     throw new ApiError(400, "Avatar file required")
    // }
    //6. create user object - create entry in db 

    const user = await User.create({
        fullname,
        avatar: avatarLocalPath,                                     //: avatar.url,    // only  required url not whole object
        coverImage: coverImageLocalPath,                                                 // coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    //7. remove password and refresh token field from response  //. check user create or not 
    const createdUser = await User.findById(user._id).select({ password: 0 })
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering a user")
    }
    //8. return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )



})

const userLogin = asyncHandler(async (req, res) => {
    // required username or email and password
    const { email, password, username } = req.body

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })




    // check username and email existing or not 
    if (!existedUser) {
        throw new ApiError(404, "User does not exist ")
    }
    // verify password 
    const verifiedPassword = await existedUser.comparePassword(password)
    if (!verifiedPassword) {
        throw new ApiError(401, "Invalid  user credentials")
    }
    if (verifiedPassword) {

        const { AccessToken, RefreshToken } = await generateAccessTokenAndRefreshToken(existedUser._id)
        const LoggedUser = await User.findById(existedUser._id).select("-password -refreshToken")
        const options = {
            httpOnly: true,
            secure: true
        }
        res.status(200)
            .cookie("AccessToken", AccessToken, options)
            .cookie("RefreshToken", RefreshToken, options)
            .json(
                new ApiResponse(200, { user: AccessToken, RefreshToken, LoggedUser },
                    { message: "User Logged in Successfully" }
                )
            )


    }
    // generate token 
    // generate refresh token  
})


const userLogout = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).clearCookie("AccessToken", options)
        .clearCookie("RefreshToken", options).json(new ApiResponse(200, {}, "User Logout"))
})

//^ access Token expired access through refresh token

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookie.RefreshToken || req.body.RefreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Invalid Refresh Token")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_KEY)

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "user not matched with refresh token")
        }
        if (incomingRefreshToken !== user?._refreshToken) {

            throw new ApiError(401, "Refresh Token invalid or Used")

        }

        //^ if user matched then we will create new access token 


        const options = {
            httpOnly: true,
            secure: true
        }
        const { AccessToken, RefreshToken } = await generateAccessTokenAndRefreshToken(user._id)

        return res.status(200)
            .cookie("AccessToken", AccessToken, options)
            .cookie("RefreshToken", RefreshToken, options)
            .json(200, new ApiResponse(200, { AccessToken, RefreshToken },
                "Access Token Refreshed Successfully"
            ))

    } catch (error) {
        throw new ApiError(404, error.message || "invalid Refresh Token from user end")

    }
})

//^ Password change controller 

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?.id);
    const isPasswordCorrect = await user.comparePassword(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password")
    }
    //^ now set new password and save it to in DB 
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password Change successfully"))

})

//^ get current user information 

const getCurrentUser = asyncHandler(async (req, res) => {

    const user = req.user;
    return res
        .status(200)
        .json(200, user, "User details fetched successfully ")

})

//^ update the email and fullname 

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;

    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: { fullname, email }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully "))

})

//^ update user profile photo

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: { avatar: avatarUserAvatar }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(200, new ApiResponse(200, user, "Avatar Updated Successfully"))
})



//^ update user coverImage

const updateCoverImage = asyncHandler(async (req, res) => {

    const coverImagePath = req.file?.path
    if (!coverImagePath) {
        throw new ApiError(400, "CoverImage file is missing")
    }
    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: { coverImage: coverImagePath }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(200, new ApiResponse(200, user, "coverImage Updated Successfully"))
})

module.exports = {
    userRegistration,
    userLogin,
    userLogout,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage
}