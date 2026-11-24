const HOME_PAGE =
  "https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/NASR_Subscription/";

function parseDates(html) {
  const dates = [];
  for (const match of html.matchAll(/Subscription effective\s+([A-Z][a-z]+ \d{1,2}, \d{4})/g)) {
    const date = new Date(match[1]);
    if (!Number.isNaN(date.valueOf())) dates.push(date.toISOString().slice(0, 10));
  }
  return [...new Set(dates)].sort((a, b) => b.localeCompare(a));
}

export default async function availableDates(url = HOME_PAGE) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`FAA HTTP ${response.status}`);
  return parseDates(await response.text());
}
