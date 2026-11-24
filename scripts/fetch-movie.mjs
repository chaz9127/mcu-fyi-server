// Prints Mongo shell-ready Media objects for movies, using data from TMDB.
//
// Setup: add TMDB_API_KEY=... to .env. Also run by the admin page, see controllers/adminController.js.
//
// Usage:
//   node scripts/fetch-movie.mjs "Iron Man 3"
//   node scripts/fetch-movie.mjs "The Avengers (2012)" "Thor (2011)"
//   node scripts/fetch-movie.mjs id:68721

import 'dotenv/config';

const API = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const THEATRICAL = 3;

const key = process.env.TMDB_API_KEY?.trim();
const warn = (message) => console.error(`Warning: ${message}`);

async function tmdb(path, params = {}) {
  const url = new URL(API + path);
  url.search = new URLSearchParams({ language: 'en-US', ...params });
  const headers = { accept: 'application/json' };
  // TMDB issues both a short v3 key and a long v4 read access token (a JWT).
  if (key.includes('.')) headers.authorization = `Bearer ${key}`;
  else url.searchParams.set('api_key', key);

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`TMDB returned ${res.status}: ${body.status_message ?? res.statusText}`);
  }
  return res.json();
}

const slugify = (text) => text
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

async function findId(input) {
  const id = input.match(/^id:(\d+)$/);
  if (id) return id[1];

  const withYear = input.match(/^(.+?)\s*\((\d{4})\)$/);
  const title = withYear ? withYear[1] : input;
  const params = { query: title, include_adult: 'false' };
  if (withYear) params.primary_release_year = withYear[2];

  const { results } = await tmdb('/search/movie', params);
  if (!results.length) throw new Error('no movies found');

  const exact = results.filter((movie) => slugify(movie.title) === slugify(title));
  const matches = exact.length ? exact : results;
  if (matches.length === 1) return matches[0].id;

  const options = matches.slice(0, 10)
    .map((movie) => `  id:${movie.id}  ${movie.title} (${movie.release_date?.slice(0, 4) || 'unknown'})`);
  throw new Error(`multiple matches, re-run with a year or one of these ids:\n${options.join('\n')}`);
}

// Existing records store midnight US Eastern, which is 04:00 or 05:00 UTC depending on DST.
function easternMidnight(date) {
  const hour = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' });
  const daylight = Date.parse(`${date}T04:00:00Z`);
  return Number(hour.format(daylight)) === 0 ? daylight : Date.parse(`${date}T05:00:00Z`);
}

function getReleaseDate(movie) {
  const us = movie.release_dates?.results.find((entry) => entry.iso_3166_1 === 'US');
  // The earliest US theatrical date, so that re-releases are ignored.
  const [theatrical] = (us?.release_dates ?? [])
    .filter((release) => release.type === THEATRICAL)
    .map((release) => release.release_date.slice(0, 10))
    .sort();

  if (!theatrical) warn(`${movie.title}: no US theatrical date, using "${movie.release_date || -1}"`);
  const date = theatrical ?? movie.release_date;
  return date ? easternMidnight(date) : -1;
}

function formatDuration(minutes) {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours && `${hours}h`, rest && `${rest}m`].filter(Boolean).join(' ');
}

const quote = (text) => `'${JSON.stringify(text).slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'")}'`;

function format(movie) {
  const fields = {
    name: movie.title,
    poster: movie.poster_path ? POSTER_BASE + movie.poster_path : '',
    description: movie.overview ?? '',
    duration: formatDuration(movie.runtime),
  };
  for (const [field, value] of Object.entries(fields)) {
    if (!value) warn(`${movie.title}: TMDB has no ${field}`);
  }

  return `{
  name: ${quote(fields.name)},
  poster: ${quote(fields.poster)},
  releaseDate: Long('${getReleaseDate(movie)}'),
  description: ${quote(fields.description)},
  slug: ${quote(slugify(movie.title))},
  duration: ${quote(fields.duration)},
  type: 'movie',
  playLink: '',
  trailerLink: '',
  relatedMedia: [],
  chronologicalOrder: NumberInt('-1'),
}`;
}

const inputs = process.argv.slice(2).map((arg) => arg.trim()).filter(Boolean);

if (!inputs.length) {
  console.error('Usage: node scripts/fetch-movie.mjs "Title" ["Title (year)" | id:<tmdb id>] ...');
  process.exitCode = 1;
} else if (!key) {
  console.error('Missing TMDB_API_KEY. Add it to .env (get one at https://www.themoviedb.org/settings/api).');
  process.exitCode = 1;
} else {
  const output = [];
  for (const input of inputs) {
    try {
      const id = await findId(input);
      output.push(format(await tmdb(`/movie/${id}`, { append_to_response: 'release_dates' })));
    } catch (error) {
      console.error(`${input}: ${error.message}`);
      process.exitCode = 1;
    }
  }
  if (output.length === 1) console.log(output[0]);
  else if (output.length) console.log(`[\n${output.join(',\n')}\n]`);
}
