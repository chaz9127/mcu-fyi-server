const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean();
    if (!users?.length) {
        return res.status(400).json({message: 'No Users Found'});
    }

    res.json(users)
})

const createNewUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({message: 'Email and Password is required'})
    }

    const duplicate = await User.findOne({email}).lean().exec();

    if (duplicate) {
        return res.status(409).json({message: 'Duplicate email'});
    }

    const hashedPwd = await bcrypt.hash(password, 10);
    const userObject = { email, password: hashedPwd }

    const user = await User.create(userObject);

    if (user) {
        res.status(201).json({ message: 'New User Created'})
    } else {
        res.status(400).json({message: 'Invalid user data received'});
    }
})

const updateUser = asyncHandler(async (req, res) => {
    // update watched property
})

const deleteUser = asyncHandler(async (req, res) => {
    
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}