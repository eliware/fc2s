const DATA_FILE = "https://nfdc.faa.gov/webContent/28DaySub/extra/d_M_Y_CSV.zip";

export default function dataUrl(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Invalid date");
  }
  const value = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(value.valueOf()) || value.toISOString().slice(0, 10) !== date) {
    throw new Error("Invalid date");
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(value);
  const formatted = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return DATA_FILE.replace("d_M_Y", `${formatted.day}_${formatted.month}_${formatted.year}`);
}
