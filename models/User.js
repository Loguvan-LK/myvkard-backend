const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const urlSchema = new mongoose.Schema({
  url: { type: String, required: true },
  isActive: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  uniqueId: {
    type: String,
    unique: true,
    required: true,
  },
  urls: [urlSchema],
  nfcCardCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);