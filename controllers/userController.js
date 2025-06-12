// myvcards/backend/controllers/userController.js
const User = require('../models/User');

exports.addCompanyProfile = async (req, res) => {
  const { 
    companyName, 
    companyLocation, 
    companyPhone, 
    companyEmail, 
    website,
    twitterX,
    youtube,
    instagram,
    facebook,
    linkedin,
    description,
    industry,
    foundedYear,
    employeeCount,
    logo,
    coverImage
  } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.nfcCardCount <= 0) {
      return res.status(403).json({ message: 'Please purchase an NFC card first' });
    }

    const newCompanyProfile = {
      companyName,
      companyLocation,
      companyPhone,
      companyEmail,
      website: website || '',
      twitterX: twitterX || '',
      youtube: youtube || '',
      instagram: instagram || '',
      facebook: facebook || '',
      linkedin: linkedin || '',
      description: description || '',
      industry: industry || '',
      foundedYear: foundedYear || null,
      employeeCount: employeeCount || '',
      logo: logo || '',
      coverImage: coverImage || '',
      isActive: user.companyProfiles.length === 0 // First profile is active by default
    };

    user.companyProfiles.push(newCompanyProfile);
    await user.save();

    res.status(200).json({ message: 'Company profile added successfully', user });
  } catch (err) {
    console.error('Add Company Profile Error:', err);
    res.status(500).json({ message: 'Failed to add company profile' });
  }
};

exports.removeCompanyProfile = async (req, res) => {
  const { profileId } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const profileToRemove = user.companyProfiles.find(p => p._id.toString() === profileId);
    user.companyProfiles = user.companyProfiles.filter(p => p._id.toString() !== profileId);
    
    // If removed profile was active, set first remaining profile as active
    if (profileToRemove && profileToRemove.isActive && user.companyProfiles.length > 0) {
      user.companyProfiles[0].isActive = true;
    }
    
    await user.save();

    res.status(200).json({ message: 'Company profile removed successfully', user });
  } catch (err) {
    console.error('Remove Company Profile Error:', err);
    res.status(500).json({ message: 'Failed to remove company profile' });
  }
};

exports.setActiveCompanyProfile = async (req, res) => {
  const { profileId } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Set all profiles to inactive, then set the selected one as active
    user.companyProfiles = user.companyProfiles.map(p => ({
      ...p._doc,
      isActive: p._id.toString() === profileId
    }));
    
    await user.save();

    res.status(200).json({ message: 'Active company profile set successfully', user });
  } catch (err) {
    console.error('Set Active Company Profile Error:', err);
    res.status(500).json({ message: 'Failed to set active company profile' });
  }
};

exports.updateCompanyProfile = async (req, res) => {
  const { 
    profileId, 
    companyName, 
    companyLocation, 
    companyPhone, 
    companyEmail, 
    website,
    twitterX,
    youtube,
    instagram,
    facebook,
    linkedin,
    description,
    industry,
    foundedYear,
    employeeCount,
    logo,
    coverImage
  } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const profileIndex = user.companyProfiles.findIndex(p => p._id.toString() === profileId);
    if (profileIndex === -1) {
      return res.status(404).json({ message: 'Company profile not found' });
    }

    // Update profile details
    user.companyProfiles[profileIndex] = {
      ...user.companyProfiles[profileIndex]._doc,
      companyName: companyName || user.companyProfiles[profileIndex].companyName,
      companyLocation: companyLocation || user.companyProfiles[profileIndex].companyLocation,
      companyPhone: companyPhone || user.companyProfiles[profileIndex].companyPhone,
      companyEmail: companyEmail || user.companyProfiles[profileIndex].companyEmail,
      website: website !== undefined ? website : user.companyProfiles[profileIndex].website,
      twitterX: twitterX !== undefined ? twitterX : user.companyProfiles[profileIndex].twitterX,
      youtube: youtube !== undefined ? youtube : user.companyProfiles[profileIndex].youtube,
      instagram: instagram !== undefined ? instagram : user.companyProfiles[profileIndex].instagram,
      facebook: facebook !== undefined ? facebook : user.companyProfiles[profileIndex].facebook,
      linkedin: linkedin !== undefined ? linkedin : user.companyProfiles[profileIndex].linkedin,
      description: description !== undefined ? description : user.companyProfiles[profileIndex].description,
      industry: industry !== undefined ? industry : user.companyProfiles[profileIndex].industry,
      foundedYear: foundedYear !== undefined ? foundedYear : user.companyProfiles[profileIndex].foundedYear,
      employeeCount: employeeCount !== undefined ? employeeCount : user.companyProfiles[profileIndex].employeeCount,
      logo: logo !== undefined ? logo : user.companyProfiles[profileIndex].logo,
      coverImage: coverImage !== undefined ? coverImage : user.companyProfiles[profileIndex].coverImage,
    };

    await user.save();

    res.status(200).json({ message: 'Company profile updated successfully', user });
  } catch (err) {
    console.error('Update Company Profile Error:', err);
    res.status(500).json({ message: 'Failed to update company profile' });
  }
};


exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Get Current User Error:", error);
    res.status(500).json({ message: "Failed to get user data" });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    await user.save();

    // Return user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    
    res.status(200).json({ 
      message: "Profile updated successfully",
      user: updatedUser 
    });
  } catch (error) {
    console.error("Update User Profile Error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};