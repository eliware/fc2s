import log from "../debug.mjs";

export default async function request(url) {
  const response = await fetch(url);
  log("HTTP response", {
    status: response.status,
  });
  if (!response.ok) throw new Error(`Download HTTP ${response.status}`);
  return response;
}
