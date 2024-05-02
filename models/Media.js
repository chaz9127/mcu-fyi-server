const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    poster: { type: String, required: true },
    description: { type: String, required: true },
    playLink: { type: String, required: true },
    trailerLink: { type: String, required: true },
    slug: { type: String, required: true },
    phase: { type: Number, required: true},
    releaseDate: { type: Number, required: true},
    relatedMedia: [{type: String}],
},
{
    timestamps: true
}
)

module.exports = mongoose.model('Media', mediaSchema);