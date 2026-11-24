const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController')
const verifyJWT = require('../middleware/verifyJWT')
const verifyAdmin = require('../middleware/verifyAdmin')

router.route('/')
    .get(verifyJWT, verifyAdmin, usersController.getAllUsers)
    .post(usersController.createNewUser)
    .patch(verifyJWT, usersController.updateUser)
    .delete(verifyJWT, usersController.deleteUser)

router.route('/currentUser').get(usersController.getCurrentUser)

module.exports = router; 