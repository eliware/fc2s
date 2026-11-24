import { defaultDependencies } from "./dependencies.mjs";
import createProcess from "./selector.mjs";
import processDate from "../process.mjs";

export default createProcess(processDate, defaultDependencies);
