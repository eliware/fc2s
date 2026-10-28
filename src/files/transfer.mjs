import { writeFile } from "node:fs/promises";
import { log, step } from "../debug.mjs";
import { request } from "./request.mjs";

export async function download(url, file) {
  return step(`download ${url}`, async () => {
    const response = await request(url);
    const data = Buffer.from(await response.arrayBuffer());
    await writeFile(file, data);
    log("downloaded", { file, bytes: data.length });
  });
}
