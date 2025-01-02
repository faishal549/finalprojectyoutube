const mongoose = require('mongoose')

const DB_URI = process.env.MONGODB_STR

const connectionDatabase = async () => {
    try {
        const connectionInstance = await mongoose.connect(DB_URI)
        console.log(`MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error("Error :", error)
        process.exit(0)

    }
}

module.exports = connectionDatabase;