// backend/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { upload, handleUploadError } = require('../middleware/upload');
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
          path: `/uploads/${req.file.filename}`,
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
  upload.array('images', 5), // Max 5 images
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
        path: `/uploads/${file.filename}`,
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