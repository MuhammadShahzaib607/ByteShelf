export const sendRes = (res, statusCode, success, message, data = null, error = null) => {
    return res.status(statusCode).json({
        success,
        message,
        data,
        timeStamps: new Date(),
        // Attach the exact error (toString) + stack when an error occurred,
        // so clients and logs surface the real failure instead of a generic message.
        ...(error ? { error: error.toString(), stack: error.stack || null } : {}),
    });
}