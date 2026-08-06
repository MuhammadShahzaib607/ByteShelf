import ContactInquiry from "../models/ContactInquiry.js";
import { sendRes } from "../utils/responseHandler.js";

export const createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return sendRes(res, 400, false, "All fields are required");
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendRes(res, 400, false, "Invalid email format");
    }

    const inquiry = await ContactInquiry.create({ name, email, subject, message });

    return sendRes(res, 201, true, "Your message has been sent successfully. We'll get back to you within 24 hours.", inquiry);
  } catch (error) {
    console.error("[contact] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const getContacts = async (req, res) => {
  try {
    const { status, search } = req.query;

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { subject: searchRegex },
      ];
    }

    const contacts = await ContactInquiry.find(query).sort({ createdAt: -1 });

    return sendRes(res, 200, true, "Contacts fetched successfully", contacts);
  } catch (error) {
    console.error("[contact] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const resolveContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    const contact = await ContactInquiry.findById(contactId);
    if (!contact) {
      return sendRes(res, 404, false, "Contact inquiry not found");
    }

    contact.status = contact.status === "NEW" ? "RESOLVED" : "NEW";
    await contact.save();

    return sendRes(res, 200, true, `Contact marked as ${contact.status}`, contact);
  } catch (error) {
    console.error("[contact] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};
