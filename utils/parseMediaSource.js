const JSON5 = require('json5');

// Strings and comments are matched first so that their contents are left alone.
const TOKENS = /'(?:\\[\s\S]|[^'\\])*'|"(?:\\[\s\S]|[^"\\])*"|\/\/[^\n]*|\/\*[\s\S]*?\*\/|\b(?:Long|NumberLong|NumberInt|Int32)\(\s*(['"]?)(-?\d+)\1\s*\)/g;

// Parses a Mongo shell object literal, like the output of fetch-movie.mjs, without evaluating it.
const parseMediaSource = (source) => {
    const json5 = source.trim().replace(/;$/, '').replace(TOKENS, (match, quote, number) => number ?? match);
    const parsed = JSON5.parse(json5);

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('expected a single object');
    }

    return parsed;
}

module.exports = parseMediaSource
