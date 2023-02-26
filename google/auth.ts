/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import QuickLRU from "quick-lru";
import { Credentials, getCredentials } from "./credentials.js";
import { algorithm, importKey, sign } from "./crypto.js";
import { decode, verify, type JwtPayload } from "./jwt.js";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const cache = new QuickLRU<symbol, any>({
  maxSize: 100,
  maxAge: 3600000 - 10000,
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
async function getAuthToken(options: AccessTokenOptions): Promise<AccessToken>;
async function getAuthToken(options: IdTokenOptions): Promise<IdToken>;
async function getAuthToken(
  options: AccessTokenOptions | IdTokenOptions
): Promise<AccessToken | IdToken> {
  // Normalize input arguments
  const credentials = getCredentials(options.credentials);
  const scope =
    "scope" in options || !("audience" in options)
      ? Array.isArray(options.scope)
        ? options.scope.sort().join(" ")
        : options.scope
      : options.audience;

  // Attempt to retrieve the token from the cache
  const keyId = credentials?.private_key_id ?? credentials.client_email;
  const cacheKey = Symbol.for(`${keyId}:${scope}`);
  let token = cache.get(cacheKey);

  if (!token) {
    token = fetchAuthToken(credentials, scope);
    cache.set(cacheKey, token);
  }

  return token;
}

export async function fetchAuthToken(
  credentials: Credentials,
  scope: string | undefined
): Promise<AccessToken | IdToken> {
  // JWT token header: {"alg":"RS256","typ":"JWT"}
  const header = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9`;

  // JWT token attributes
  const iss = credentials.client_email;
  const aud = credentials.token_uri;
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600; // 1 hour max

  // JWT token payload
  const payload = self
    .btoa(JSON.stringify({ iss, aud, scope, exp, iat }))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  // JWT token signature
  const signingKey = await importKey(credentials.private_key, ["sign"]);
  const signature = await sign(signingKey, `${header}.${payload}`);

  // OAuth 2.0 authorization request
  const body = new URLSearchParams();
  body.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  body.append("assertion", `${header}.${payload}.${signature}`);
  const res = await fetch(credentials.token_uri, { method: "POST", body });

  if (!res.ok) {
    const data = await res.json<AuthError>();
    throw new Error(data.error_description ?? data.error);
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const data = await res.json<any>();
  return data.access_token
    ? ({
        accessToken: data.access_token.replace(/\.+$/, ""),
        type: data.token_type,
        scope,
        expires: exp,
      } as AccessToken)
    : ({
        idToken: data.id_token?.replace(/\.+$/, ""),
        audience: scope,
        expires: exp,
      } as IdToken);
}

async function verifyIdToken(
  idToken: string,
  options?: VerifyIdTokenOptions
): Promise<JwtPayload | undefined> {
  const jwt = decode(idToken);

  const res = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  const data = await res.json<{ keys: JsonWebKey[] }>();

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const jwk = data.keys.find((key) => (key as any).kid === jwt.header.kid);
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk as JsonWebKey,
    algorithm,
    false,
    ["verify"]
  );

  return await verify(jwt, { key, audience: options?.audience });
}

/* ------------------------------------------------------------------------------- *
 * TypeScript definitions
 * ------------------------------------------------------------------------------- */

type AccessTokenOptions = {
  credentials: Credentials | string;
  scope?: string[] | string;
};

type IdTokenOptions = {
  credentials: Credentials | string;
  audience: string;
};

type AccessToken = {
  accessToken: string;
  type: string;
  scope: string;
  expires: number;
};

type IdToken = {
  idToken: string;
  audience: string;
  expires: number;
};

type AuthError = {
  error: string;
  error_description: string;
};

type VerifyIdTokenOptions = {
  audience?: string[] | string;
};

export { type AccessToken, type IdToken, getAuthToken, verifyIdToken };
