import dotenv from "dotenv";

let loaded = false;

export default function loadDotenv(configure = dotenv.config) {
  if (loaded) return;
  configure({ quiet: true });
  loaded = true;
}
