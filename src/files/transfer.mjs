import { writeFile } from "node:fs/promises";
import { log, step } from "../debug.mjs";

export async function download(url, file) {
  return step(`download ${url}`, async () => {
    const response = await fetch(url);
    log("HTTP response", {
      url,
      status: response.status,
      headers: Object.fromEntries(response.headers),
    });
    if (!response.ok) throw new Error(`Download HTTP ${response.status}`);
    const data = Buffer.from(await response.arrayBuffer());
    await writeFile(file, data);
    log("downloaded", { file, bytes: data.length });
  });
}
