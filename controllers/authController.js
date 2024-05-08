const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const loginWithToken = asyncHandler(async (req, res) => {
    const {token} = req.body;
    const foundUser = await User.findOne({ accessToken: token }).exec();
    const { email, role, watched } = foundUser;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, asyncHandler(async (err, decoded) => {
        if (decoded) {
            return res.status(200).json({email, role, watched})
        } else {
            res.status(440).json({message: 'Login has expired'});
        }
    }));
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required'})
    }

    const foundUser = await User.findOne({ email }).exec();

    if (!foundUser) {
        return res.status(401).json({ message: 'Unauthorized'})
    }

    const match = await bcrypt.compare(password, foundUser.password)

    if (!match) {
        return res.status(401).json({ message: 'Unauthorized'})
    }

    const signedToken = jwt.sign(
        {
            "UserInfo": {
                "email": foundUser.email,
                "role": foundUser.role
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '7d' }
    )

    const refreshToken = jwt.sign(
        {"email": foundUser.email},
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    )
    foundUser.accessToken = signedToken;
    await foundUser.save();
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.status(200).json({ accessToken: signedToken, email: foundUser.email, role: foundUser.role, watched: foundUser.watched })
});

const refresh = (req, res) => {
    const cookie = req.headers?.cookie;
    let [key, jwtToken] = cookie.split('=')
    if (!jwtToken) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const refreshToken = jwtToken;

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' })

            const foundUser = await User.findOne({ email: decoded.email })

            if (!foundUser) return res.status(401).json({ message: 'Unauthorized' })

            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "email": foundUser.email,
                        "role": foundUser.role
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '7d' }
            )

            res.status(200).json({ accessToken, email: foundUser.email, role: foundUser.role })
        })
    )
};

const register = asyncHandler(async (req, res) => {
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

    const signedToken = jwt.sign(
        {
            "UserInfo": {
                "email": userObject.email,
                "role": userObject.role
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '7d' }
    )

    const refreshToken = jwt.sign(
        {"email": email},
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    )

    
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    createdUser.accessToken = signedToken;
    await createdUser.save();
    if (createdUser) {
        const {email, role, watched} = createdUser;
        res.status(201).json({ accessToken: signedToken, email, role, watched })
    } else {
        res.status(400).json({message: 'Invalid user data received'});
    }
})

const logout = asyncHandler(async (req, res) => {
    const cookie = req.headers?.cookie;
    let [key, jwtToken] = cookie.split('=')
    if (!jwtToken) return res.sendStatus(204);
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
    res.json({ message: 'Cookie cleared'})
});

module.exports = {
    login,
    loginWithToken,
    register,
    refresh,
    logout,
}