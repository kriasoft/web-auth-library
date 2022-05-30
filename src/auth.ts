/* SPDX-FileCopyrightText: 2020-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import QuickLRU from "quick-lru";
import { decodeCredentials, type Credentials } from "./credentials.js";
import { sign } from "./crypto.js";

type Options = {
  credentials: Credentials | string;
  scope: string | string[];
};

type AccessToken = {
  accessToken: string;
  scope: string | string[];
  type: string;
  expires: number;
};

type IdToken = {
  idToken: string;
  audience: string;
  expires: number;
};

type ErrorResponse = {
  error: string;
  error_description: string;
};

const cache = new QuickLRU<symbol, AccessToken | IdToken>({
  maxSize: 100,
  maxAge: 3600000,
});

/**
 * Retrieves an authentication token from OAuth 2.0 authorization server.
 *
 * @example
 *   const token = await getAuthToken({
 *     credentials: env.GOOGLE_CLOUD_CREDENTIALS,
 *     scope: "https://www.googleapis.com/auth/cloud-platform"
 *   );
 *   const headers = { Authorization: `Bearer ${token.accessToken}` };
 *   const res = await fetch(url, { headers });
 */
async function getAuthToken<T extends AccessToken | IdToken = AccessToken>(
  options: Options
): Promise<T> {
  const credentials =
    typeof options.credentials === "string"
      ? decodeCredentials(options.credentials)
      : options.credentials;
  const scope = Array.isArray(options.scope)
    ? options.scope.join(" ")
    : options.scope;
  const cacheKey = Symbol.for(`${credentials.privateKeyId}:${scope}`);
  const issued = Math.floor(Date.now() / 1000);
  let authToken = cache.get(cacheKey) as T | undefined;

  if (!authToken || authToken.expires < issued - 10) {
    const expires = issued + 3600; // Max 1 hour
    const claims = self
      .btoa(
        JSON.stringify({
          iss: credentials.clientEmail,
          aud: credentials.tokenUri,
          exp: expires,
          iat: issued,
          scope,
        })
      )
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const header = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9`; // {"alg":"RS256","typ":"JWT"}
    const payload = `${header}.${claims}`;
    const signature = await sign(credentials, payload);

    const body = new FormData();
    body.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
    body.append("assertion", `${payload}.${signature}`);

    const res = await fetch(credentials.tokenUri, { method: "POST", body });

    if (res.status !== 200) {
      const data = await res.json<ErrorResponse>();
      throw new Error(data.error_description ?? data.error);
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const data = await res.json<any>();
    authToken = data.access_token
      ? ({
          accessToken: data.access_token.replace(/\.+$/, ""),
          type: data.token_type,
          expires,
        } as T)
      : ({
          idToken: data.id_token.replace(/\.+$/, ""),
          audience: scope,
          expires,
        } as T);

    cache.set(cacheKey, authToken);
  }

  return authToken;
}

export { type AccessToken, type IdToken, getAuthToken };
