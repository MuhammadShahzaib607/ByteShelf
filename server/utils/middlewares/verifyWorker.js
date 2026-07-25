import { sendRes } from "../responseHandler.js";

export const verifyWorker = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "worker") {
      return sendRes(res, 403, false, "Access denied. Only workers can perform this action.");
    }
    next();
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};
