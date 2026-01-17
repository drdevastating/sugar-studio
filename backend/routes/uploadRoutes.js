// backend/routes/uploadRoutes.js - UPDATED FOR CLOUDINARY
const express = require('express');
const router = express.Router();
const { upload, handleUploadError } = require('../config/cloudinary');
const { verifyToken, requireStaff } = require('../middleware/auth');

// POST /api/upload - Upload single image (staff only)
router.post(
  '/',
  verifyToken,
  requireStaff,
  upload.single('image'),
  handleUploadError,
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No file uploaded'
        });
      }

      res.json({
        status: 'success',
        message: 'File uploaded successfully',
        data: {
          filename: req.file.filename,
          path: req.file.path, // Cloudinary URL
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to upload file',
        error: error.message
      });
    }
  }
);

// POST /api/upload/multiple - Upload multiple images (staff only)
router.post(
  '/multiple',
  verifyToken,
  requireStaff,
  upload.array('images', 5),
  handleUploadError,
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No files uploaded'
        });
      }

      const files = req.files.map(file => ({
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      }));

      res.json({
        status: 'success',
        message: 'Files uploaded successfully',
        data: {
          files,
          count: files.length
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to upload files',
        error: error.message
      });
    }
  }
);

module.exports = router;