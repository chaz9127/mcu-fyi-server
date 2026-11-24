// Prints Mongo shell-ready Media objects for single seasons of a series, using data from TMDB.
//
// Setup: add TMDB_API_KEY=... to .env. Also run by the admin page, see controllers/adminController.js.
//
// Usage:
//   node scripts/fetch-series.mjs "Hawkeye"
//   node scripts/fetch-series.mjs "Loki season 2" "What If...? (2021) S1"
//   node scripts/fetch-series.mjs id:84958:2

import {
  choiceError, easternMidnight, formatDuration, posterUrl, quote, run, slugify, splitYear, tmdb, warn, warnMissing,
} from './lib/tmdb.mjs';

// TMDB has "Marvel's Agent Carter", existing records have "Agent Carter".
const cleanName = (name) => name.replace(/^Marvel['’]s /, '');
const yearOf = (date) => date?.slice(0, 4) || 'unknown';

function parseInput(input) {
  const [, id, idSeason] = input.match(/^id:(\d+)(?::(\d+))?$/) ?? [];
  if (id) return { id, season: idSeason && Number(idSeason) };

  const [, rest, season] = input.match(/^(.+?)\s+(?:season\s*|s)(\d+)$/i) ?? [];
  return { ...splitYear(rest ?? input), season: season && Number(season) };
}

async function findId({ id, title, year, season }) {
  if (id) return id;

  const params = { query: title, include_adult: 'false' };
  if (year) params.first_air_date_year = year;

  const { results } = await tmdb('/search/tv', params);
  if (!results.length) throw new Error('no series found');

  const exact = results.filter((show) => slugify(cleanName(show.name)) === slugify(cleanName(title)));
  const matches = exact.length ? exact : results;
  if (matches.length === 1) return matches[0].id;

  throw choiceError('multiple matches, re-run with a year or one of these ids:', matches.slice(0, 10).map((show) => ({
    id: season ? `${show.id}:${season}` : show.id,
    label: `${show.name} (${yearOf(show.first_air_date)})`,
  })));
}

function pickSeason(show, wanted) {
  // Season 0 holds the specials.
  const seasons = show.seasons.filter((season) => season.season_number > 0);
  if (!seasons.length) throw new Error('TMDB has no seasons for this series');

  if (wanted) {
    if (seasons.some((season) => season.season_number === wanted)) return wanted;
    throw new Error(`no season ${wanted}, TMDB has: ${seasons.map((season) => season.season_number).join(', ')}`);
  }
  if (seasons.length === 1) return seasons[0].season_number;

  throw choiceError('multiple seasons, re-run with one of these ids:', seasons.map((season) => ({
    id: `${show.id}:${season.season_number}`,
    label: `${cleanName(show.name)} Season ${season.season_number} (${yearOf(season.air_date)})`,
  })));
}

// The average episode length.
function getRuntime(season) {
  const runtimes = season.episodes.map((episode) => episode.runtime).filter(Boolean);
  return runtimes.length && Math.round(runtimes.reduce((sum, runtime) => sum + runtime, 0) / runtimes.length);
}

function format(show, season) {
  const name = cleanName(show.name);
  const number = season.season_number;
  const label = `${name} season ${number}`;

  const fallback = (field, seasonValue, showValue) => {
    if (!seasonValue && showValue) warn(`${label}: no season ${field}, using the series one`);
    return seasonValue || showValue || '';
  };
  const fields = {
    poster: posterUrl(fallback('poster', season.poster_path, show.poster_path)),
    description: fallback('description', season.overview, show.overview),
    duration: formatDuration(getRuntime(season)),
    'air date': season.air_date,
  };
  warnMissing(label, fields);

  return `{
  name: ${quote(name)},
  poster: ${quote(fields.poster)},
  releaseDate: Long('${season.air_date ? easternMidnight(season.air_date) : -1}'),
  description: ${quote(fields.description)},
  slug: ${quote(`${slugify(name)}-season-${number}`)},
  duration: ${quote(fields.duration)},
  type: 'series',
  season: NumberInt('${number}'),
  playLink: '',
  trailerLink: '',
  relatedMedia: [],
  chronologicalOrder: NumberInt('-1'),
}`;
}

await run('node scripts/fetch-series.mjs "Title" ["Title (year) season 2" | id:<tmdb id>[:<season>]] ...', async (input) => {
  const wanted = parseInput(input);
  const show = await tmdb(`/tv/${await findId(wanted)}`);
  const number = pickSeason(show, wanted.season);
  return format(show, await tmdb(`/tv/${show.id}/season/${number}`));
});
