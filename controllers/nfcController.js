const NFCCard = require('../models/NFCCard');
const mongoose = require('mongoose');

exports.getNFCCards = async (req, res) => {
  try {
    const cards = await NFCCard.find({ userId: new mongoose.Types.ObjectId(req.user.id) });
    res.status(200).json({ cards });
  } catch (err) {
    console.error("Get NFC Cards Error:", err);
    res.status(500).json({ message: "Failed to retrieve NFC cards" });
  }
};

exports.updateNFCCard = async (req, res) => {
  const { cardId, activeContactId } = req.body;

  try {
    const card = await NFCCard.findOne({
      cardId,
      userId: new mongoose.Types.ObjectId(req.user.id)
    });
    
    if (!card) return res.status(404).json({ message: "NFC Card not found" });

    // Set all contacts to inactive, then set the selected one as active
    card.contacts = card.contacts.map(c => ({
      ...c,
      isActive: c._id.toString() === activeContactId
    }));

    await card.save();
    res.status(200).json({ message: "NFC Card updated successfully", card });
  } catch (err) {
    console.error("Update NFC Card Error:", err);
    res.status(500).json({ message: "Failed to update NFC card" });
  }
};