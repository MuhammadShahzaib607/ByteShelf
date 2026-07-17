export const sendRes = (res, statusCode, success, message, data = null)=> {
    return res.status(statusCode).json({
   success: success,
   message: message,
   data: data,
   timeStamps: new Date()
    })
}