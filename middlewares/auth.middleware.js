const asyncHandler = require("../utils/asyncHandler")
const jwt = require("jsonwebtoken")
const User = require("../models/user.model")



const verifyJWT = asyncHandler(async (req, res, next) => {

    try {
        const token = req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})


module.exports = verifyJWT;