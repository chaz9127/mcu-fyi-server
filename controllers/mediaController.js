const Media = require('../models/Media');
const asyncHandler = require('express-async-handler');

const getAllMedia = asyncHandler(async (req, res) => {
    const media = await Media.find().sort({ releaseDate: 1}).lean();
    if (!media?.length) {
        return res.status(400).json({message: 'No Media Found'});
    }

    res.json(media)
})

const getSingleMedia = asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    const result = await Media.findOne({slug}).exec();
    res.json(result);
})

const getRelatedMedia = asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    const mainTitle = await Media.findOne({slug: slug});
    let results = [];
    if (mainTitle && mainTitle.relatedMedia?.length > 0) {
      results = await Media.find({slug: {$in: mainTitle.relatedMedia}}).exec();
    }
    res.send(results);
})

const createNewMedia = asyncHandler(async (req, res) => {
    
})

const updateUser = asyncHandler(async (req, res) => {
    
})

const deleteUser = asyncHandler(async (req, res) => {
    
})

module.exports = {
    getAllMedia,
    getSingleMedia,
    getRelatedMedia,
}