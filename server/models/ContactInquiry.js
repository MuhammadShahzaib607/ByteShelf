import mongoose from "mongoose";

const contactInquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["NEW", "RESOLVED"],
      default: "NEW",
    },
  },
  { timestamps: true }
);

const ContactInquiry = mongoose.model("ContactInquiry", contactInquirySchema);

export default ContactInquiry;
