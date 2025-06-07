const NFCCard = require('../models/NFCCard');

exports.getNFCCards = async (req, res) => {
  try {
    const cards = await NFCCard.find({ userId: req.user.id });
    res.status(200).json({ cards });
  } catch (err) {
    console.error("Get NFC Cards Error:", err);
    res.status(500).json({ message: "Failed to retrieve NFC cards" });
  }
};

exports.updateNFCCard = async (req, res) => {
  const { cardId, activeUrl } = req.body;

  try {
    const card = await NFCCard.findOne({ cardId, userId: req.user.id });
    if (!card) return res.status(404).json({ message: "NFC Card not found" });

    card.urls = card.urls.map(u => ({
      ...u,
      isActive: u.url === activeUrl
    }));

    await card.save();
    res.status(200).json({ message: "NFC Card updated", card });
  } catch (err) {
    console.error("Update NFC Card Error:", err);
    res.status(500).json({ message: "Failed to update NFC card" });
  }
};