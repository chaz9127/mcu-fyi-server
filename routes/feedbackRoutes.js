const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

router.route('/').post(feedbackController.createFeedback);

module.exports = router;
