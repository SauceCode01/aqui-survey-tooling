import type { LogLevel } from "../api/domain/LogLevel.js";

export type LogFn = (message: unknown[], level: LogLevel) => void;
