export const HOME_PAGE =
  'https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/NASR_Subscription/';
export const DATA_FILE =
  'https://nfdc.faa.gov/webContent/28DaySub/extra/d_M_Y_CSV.zip';

export function parseDates(html) {
  const dates = [];
  for (const match of html.matchAll(/\b([A-Z][a-z]+ \d{1,2}, \d{4})\b/g)) {
    const date = new Date(match[1]);
    if (!Number.isNaN(date.valueOf())) dates.push(date.toISOString().slice(0, 10));
  }
  return [...new Set(dates)].sort((a, b) => b.localeCompare(a));
}

export function dataUrl(date) {
  const value = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(value.valueOf())) throw new Error('Invalid date');
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(value);
  const formatted = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return DATA_FILE.replace('d_M_Y', `${formatted.day}_${formatted.month}_${formatted.year}`);
}

export async function availableDates(url = HOME_PAGE) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`FAA HTTP ${response.status}`);
  return parseDates(await response.text());
}
