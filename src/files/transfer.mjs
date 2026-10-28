import { createWriteStream } from "node:fs";
import { rm } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { log, step } from "../debug.mjs";
import { request } from "./request.mjs";

export async function download(url, file) {
  return step("download", async () => {
    const response = await request(url);
    let bytes = 0;
    const body = response.body;
    const meter = new TransformStream({
      transform(chunk, controller) {
        bytes += chunk.byteLength;
        controller.enqueue(chunk);
      },
    });
    try {
      await pipeline(body, meter, createWriteStream(file));
    } catch (error) {
      await rm(file, { force: true });
      throw error;
    }
    log("downloaded", { file, bytes });
  });
}
