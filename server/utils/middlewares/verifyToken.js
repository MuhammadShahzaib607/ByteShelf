import jwt from "jsonwebtoken";
import { sendRes } from "../responseHandler.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendRes(res, 401, false, "Token missing, please login again");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendRes(res, 401, false, "Token expired");
    }
    return sendRes(res, 401, false, "Invalid token");
  }
};