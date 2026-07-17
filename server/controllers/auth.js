import bcrypt from "bcryptjs";
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
 
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendRes(res, 409, false, "Email already registered");
    }
 
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
 
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      otp,
      otpExpiry,
    });
 
    await sendEmail(email, "Verify your ByteShelf account", otpEmailTemplate(otp));
 
    return sendRes(res, 201, true, "Signup successful, OTP sent", { userId: user._id });
  } catch (error) {
    return sendRes(res, 500, false, error.message);
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
    return sendRes(res, 500, false, "Something went wrong");
  }
};