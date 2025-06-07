const User = require('../models/User');

exports.redirectToActiveUrl = async (req, res) => {
  const { uniqueId } = req.params;
  const user = await User.findOne({ uniqueId });
  if (!user) return res.status(404).send('User not found');
  if (user.nfcCardCount <= 0) return res.status(403).send('Please purchase an NFC card first');
  const activeUrl = user.urls.find(u => u.isActive);
  if (!activeUrl) return res.status(404).send('No active URL set');
  res.redirect(activeUrl.url);
};