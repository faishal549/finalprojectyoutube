const { Schema, model } = require("mongoose")
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2")

const videoSchema = new Schema(
    {
        videoFile: {
            type: String,  // cloudinary url
            required: true
        },
        thumbnail: {
            type: String,  // cloudinary url
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {                // will get this from cloudinary 
            type: Number,
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },



    }, { timestamps: true })




videoSchema.plugin(mongooseAggregatePaginate)  // Mongoose's aggregation pipeline

const Video = model("Video", videoSchema)


module.exports = Video;