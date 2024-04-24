const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController')

router.route('/')
    .get(mediaController.getAllMedia)

module.exports = router; 