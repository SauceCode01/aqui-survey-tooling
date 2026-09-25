export interface WaitForApiOptions {
  /** Time to wait between retries in milliseconds */
  interval?: number;
  /** Maximum time allowed for a single request to complete in milliseconds */
  timeout?: number;
  /** Maximum number of consecutive failures before throwing an error */
  retries?: number;
  /** Grace period in milliseconds. Failures during this time do not count against the retry limit. */
  startPeriod?: number;
}

export async function waitForApi(
  url: string,
  name: string,
  options: WaitForApiOptions = {},
): Promise<void> {
  const interval = options.interval ?? 1000;
  const timeout = options.timeout ?? 2000;
  const retries = options.retries ?? 30;
  const startPeriod = options.startPeriod ?? 0;

  const startTime = Date.now();
  let failedAttempts = 0;
  let lastError: unknown = null;

  console.log(`[${name}] Starting health check at ${url}...`);

  while (true) {
    try {
      const res = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(timeout),
      }).catch((err) => {
        lastError = err;
        return null;
      });

      if (res !== null) {
        console.log(`[${name}] ✅ Ready and accepting connections!`);
        return;
      }
    } catch (err) {
      lastError = err;
    }

    const elapsed = Date.now() - startTime;
    const errMsg =
      lastError instanceof Error ? lastError.message : String(lastError);
    let statusLog = "";

    if (elapsed < startPeriod) {
      const remainingStart = Math.ceil((startPeriod - elapsed) / 1000);
      statusLog = `(Grace period: ${remainingStart}s remaining)`;
    } else {
      failedAttempts++;
      statusLog = `(Attempt ${failedAttempts}/${retries})`;
    }

    if (failedAttempts >= retries) {
      console.error(
        `[${name}] ❌ Health check failed completely after ${failedAttempts} attempts.`,
      );
      throw new Error(
        `[Connection Timeout]: Could not connect to ${name} at ${url}.\n` +
          `Failed ${failedAttempts} times (after a ${startPeriod}ms start period).\n` +
          `Last error: ${errMsg}\n` +
          `Ensure the server or containers are running and healthy.`,
      );
    }

    console.warn(
      `[${name}] ⏳ Not ready: ${errMsg}. Retrying in ${interval}ms... ${statusLog}`,
    );
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}
