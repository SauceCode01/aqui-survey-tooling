import path from "node:path";
import {
	IEventConsumer,
	IEventPublisher,
	LoggerTransportsToken,
} from "@solid-stack/agnos";
import { InMemoryEventBus } from "@solid-stack/agnos/batteries";
import { loadExpressPresentation } from "@solid-stack/agnos-express";
import type { Container } from "@solid-stack/di";
import { loadEnvironment } from "@/configs/index.js";
import { AppConfigToken } from "@/configs/tokens/AppConfigToken.js";
import { AppEnvToken } from "@/configs/tokens/AppEnvToken.js";
import { LoggingEnabledToken } from "@/configs/tokens/LoggingEnabledToken.js";
import { LoggerTransportConsole } from "@/infrastructure/LoggerTransportConsole.js";

export const loadCore = async (c: Container) => {
	// load environment
	const environment = loadEnvironment();

	// provide config tokens
	c.provideValue(AppEnvToken, environment.env);
	c.provideValue(AppConfigToken, environment);
	c.provideValue(LoggingEnabledToken, true);

	// provide core dependencies
	c.provideMulti(LoggerTransportsToken, LoggerTransportConsole);
	c.provide(IEventConsumer, InMemoryEventBus);
	c.provide(IEventPublisher, InMemoryEventBus);

	// presentation layer
	switch (environment.px) {
		case "express":
			await loadExpressPresentation(c, {
				port: environment.http.port,
				mainDir: path.resolve(import.meta.dirname, "../pxExpress"),
				featuresDir: path.resolve(import.meta.dirname, "../features"),
			});
			break;
	}
};
