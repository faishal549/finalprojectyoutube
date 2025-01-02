// it is a wrapper function which is a HOC it is for try catch syntax

const asyncHandler = (requestHandler) => {

    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }

}


// const asyncHandler =(fn)=>async(req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//         })
//     }

// }


module.exports = asyncHandler;