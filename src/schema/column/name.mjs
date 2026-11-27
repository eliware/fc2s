export default function columnName(value) {
  return value.trim().replace(/,+$/, "").trim();
}
