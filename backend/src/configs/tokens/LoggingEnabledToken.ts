import { ValueToken } from "@solid-stack/di";

export type LoggingEnabled = boolean;
export class LoggingEnabledToken extends ValueToken<LoggingEnabled> {}
