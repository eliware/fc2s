import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import step from "../debug/step.mjs";
import cleanupPartialFile from "./transfer/cleanup.mjs";
import createProgressMeter from "./transfer/progress.mjs";
import request from "./request.mjs";

export default async function download(url, file) {
  return step("download", async () => {
    const response = await request(url);
    try {
      await pipeline(response.body, createProgressMeter(file), createWriteStream(file));
    } catch (error) {
      await cleanupPartialFile(file, error);
      throw error;
    }
  });
}
