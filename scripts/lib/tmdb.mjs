// Shared by fetch-movie.mjs and fetch-series.mjs.

import 'dotenv/config';

const API = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

const key = process.env.TMDB_API_KEY?.trim();
export const warn = (message) => console.error(`Warning: ${message}`);

export async function tmdb(path, params = {}) {
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

export const slugify = (text) => text
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

// Existing records store midnight US Eastern, which is 04:00 or 05:00 UTC depending on DST.
export function easternMidnight(date) {
  const hour = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' });
  const daylight = Date.parse(`${date}T04:00:00Z`);
  return Number(hour.format(daylight)) === 0 ? daylight : Date.parse(`${date}T05:00:00Z`);
}

export function formatDuration(minutes) {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours && `${hours}h`, rest && `${rest}m`].filter(Boolean).join(' ');
}

export const quote = (text) => `'${JSON.stringify(text).slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'")}'`;

export const posterUrl = (path) => (path ? POSTER_BASE + path : '');

export function warnMissing(label, fields) {
  for (const [field, value] of Object.entries(fields)) {
    if (!value) warn(`${label}: TMDB has no ${field}`);
  }
}

// "Thor (2011)" => { title: 'Thor', year: '2011' }
export function splitYear(input) {
  const [, title, year] = input.match(/^(.+?)\s*\((\d{4})\)$/) ?? [];
  return year ? { title, year } : { title: input };
}

// The admin page reads these lines, see controllers/adminController.js.
export function choiceError(reason, choices) {
  const lines = choices.map(({ id, label }) => `  id:${id}  ${label}`);
  return new Error(`${reason}\n${lines.join('\n')}`);
}

// Runs `fetchOne` for every command line argument and prints the resulting objects.
export async function run(usage, fetchOne) {
  const inputs = process.argv.slice(2).map((arg) => arg.trim()).filter(Boolean);

  if (!inputs.length) {
    console.error(`Usage: ${usage}`);
    process.exitCode = 1;
  } else if (!key) {
    console.error('Missing TMDB_API_KEY. Add it to .env (get one at https://www.themoviedb.org/settings/api).');
    process.exitCode = 1;
  } else {
    const output = [];
    for (const input of inputs) {
      try {
        output.push(await fetchOne(input));
      } catch (error) {
        console.error(`${input}: ${error.message}`);
        process.exitCode = 1;
      }
    }
    if (output.length === 1) console.log(output[0]);
    else if (output.length) console.log(`[\n${output.join(',\n')}\n]`);
  }
}
