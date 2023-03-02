/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { decodeJwt } from "jose";
import { canUseDefaultCache } from "../core/env.js";
import { FetchError } from "../core/error.js";
import { logOnce } from "../core/utils.js";
import { getCredentials, type Credentials } from "./credentials.js";
import { createCustomToken } from "./customToken.js";

const defaultCache = new Map<string, CacheValue>();

/**
 * Fetches an access token from Google Cloud API using the provided
 * service account credentials.
 *
 * @throws {FetchError} — If the access token could not be fetched.
 */
export async function getAccessToken(options: Options) {
  if (!options?.waitUntil && canUseDefaultCache) {
    logOnce("warn", "verifyIdToken", "Missing `waitUntil` option.");
  }

  let credentials: Credentials;

  // Normalize service account credentials
  // using env.GOOGLE_CLOUD_CREDENTIALS as a fallback
  if (options?.credentials) {
    credentials = getCredentials(options.credentials);
  } else {
    if (!options?.env?.GOOGLE_CLOUD_CREDENTIALS) {
      throw new TypeError("Missing credentials");
    }
    credentials = getCredentials(options.env.GOOGLE_CLOUD_CREDENTIALS);
  }

  // Normalize authentication scope and audience values
  const scope = Array.isArray(options.scope)
    ? options.scope.join(",")
    : options.scope;
  const audience = Array.isArray(options.audience)
    ? options.audience.join(",")
    : options.audience;

  const tokenUrl = credentials.token_uri;

  // Create a cache key that can be used with Cloudflare Cache API
  const cacheKeyUrl = new URL(tokenUrl);
  cacheKeyUrl.searchParams.set("scope", scope ?? "");
  cacheKeyUrl.searchParams.set("aud", audience ?? "");
  cacheKeyUrl.searchParams.set("key", credentials.private_key_id);
  const cacheKey = cacheKeyUrl.toString();

  // Attempt to retrieve the token from the cache
  const cache: Map<string, CacheValue> = options.cache ?? defaultCache;
  const cacheValue = cache.get(cacheKey);
  let now = Math.floor(Date.now() / 1000);

  if (cacheValue) {
    if (cacheValue.created > now - 60 * 60) {
      let token = await cacheValue.promise;

      if (token.expires > now) {
        return token.token;
      } else {
        const nextValue = cache.get(cacheKey);

        if (nextValue && nextValue !== cacheValue) {
          token = await nextValue.promise;
          if (token.expires > now) {
            return token.token;
          } else {
            cache.delete(cacheKey);
          }
        }
      }
    } else {
      cache.delete(cacheKey);
    }
  }

  const promise = (async () => {
    let res: Response | undefined;

    // Attempt to retrieve the token from Cloudflare cache
    // if the code is running in Cloudflare Workers environment
    if (canUseDefaultCache) {
      res = await caches.default.match(cacheKey);
    }

    if (!res) {
      now = Math.floor(Date.now() / 1000);

      // Request a new token from the Google Cloud API
      const jwt = await createCustomToken({
        credentials,
        scope: options.audience ?? options.scope,
      });
      const body = new URLSearchParams();
      body.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
      body.append("assertion", jwt);
      res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!res.ok) {
        const error = await res
          .json<{ error_description?: string }>()
          .then((data) => data?.error_description)
          .catch(() => undefined);
        throw new FetchError(error ?? "Failed to fetch an access token.", {
          response: res,
        });
      }

      if (canUseDefaultCache) {
        let cacheRes = res.clone();
        cacheRes = new Response(cacheRes.body, cacheRes);
        cacheRes.headers.set("Cache-Control", `max-age=3590, public`);
        cacheRes.headers.set("Last-Modified", new Date().toUTCString());
        const cachePromise = caches.default.put(cacheKey, cacheRes);

        if (options.waitUntil) {
          options.waitUntil(cachePromise);
        }
      }
    }

    const data = await res.json<TokenResponse>();

    if ("id_token" in data) {
      const claims = decodeJwt(data.id_token);
      return { token: data.id_token, expires: claims.exp as number };
    }

    const lastModified = res.headers.get("last-modified");
    const expires = lastModified
      ? Math.floor(new Date(lastModified).valueOf() / 1000) + data.expires_in
      : now + data.expires_in;

    return { expires, token: data.access_token };
  })();

  cache.set(cacheKey, { created: now, promise });
  return await promise.then((data) => data.token);
}

// #region Types

type Options = {
  /**
   * Google Cloud service account credentials.
   * @see https://cloud.google.com/iam/docs/creating-managing-service-account-keys
   * @default env.GOOGLE_CLOUD_PROJECT
   */
  credentials: Credentials | string;
  /**
   * Authentication scope(s).
   */
  scope?: string[] | string;
  /**
   * Recipients that the ID token should be issued for.
   */
  audience?: string[] | string;
  env?: {
    /**
     * Google Cloud project ID.
     */
    GOOGLE_CLOUD_PROJECT?: string;
    /**
     * Google Cloud service account credentials.
     * @see https://cloud.google.com/iam/docs/creating-managing-service-account-keys
     */
    GOOGLE_CLOUD_CREDENTIALS: string;
  };
  waitUntil?: <T = unknown>(promise: Promise<T>) => void;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  cache?: Map<string, any>;
};

type TokenResponse =
  | {
      access_token: string;
      expires_in: number;
      token_type: string;
    }
  | {
      id_token: string;
    };

type CacheValue = {
  created: number;
  promise: Promise<{ token: string; expires: number }>;
};

// #endregion
