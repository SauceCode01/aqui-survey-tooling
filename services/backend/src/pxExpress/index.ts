import { GlobalErrorHandler } from "./middlewares/GlobalErrorHandler.js";
import { LoggingMiddleware } from "./middlewares/LoggingMiddleware.js";

export const middlewares = [LoggingMiddleware];
export const errorHandlers = [GlobalErrorHandler];
