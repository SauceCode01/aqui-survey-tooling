import { DeviceIdentityMiddleware } from "./middlewares/DeviceIdentityMiddleware.js";
import { GlobalErrorHandler } from "./middlewares/GlobalErrorHandler.js";
import { LoggingMiddleware } from "./middlewares/LoggingMiddleware.js";

export const middlewares = [LoggingMiddleware, DeviceIdentityMiddleware];
export const errorHandlers = [GlobalErrorHandler];
