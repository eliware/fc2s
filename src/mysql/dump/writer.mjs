import { createWriteStream as defaultCreateWriteStream } from "node:fs";
import { pipeline as defaultPipeline } from "node:stream/promises";

export async function writeDump(child, file, deps = {}) {
  const pipeline = deps.pipeline ?? defaultPipeline;
  const createWriteStream = deps.createWriteStream ?? defaultCreateWriteStream;
  await pipeline(child.stdout, createWriteStream(file));
}
