import { ValueToken } from "@solid-stack/di";
import type { AppEnvironment } from "../index.js";

export class AppConfigToken extends ValueToken<AppEnvironment> {}
