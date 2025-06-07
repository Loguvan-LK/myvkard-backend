const User = require('../models/User');

exports.addUrl = async (req, res) => {
  const { url } = req.body;
   const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.nfcCardCount <= 0) return res.status(403).json({ message: 'Please purchase an NFC card first' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.urls.push({ url, isActive: user.urls.length === 0 }); // First URL is active by default
    await user.save();

    res.status(200).json({ message: 'URL added', user });
  } catch (err) {
    console.error('Add URL Error:', err);
    res.status(500).json({ message: 'Failed to add URL' });
  }
};

exports.removeUrl = async (req, res) => {
  const { urlId } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const urlToRemove = user.urls.find(u => u._id.toString() === urlId);
    user.urls = user.urls.filter(u => u._id.toString() !== urlId);
    if (urlToRemove && urlToRemove.isActive && user.urls.length > 0) {
      user.urls[0].isActive = true; // Set first remaining URL as active
    }
    await user.save();

    res.status(200).json({ message: 'URL removed', user });
  } catch (err) {
    console.error('Remove URL Error:', err);
    res.status(500).json({ message: 'Failed to remove URL' });
  }
};

exports.setActiveUrl = async (req, res) => {
  const { urlId } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.urls = user.urls.map(u => ({
      ...u._doc,
      isActive: u._id.toString() === urlId
    }));
    await user.save();

    res.status(200).json({ message: 'Active URL set', user });
  } catch (err) {
    console.error('Set Active URL Error:', err);
    res.status(500).json({ message: 'Failed to set active URL' });
  }
};