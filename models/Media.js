const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    poster: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, required: false },
    type: { type: String, required: true, enum: ['movie', 'series', 'short', 'special'] },
    season: {
        type: Number,
        required: [function () { return this.type === 'series' }, 'season is required for a series'],
        min: [1, 'season must be 1 or higher'],
        validate: { validator: (season) => season == null || Number.isInteger(season), message: 'season must be a whole number' },
    },
    // Unknown until a title is available, so these can be empty.
    playLink: { type: String, default: '' },
    playLinkIcon: { type: String, required: false },
    trailerLink: { type: String, default: '' },
    slug: { type: String, required: true },
    releaseDate: { type: Number, required: true},
    relatedMedia: [{type: String}],
    chronologicalOrder: {
        type: Number,
        required: true,
        min: [1, 'chronologicalOrder must be 1 or higher'],
        validate: { validator: Number.isInteger, message: 'chronologicalOrder must be a whole number' },
    }
},
{
    timestamps: true
}
)

module.exports = mongoose.model('Media', mediaSchema);