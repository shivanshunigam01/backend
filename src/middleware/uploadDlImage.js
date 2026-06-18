const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype?.startsWith('image/')) {
      cb(new Error('Only image files are allowed for driving licence upload'));
      return;
    }
    cb(null, true);
  },
});

module.exports = upload;
