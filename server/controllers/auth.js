import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendRes } from "../utils/responseHandler.js";
import { sendEmail } from "../utils/otp/sendMail.js";
import { otpEmailTemplate } from "../utils/otp/otpMailTemplate.js";

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
 
    if (!name || !email || !password || !role) {
      return sendRes(res, 400, false, "All fields are required");
    }

    if (password.length < 8) {
       return sendRes(res, 404, false, "Password should be 8 characters long");
    }
 
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return sendRes(res, 409, false, "Email already registered");
    }
 
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
 
    let user;
    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.role = role;
      existingUser.otp = otp;
      existingUser.otpExpiry = otpExpiry;
      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        otp,
        otpExpiry,
      });
    }
 
    await sendEmail(email, "Verify your ByteShelf account", otpEmailTemplate(otp));
 
    return sendRes(res, 201, true, "Signup successful, OTP sent", { userId: user._id });
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendRes(res, 400, false, "Email and OTP are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return sendRes(res, 404, false, "User not found");
    }

    if (user.isVerified) {
      return sendRes(res, 400, false, "User already verified");
    }

    if (user.otp !== otp) {
      return sendRes(res, 400, false, "Invalid OTP");
    }

    if (user.otpExpiry < new Date()) {
      return sendRes(res, 400, false, "OTP expired");
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return sendRes(res, 200, true, "Account verified successfully");
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendRes(res, 400, false, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return sendRes(res, 404, false, "User not found");
    }

    if (user.isVerified) {
      return sendRes(res, 400, false, "User already verified");
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    return sendRes(res, 200, true, "OTP resent successfully");
  } catch (error) {
    return sendRes(res, 500, false, error.message);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendRes(res, 400, false, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return sendRes(res, 404, false, "User not found");
    }

    if (!user.isVerified) {
      const otp = generateOtp();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();

      await sendEmail(email, "Verify your ByteShelf account", otpEmailTemplate(otp));

      return sendRes(res, 403, false, "Account not verified, OTP has been sent to your email");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendRes(res, 401, false, "Invalid credentials");
    }

    const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    return sendRes(res, 200, true, "Login successful", { accessToken, refreshToken });
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendRes(res, 401, false, "Refresh token is required");
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return sendRes(res, 401, false, "Refresh token expired");
      }
      return sendRes(res, 401, false, "Invalid refresh token");
    }

    const accessToken = jwt.sign({ id: decoded.id, role: decoded.role }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "30d",
    });

    return sendRes(res, 200, true, "Access token generated", { accessToken });
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
 
    if (!user) {
      return sendRes(res, 404, false, "User not found");
    }
 
    return sendRes(res, 200, true, "Profile fetched successfully", user);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const editProfile = async (req, res) => {
  try {
    const { role, phone } = req.body;

    if (!role && !phone) {
      return sendRes(res, 400, false, "At least one field is required to update");
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return sendRes(res, 404, false, "User not found");
    }

    if (role) user.role = role;
    if (phone) user.phone = phone;

    await user.save();

    return sendRes(res, 200, true, "Profile updated successfully", user);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};