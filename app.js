require('dotenv').config("")
const express = require('express')
const app = express()
const connectionDatabase = require("./db/connection")
const PORT = process.env.PORT || 8000;
const userRouter = require("./routes/user-routes")
const cookieParser = require("cookie-parser")


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use("/api/v1/users", userRouter)





app.get('/', (req, res) => {
    res.send("hello from server")
})

connectionDatabase().then(() => {
    app.listen(PORT, () => {
        console.log('server is listening at :${PORT}')
    })
})
