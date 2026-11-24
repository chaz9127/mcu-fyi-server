const path = require('path');
const { execFile } = require('child_process');
const asyncHandler = require('express-async-handler');

const ROOT = path.join(__dirname, '..');
const FETCH_MOVIE_SCRIPT = path.join(ROOT, 'scripts', 'fetch-movie.mjs');
const FETCH_MOVIE_TIMEOUT = 45 * 1000;
const MAX_TITLE_LENGTH = 200;

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

module.exports = {
    fetchMovie,
}
