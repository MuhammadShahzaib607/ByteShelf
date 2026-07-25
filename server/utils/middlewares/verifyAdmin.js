import { sendRes } from "../responseHandler.js";

export const verifyAdmin = (req, res, next) => {
  // verifyToken must run before this middleware to populate req.user
  if (!req.user) {
    return sendRes(res, 401, false, "Authentication required");
  }

  if (req.user.role !== "admin") {
    return sendRes(res, 403, false, "Admin access required");
  }

  next();
};
