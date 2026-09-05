const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const streamUpload = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'ecommerce-products' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(buffer);
  });

exports.uploadImage = catchAsync(async (req, res, next) => {
  if (!isCloudinaryConfigured) {
    return next(
      new AppError(
        'Image upload is not configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your .env.',
        503
      )
    );
  }
  if (!req.file) return next(new AppError('No image file provided.', 400));

  const result = await streamUpload(req.file.buffer);

  res.status(201).json({
    status: 'success',
    data: { url: result.secure_url, publicId: result.public_id },
  });
});

exports.deleteImage = catchAsync(async (req, res, next) => {
  if (!isCloudinaryConfigured) {
    return next(new AppError('Image upload is not configured yet.', 503));
  }
  await cloudinary.uploader.destroy(req.body.publicId);
  res.status(200).json({ status: 'success', message: 'Image deleted.' });
});
