const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: 'member' },
    watched: [{type: mongoose.Schema.Types.ObjectId}],
    accessToken: { type: String, required: false},
},
{
    timestamps: true
})

module.exports = mongoose.model('User', userSchema);