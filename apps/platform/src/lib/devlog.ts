/**
 * Gated logger — only emits when DEV_LOGS=true is set in the running environment.
 * Works the same way in dev, staging, and production (Railway: add the var to the
 * service env vars to flip on/off without redeploying).
 *
 * Reads process.env at call time so the toggle is live — no restart needed.
 *
 * Errors should NOT go through this — use console.error directly so they always
 * surface in Railway logs.
 */
function on() {
  return process.env.DEV_LOGS === "true";
}

export const devLog = (...args: unknown[]) => {
  if (on()) console.log(...args);
};

export const devWarn = (...args: unknown[]) => {
  if (on()) console.warn(...args);
};

export const devInfo = (...args: unknown[]) => {
  if (on()) console.info(...args);
};

export const devDebug = (...args: unknown[]) => {
  if (on()) console.debug(...args);
};
