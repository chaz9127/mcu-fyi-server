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

const getCurrentUser = asyncHandler(async (req, res) => {
    const email = req.user;
    const user = await User.findOne({email}).select('-password').lean();
    if (!user) {
        return res.status(400).json({message: 'No Users Found'});
    }

    res.json(user)
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

    const createdUser = await User.create(userObject);
    
    if (createdUser) {
        const {email, role, watched} = createdUser;
        res.status(201).json({email, role, watched})
    } else {
        res.status(400).json({message: 'Invalid user data received'});
    }
})

const updateUser = asyncHandler(async (req, res) => {
    // console.log(req.body);
    const { watched, role, email} = req.body;
    // const user = await User.findOne({email}).lean().exec();
    const user = await User.findOneAndUpdate({email}, {watched, role, email}).lean().exec();
    if (user) {
        res.status(201).json(user)
    } else {
        res.status(400).json({message: 'Unable to update user.'});
    }

})

const deleteUser = asyncHandler(async (req, res) => {
    
})

module.exports = {
    getAllUsers,
    getCurrentUser,
    createNewUser,
    updateUser,
    deleteUser,
}