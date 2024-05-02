const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController')

router.route('/')
    .get(mediaController.getAllMedia)

router.route('/:slug').get(mediaController.getSingleMedia)

router.route('/:slug/related').get(mediaController.getRelatedMedia)

module.exports = router; 