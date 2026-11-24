const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// Must run after verifyJWT. The role is read from the database instead of the token,
// so that a role change takes effect without waiting for the token to expire.
const verifyAdmin = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.user }).select('role').lean().exec();

    if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' })
    }

    next();
})

module.exports = verifyAdmin
