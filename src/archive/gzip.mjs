import { createReadStream, createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";

export async function gzipFile(input, output) {
  try {
    await pipeline(createReadStream(input), createGzip(), createWriteStream(output));
  } catch (error) {
    try {
      await unlink(output);
    } catch {
      /* Keep the compression failure as the cause. */
    }
    throw new Error(`gzip failed for ${input}: ${error.message}`, { cause: error });
  }
}
