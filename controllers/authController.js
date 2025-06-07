// authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { verifyOtp, clearRegistrationOtp } = require("./otpController");

exports.register = async (req, res) => {
  const { email, password, otp } = req.body;

  try {
    if (!verifyOtp(email, otp)) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const uniqueId = uuidv4().substring(0, 8);
    const user = new User({ email, password, emailVerified: true, uniqueId, urls: [] });
    await user.save();

    clearRegistrationOtp(email);

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({ token, user: { ...user._doc, uniqueId: user.uniqueId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

// Login function remains unchanged
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ token, user: { ...user._doc, uniqueId: user.uniqueId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};