// otpController.js
const { sendEmail } = require('../utils/emailService');

const otpStore = {}; // Temporary store for OTPs

// Route handler to send OTP
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, verified: false };

  try {
    await sendEmail(email, otp); // Assume sendEmail is a utility to send OTP via email
    res.status(200).json({ success: true, message: 'OTP sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// Utility function to verify OTP
exports.verifyOtp = (email, otp) => {
  if (otpStore[email] && otpStore[email].otp === otp) {
    otpStore[email].verified = true;
    return true;
  }
  return false;
};

// Utility function to clear OTP
exports.clearRegistrationOtp = (email) => {
  delete otpStore[email];
};