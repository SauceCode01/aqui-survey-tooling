import "@testing-library/jest-dom/vitest";
import path from "node:path";
import { configure } from "@testing-library/react";
import dotenv from "dotenv";

configure({ asyncUtilTimeout: 5000 });

// Load test variables from .env if present
dotenv.config({
	path: path.resolve(process.cwd(), ".env"),
});
