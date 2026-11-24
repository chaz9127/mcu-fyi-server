const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyJWT = require('../middleware/verifyJWT');
const verifyAdmin = require('../middleware/verifyAdmin');

router.use(verifyJWT, verifyAdmin);

router.route('/fetch-movie').post(adminController.fetchMovie)
router.route('/media').post(adminController.insertMedia)

module.exports = router;
