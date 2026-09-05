const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const requireDb = require('../middleware/requireDb');
const validate = require('../middleware/validate');
const { createReviewSchema } = require('../validators/orderValidators');

const router = express.Router();

router.use(requireDb);

router.get('/product/:productId', reviewController.getProductReviews);

router.use(protect);
router.get('/product/:productId/can-review', reviewController.canReviewProduct);
router.post('/product/:productId', validate(createReviewSchema), reviewController.createReview);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
