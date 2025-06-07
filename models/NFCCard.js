const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  url: { type: String, required: true },
  isActive: { type: Boolean, default: false },
});

const nfcCardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cardId: { type: String, required: true, unique: true },
  nfcUrl: { type: String, required: true, unique: true },
  urls: [urlSchema],
  purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", required: true },
});

module.exports = mongoose.model('NFCCard', nfcCardSchema);