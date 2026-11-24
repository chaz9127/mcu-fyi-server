// Prints Mongo shell-ready Media objects for movies, using data from TMDB.
//
// Setup: add TMDB_API_KEY=... to .env. Also run by the admin page, see controllers/adminController.js.
//
// Usage:
//   node scripts/fetch-movie.mjs "Iron Man 3"
//   node scripts/fetch-movie.mjs "The Avengers (2012)" "Thor (2011)"
//   node scripts/fetch-movie.mjs id:68721

import {
  choiceError, easternMidnight, formatDuration, posterUrl, quote, run, slugify, splitYear, tmdb, warn, warnMissing,
} from './lib/tmdb.mjs';

const THEATRICAL = 3;

async function findId(input) {
  const id = input.match(/^id:(\d+)$/);
  if (id) return id[1];

  const { title, year } = splitYear(input);
  const params = { query: title, include_adult: 'false' };
  if (year) params.primary_release_year = year;

  const { results } = await tmdb('/search/movie', params);
  if (!results.length) throw new Error('no movies found');

  const exact = results.filter((movie) => slugify(movie.title) === slugify(title));
  const matches = exact.length ? exact : results;
  if (matches.length === 1) return matches[0].id;

  throw choiceError('multiple matches, re-run with a year or one of these ids:', matches.slice(0, 10).map((movie) => ({
    id: movie.id,
    label: `${movie.title} (${movie.release_date?.slice(0, 4) || 'unknown'})`,
  })));
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

function format(movie) {
  const fields = {
    name: movie.title,
    poster: posterUrl(movie.poster_path),
    description: movie.overview ?? '',
    duration: formatDuration(movie.runtime),
  };
  warnMissing(movie.title, fields);

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

await run('node scripts/fetch-movie.mjs "Title" ["Title (year)" | id:<tmdb id>] ...', async (input) => {
  const id = await findId(input);
  return format(await tmdb(`/movie/${id}`, { append_to_response: 'release_dates' }));
});
