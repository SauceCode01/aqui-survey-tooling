import { describe, it, expect } from "vitest";
import { apiClient } from "./utils/apiClient.js";

describe("Submission Sources E2E Test (Firebase Emulator Integration)", () => {
  it("should create and list submission sources against Firebase Emulator", async () => {
    // 1. Create a submission source
    const createRes = await apiClient.post("/submissionSources/", {
      data: {
        name: "E2E Test Source",
      },
    });
    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    expect(createBody.status).toBe("success");
    expect(createBody.data?.id).toBeDefined();

    const createdId = createBody.data.id;

    // 2. Fetch the created source
    const getRes = await apiClient.get(`/submissionSources/${createdId}`);
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.status).toBe("success");
    const source = getBody.data?.submissionSource || getBody.data;
    expect(source?.id).toBe(createdId);
    expect(source?.name).toBe("E2E Test Source");

    // 3. List all sources and verify inclusion
    const listRes = await apiClient.get("/submissionSources/");
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.status).toBe("success");
    const items = listBody.data?.submissionSources || listBody.data;
    expect(Array.isArray(items)).toBe(true);
    const found = items.find((s: { id: string }) => s.id === createdId);
    expect(found).toBeDefined();
    expect(found.name).toBe("E2E Test Source");
  });
});
