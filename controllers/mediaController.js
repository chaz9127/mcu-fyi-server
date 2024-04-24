const Media = require('../models/Media');
const asyncHandler = require('express-async-handler');

const getAllMedia = asyncHandler(async (req, res) => {
    const media = await Media.find().sort({ releaseDate: 1}).lean();
    if (!media?.length) {
        return res.status(400).json({message: 'No Media Found'});
    }

    res.json(media)
})

const createNewMEdia = asyncHandler(async (req, res) => {
    
})

const updateUser = asyncHandler(async (req, res) => {
    
})

const deleteUser = asyncHandler(async (req, res) => {
    
})

module.exports = {
    getAllMedia,
}