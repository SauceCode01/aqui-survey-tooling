import type { Container } from "@solid-stack/di";
import { AppConfigToken } from "@/configs/tokens/AppConfigToken.js";
import { JwtSecret } from "./dependencies/JwtSecret.js";
import { HmacJwtEngine } from "./infrastructure/HmacJwtEngine.js";
import { IJwtEngine } from "./ports/IJwtEngine.js";

export const diProvider = (c: Container): void => {
	const jwtSecret = c.resolve(AppConfigToken).jwt.secret;
	c.provideValue(JwtSecret, jwtSecret);
	c.provide(IJwtEngine, HmacJwtEngine);
};

export default diProvider;
