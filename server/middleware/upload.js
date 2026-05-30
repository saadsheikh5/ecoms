const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/apiError');

const uploadDir = path.join(__dirname, '..', 'uploads');

// Where to store uploaded files and what to name them
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Give each uploaded file a unique name, even when several arrive in one request.
    const ext = path.extname(file.originalname);
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `product-${suffix}${ext}`);
  },
});

// Only allow image files
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError('Only JPEG, PNG, and WebP images are allowed.', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB per file
});

module.exports = upload;
