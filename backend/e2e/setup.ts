import { waitForApi } from "./utils/waitForApi.js";
import { getApiUrl } from "./utils/getApiUrl.js";

const apiUrl = getApiUrl();
await waitForApi(apiUrl, "API", {
  timeout: 30000,
  interval: 1000,
});
