import process from "node:process";

export const getApiUrl = (): string => {
  return process.env.API_URL || "http://localhost:3000";
};
