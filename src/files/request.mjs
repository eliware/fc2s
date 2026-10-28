import { log } from "../debug.mjs";

export async function request(url) {
  const response = await fetch(url);
  log("HTTP response", {
    url,
    status: response.status,
    headers: Object.fromEntries(response.headers ?? []),
  });
  if (!response.ok) throw new Error(`Download HTTP ${response.status}`);
  return response;
}
