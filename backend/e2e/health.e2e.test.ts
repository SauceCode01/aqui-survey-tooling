import { describe, it, expect } from "vitest";
import { apiClient } from "./utils/apiClient.js";

describe("Health Check E2E Test", () => {
  it("should return healthy status from live running API", async () => {
    const response = await apiClient.get("/health");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("success");
  });
});
