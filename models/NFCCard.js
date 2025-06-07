const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema({
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

const nfcCardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cardId: { type: String, required: true, unique: true },
  nfcUrl: { type: String, required: true, unique: true },
  companyProfiles: [companyProfileSchema], // Changed from contacts to companyProfiles
  purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", required: true },
});

module.exports = mongoose.model('NFCCard', nfcCardSchema);