const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.route('/login').post(authController.login)
router.route('/loginWithToken').post(authController.loginWithToken)
router.route('/register').post(authController.register)
router.route('/refresh').get(authController.refresh)

router.route('/logout').post(authController.logout)

module.exports = router;