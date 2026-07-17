export const otpEmailTemplate = (otp) => {
  return `
  <div style="background-color:#F5EBE0; padding:40px 0; font-family:Arial, sans-serif;">
    <div style="max-width:480px; margin:0 auto; background-color:#FFFFFF; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      <div style="background-color:#4A2C2A; padding:24px; text-align:center;">
        <h1 style="color:#F5EBE0; margin:0; font-size:24px; letter-spacing:1px;">ByteShelf</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#3E2723; font-size:20px; margin-top:0;">Verify Your Account</h2>
        <p style="color:#5D4037; font-size:15px; line-height:1.6;">
          Use the OTP below to verify your ByteShelf account. This code is valid for the next 5 minutes.
        </p>
        <div style="text-align:center; margin:32px 0;">
          <span style="display:inline-block; background-color:#A1887F; color:#FFFFFF; font-size:28px; font-weight:bold; letter-spacing:8px; padding:14px 28px; border-radius:8px;">
            ${otp}
          </span>
        </div>
        <p style="color:#6D4C41; font-size:13px; line-height:1.6;">
          If you did not request this code, you can safely ignore this email.
        </p>
      </div>
      <div style="background-color:#EFE3D9; padding:16px; text-align:center;">
        <p style="color:#3E2723; font-size:12px; margin:0;">&copy; ${new Date().getFullYear()} ByteShelf. All rights reserved.</p>
      </div>
    </div>
  </div>
  `;
};