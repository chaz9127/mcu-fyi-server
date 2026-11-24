const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    email: { type: String, required: false, default: '' },
    feedback: { type: String, required: true },
    dateSubmitted: { type: Date, required: true, default: Date.now },
    status: { type: String, required: true, enum: ['read', 'unread'], default: 'unread' },
},
{
    timestamps: true
})

module.exports = mongoose.model('Feedback', feedbackSchema);
