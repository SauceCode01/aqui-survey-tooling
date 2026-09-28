import dotenv from "dotenv";
import path from "path";

// Load test variables exclusively from .env.test for unit & integration tests
dotenv.config({
  path: path.resolve(process.cwd(), ".env.test"),
});
