const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const feedbackController = require('../controllers/feedbackController');
const verifyJWT = require('../middleware/verifyJWT');
const verifyAdmin = require('../middleware/verifyAdmin');

router.use(verifyJWT, verifyAdmin);

router.route('/fetch-movie').post(adminController.fetchMovie)
router.route('/fetch-series').post(adminController.fetchSeries)
router.route('/media').post(adminController.insertMedia)
router.route('/feedback').get(feedbackController.getAllFeedback)
router.route('/feedback/:id').patch(feedbackController.markFeedbackRead)

module.exports = router;
