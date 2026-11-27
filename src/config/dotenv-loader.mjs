import dotenv from "dotenv";

export default function loadDotenv(configure = dotenv.config) {
  const processEnv = {};
  const result = configure({ quiet: true, processEnv });
  return result.parsed ?? processEnv;
}
