import { gzipFile as compressFile } from "./archive/gzip.mjs";
import { tarGz as createTarGz } from "./archive/tar.mjs";

export function gzipFile(input, output) {
  return compressFile(input, output);
}

export function tarGz(output, dir, root, deps) {
  return createTarGz(output, dir, root, deps);
}
