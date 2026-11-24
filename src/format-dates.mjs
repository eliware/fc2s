export default function formatDates(dates) {
  return dates
    .map((date, index) => `${date}${index === 0 ? " (preview)" : index === 1 ? " (current)" : ""}`)
    .join("\n");
}
