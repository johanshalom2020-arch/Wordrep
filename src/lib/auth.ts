import "server-only";

import { timingSafeEqual } from "node:crypto";
import { hasValidSessionSecret } from "./session";

export type AuthConfiguration = {
  username: string;
  password: string;
};

export function getAuthConfiguration(): AuthConfiguration | null {
  const username = process.env.FOLIO_USERNAME?.trim();
  const password = process.env.FOLIO_PASSWORD;
  if (!username || !password || password.length < 12 || !hasValidSessionSecret()) return null;
  return { username, password };
}

function safeEqual(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  if (actualBytes.length !== expectedBytes.length) {
    timingSafeEqual(expectedBytes, expectedBytes);
    return false;
  }
  return timingSafeEqual(actualBytes, expectedBytes);
}

export function validateCredentials(username: string, password: string): boolean {
  const config = getAuthConfiguration();
  if (!config) return false;
  const usernameValid = safeEqual(username, config.username);
  const passwordValid = safeEqual(password, config.password);
  return usernameValid && passwordValid;
}
