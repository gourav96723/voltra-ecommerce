const express = require('express');
const uploadController = require('../controllers/uploadController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.post('/', upload.single('image'), uploadController.uploadImage);
router.delete('/', uploadController.deleteImage);

module.exports = router;
