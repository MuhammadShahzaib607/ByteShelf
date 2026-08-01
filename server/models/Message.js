import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    attachments: {
      type: [
        {
          url: { type: String, required: true },
          fileType: {
            type: String,
            enum: ["image", "pdf", "document"],
            required: true,
          },
          fileName: { type: String, default: "" },
          fileSize: { type: mongoose.Schema.Types.Mixed, default: 0 },
        },
      ],
      default: [],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;