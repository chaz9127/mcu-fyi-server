const path = require('path');
const { execFile } = require('child_process');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Media = require('../models/Media');
const parseMediaSource = require('../utils/parseMediaSource');

const ROOT = path.join(__dirname, '..');
const FETCH_MOVIE_SCRIPT = path.join(ROOT, 'scripts', 'fetch-movie.mjs');
const FETCH_MOVIE_TIMEOUT = 45 * 1000;
const MAX_TITLE_LENGTH = 200;
const MEDIA_FIELDS = [
    'name', 'poster', 'releaseDate', 'description', 'slug', 'duration', 'type', 'season',
    'playLink', 'playLinkIcon', 'trailerLink', 'relatedMedia', 'chronologicalOrder',
];

// Arguments are passed as an array with no shell, so the title can't inject commands.
const runScript = (script, args) => new Promise((resolve) => {
    const options = { cwd: ROOT, timeout: FETCH_MOVIE_TIMEOUT };
    execFile(process.execPath, [script, ...args], options, (error, stdout, stderr) => {
        resolve({ error, stdout: stdout.trim(), stderr: stderr.trim() });
    });
});

const fetchMovie = asyncHandler(async (req, res) => {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';

    if (!title || title.length > MAX_TITLE_LENGTH || title.includes('\0')) {
        return res.status(400).json({ message: 'A valid movie title is required' });
    }

    const { error, stdout, stderr } = await runScript(FETCH_MOVIE_SCRIPT, [title]);

    if (error) {
        if (error.killed) {
            return res.status(504).json({ message: 'The script timed out' });
        }

        // The script lists ambiguous matches as "  id:123  Title (2012)".
        const options = [...stderr.matchAll(/^ +(id:\d+) +(.+)$/gm)]
            .map(([, id, label]) => ({ id, label }));
        if (options.length) {
            return res.status(422).json({ message: 'Multiple movies match that title', options });
        }

        return res.status(422).json({ message: stderr || 'The script failed', options });
    }

    res.json({ output: stdout, warnings: stderr ? stderr.split('\n') : [] });
})

const insertMedia = asyncHandler(async (req, res) => {
    const { source } = req.body;
    if (typeof source !== 'string' || !source.trim()) {
        return res.status(400).json({ message: 'A media object is required' });
    }

    let data;
    try {
        data = parseMediaSource(source);
    } catch (err) {
        return res.status(400).json({ message: `Could not read the media object: ${err.message}` });
    }

    // Mongoose would silently drop these, which would hide typos.
    const unknown = Object.keys(data).filter((field) => !MEDIA_FIELDS.includes(field));
    if (unknown.length) {
        return res.status(400).json({ message: `Unknown fields: ${unknown.join(', ')}` });
    }

    const media = new Media(data);
    const invalid = media.validateSync();
    if (invalid) {
        const message = Object.values(invalid.errors).map((error) => error.message).join(' ');
        return res.status(400).json({ message });
    }

    // The driver is used directly, so that new records keep the same shape and
    // number types as the existing ones (no timestamps or version key).
    const document = media.toObject();
    document.releaseDate = mongoose.mongo.Long.fromNumber(document.releaseDate);
    const { slug, name, chronologicalOrder } = document;
    const collection = Media.collection;

    // In a transaction, so that a failed insert can't leave the order shifted.
    const result = await mongoose.connection.transaction(async (session) => {
        if (await collection.findOne({ slug }, { session })) return { duplicate: true };

        let shifted = 0;
        if (await collection.findOne({ chronologicalOrder }, { session })) {
            const update = await collection.updateMany(
                { chronologicalOrder: { $gte: chronologicalOrder } },
                { $inc: { chronologicalOrder: 1 } },
                { session }
            );
            shifted = update.modifiedCount;
        }
        await collection.insertOne(document, { session });
        return { shifted };
    });

    if (result.duplicate) {
        return res.status(409).json({ message: `Media with the slug "${slug}" already exists` });
    }

    res.status(201).json({ name, chronologicalOrder, shifted: result.shifted });
})

module.exports = {
    fetchMovie,
    insertMedia,
}
