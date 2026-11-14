/**
 * Cookie management is handled server-side only.
 * The backend sets and clears the httpOnly tekrovia_token cookie.
 * These stubs exist so old import sites compile without changes.
 */
export function setAuthCookie(_token: string): void {
  // no-op: server sets the httpOnly cookie via Set-Cookie header
}

export function clearAuthCookie(): void {
  // no-op: server clears the cookie on /auth/logout
}
