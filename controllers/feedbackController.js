const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Feedback = require('../models/Feedback');

const MAX_EMAIL_LENGTH = 254;
const MAX_FEEDBACK_LENGTH = 2000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUSES = ['read', 'unread'];

// Public: anyone can send feedback, so the input is checked here.
const createFeedback = asyncHandler(async (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const feedback = typeof req.body.feedback === 'string' ? req.body.feedback.trim() : '';

    if (email && (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email))) {
        return res.status(400).json({ message: 'Please enter a valid email, or leave it blank' });
    }
    if (!feedback) {
        return res.status(400).json({ message: 'Feedback is required' });
    }
    if (feedback.length > MAX_FEEDBACK_LENGTH) {
        return res.status(400).json({ message: `Feedback must be ${MAX_FEEDBACK_LENGTH} characters or fewer` });
    }

    await Feedback.create({ email, feedback });
    res.status(201).json({ message: 'Thanks for the feedback!' });
})

// Admin: optional ?status=read|unread. Without it, every item is returned.
const getAllFeedback = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const filter = {};

    if (status !== undefined) {
        if (!STATUSES.includes(status)) {
            return res.status(400).json({ message: 'status must be read or unread' });
        }
        filter.status = status;
    }

    const feedback = await Feedback.find(filter).sort({ dateSubmitted: -1 }).lean();
    res.json(feedback);
})

// Admin: marks one item as read.
const markFeedbackRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid feedback id' });
    }

    const updated = await Feedback.findByIdAndUpdate(id, { status: 'read' }, { new: true }).lean();
    if (!updated) {
        return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json(updated);
})

module.exports = {
    createFeedback,
    getAllFeedback,
    markFeedbackRead,
}
