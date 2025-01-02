const express = require("express")
const router = express.Router()
const upload = require("../middlewares/multer.middleware")
const { userRegistration, userLogin, userLogout, refreshAccessToken } = require("../controllers/user.controllers")
const verifyJWT = require("../middlewares/auth.middleware")

router.route("/register").post(upload.fields([{ name: "avatar", maxCount: 1 },
{ name: "coverImage", maxCount: 1 }]), userRegistration)

router.route("/login").post(userLogin)
module.exports = router

//& Secured Routes
router.route("/logout").post(verifyJWT, userLogout)
router.route("/refresh-token").post(refreshAccessToken)