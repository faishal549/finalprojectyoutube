const v2 = require("cloudinary");
const fs = require("fs")

v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET_KEY
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await v2.uploader.upload(localFilePath, { resource_type: "auto" })
        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary ", response.url)
        console.log("response", response)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath)  // remove the locally saved temporary file as the upload operation got failed
        return null;

    }
}

module.exports = uploadOnCloudinary;