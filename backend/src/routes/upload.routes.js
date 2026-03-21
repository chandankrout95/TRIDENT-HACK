import express from 'express';
import { upload } from '../config/cloudinary.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/image', protect, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    // req.file.path contains the secure Cloudinary URL provided by multer-storage-cloudinary
    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: req.file.path,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Image upload failed' });
  }
});

export default router;
