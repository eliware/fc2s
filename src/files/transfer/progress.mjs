import log from "../../debug.mjs";

export default function createProgressMeter(file, writeLog = log) {
  let bytes = 0;
  return new TransformStream({
    transform(chunk, controller) {
      bytes += chunk.byteLength;
      controller.enqueue(chunk);
    },
    flush() {
      writeLog("downloaded", { file, bytes });
    },
  });
}
