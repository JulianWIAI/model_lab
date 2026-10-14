/**
 * Wrapper around localStorage that never throws.
 * In private windows or with blocked storage, nothing is remembered,
 * but the lab keeps working.
 */
export class SafeStorage {
  /** @param {string} prefix keeps our keys apart from other sites' data */
  constructor(prefix = 'model-lab:') {
    this.prefix = prefix;
  }

  /** @returns {string|null} the stored value, or fallback if missing or unavailable */
  get(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(this.prefix + key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  set(key, value) {
    try {
      window.localStorage.setItem(this.prefix + key, String(value));
    } catch {
      /* storage unavailable: ignore */
    }
  }
}

/** Shared instance used across the app. */
export const storage = new SafeStorage();
