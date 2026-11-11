/**
 * Session generation counter.
 *
 * Every time a session *begins* (sign-in) or *ends* (logout / credential
 * rejection) the generation is bumped. Any async work that captured an older
 * generation (token refresh, socket reconnect loop, upload, etc.) must discard
 * its result instead of mutating the new session's state.
 *
 * Lives in its own module so both the auth store and the API client can use it
 * without a circular import.
 */
let sessionGeneration = 0;

export function bumpSessionGeneration(): number {
  sessionGeneration += 1;
  return sessionGeneration;
}

export function getCurrentSessionGeneration(): number {
  return sessionGeneration;
}

