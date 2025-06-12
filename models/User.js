const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const companyProfileSchema = new mongoose.Schema({
  userProfile: { type: String, default: "" },
  companyName: { type: String, required: true },
  companyLocation: { type: String, required: true },
  companyPhone: { type: String, required: true },
  companyEmail: { type: String, required: true },
  website: { type: String, default: "" },
  
  // Social Media Links
  twitterX: { type: String, default: "" },
  youtube: { type: String, default: "" },
  instagram: { type: String, default: "" },
  facebook: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  
  // Additional Info
  description: { type: String, default: "" },
  industry: { type: String, default: "" },
  foundedYear: { type: Number, default: null },
  employeeCount: { type: String, default: "" },
  
  // Visual Assets
  logo: { type: String, default: "" },
  coverImage: { type: String, default: "" },
  
  // Status
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
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
  companyProfiles: [companyProfileSchema],
  
  // Legacy field - keep temporarily to avoid index issues
  // Remove this after dropping the index
  nfcCards: {
    type: [mongoose.Schema.Types.Mixed],
    default: undefined
  },
  
  nfcCardCount: {
    type: Number,
    default: 0,
  },
  
  // QR Code storage
  qrCode: {
    type: String, // Base64 data URL
    default: ""
  },
  
  profileUrl: {
    type: String,
    default: ""
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