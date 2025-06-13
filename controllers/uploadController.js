// controllers/uploadController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-userId-originalname
    const uniqueSuffix = Date.now() + '-' + req.user.id;
    const extension = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${extension}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: fileFilter
});

// Upload logo endpoint
exports.uploadLogo = (req, res) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size should be less than 2MB' });
        }
      }
      return res.status(400).json({ message: err.message || 'Failed to upload logo' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the FULL URL including your base URL
    // Make sure to replace 'your-domain.com' with your actual domain
    const baseUrl = process.env.BASE_URL || 'https://my-v-kard.vercel.app'; // Use your actual base URL
    const logoUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    res.json({ 
      message: 'Logo uploaded successfully',
      logoUrl: logoUrl,
      filename: req.file.filename
    });
  });
};

// Delete logo endpoint (optional - for cleanup)
exports.deleteLogo = (req, res) => {
  const { filename } = req.body;
  
  if (!filename) {
    return res.status(400).json({ message: 'Filename is required' });
  }

  const filePath = path.join(uploadsDir, filename);
  
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
      return res.status(500).json({ message: 'Failed to delete logo' });
    }
    
    res.json({ message: 'Logo deleted successfully' });
  });
};