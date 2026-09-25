// core/tokens/AppEnvToken.ts

import { ValueToken } from "@solid-stack/di";

export type AppEnv = "dev" | "prod" | "test" | "e2e" | "sandbox";
export class AppEnvToken extends ValueToken<AppEnv> {}
