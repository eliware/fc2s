const enabled = () =>
  process.env.FC2S_VERBOSE === "1" || process.env.DEBUG === "fc2s" || process.env.DEBUG === "*";

export default function log(message, data) {
  if (!enabled()) return;
  const suffix =
    data === undefined ? "" : ` ${typeof data === "string" ? data : JSON.stringify(data)}`;
  console.error(`[fc2s ${new Date().toISOString()}] ${message}${suffix}`);
}
