/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { importPKCS8, importX509, KeyLike } from "jose";
import { FetchError } from "../core/error.js";

const inFlight = new Map<string, Promise<KeyLike>>();
const cache = new Map<string, { key: KeyLike; expires: number }>();

/**
 * Normalizes Google Cloud Platform (GCP) service account credentials.
 */
export function getCredentials(credentials: Credentials | string): Credentials {
  return typeof credentials === "string" || credentials instanceof String
    ? Object.freeze(JSON.parse(credentials as string))
    : Object.isFrozen(credentials)
    ? credentials
    : Object.freeze(credentials);
}

/**
 * Imports a private key from the provided Google Cloud (GCP)
 * service account credentials.
 */
export function getPrivateKey(options: { credentials: Credentials | string }) {
  const credentials = getCredentials(options.credentials);
  return importPKCS8(credentials.private_key, "RS256");
}

/**
 * Imports a public key for the provided Google Cloud (GCP)
 * service account credentials.
 *
 * @throws {FetchError} - If the X.509 certificate could not be fetched.
 */
export async function importPublicKey(options: {
  /**
   * Public key ID (kid).
   */
  keyId: string;
  /**
   * The X.509 certificate URL.
   * @default "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
   */
  certificateURL?: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  waitUntil?: (promise: Promise<any>) => void;
}) {
  const keyId = options.keyId;
  const certificateURL = options.certificateURL ?? "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"; // prettier-ignore
  const cacheKey = `${certificateURL}?key=${keyId}`;
  const value = cache.get(cacheKey);
  const now = Date.now();

  async function fetchKey() {
    // Fetch the public key from Google's servers
    const res = await fetch(certificateURL);

    if (!res.ok) {
      const error = await res
        .json<{ error: { message: string } }>()
        .then((data) => data.error.message)
        .catch(() => undefined);
      throw new FetchError(error ?? "Failed to fetch the public key", {
        response: res,
      });
    }

    const data = await res.json<Record<string, string>>();
    const x509 = data[keyId];

    if (!x509) {
      throw new FetchError(`Public key "${keyId}" not found.`, {
        response: res,
      });
    }

    const key = await importX509(x509, "RS256");

    // Resolve the expiration time of the key
    const maxAge = res.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1]; // prettier-ignore
    const expires = Date.now() + Number(maxAge ?? "3600") * 1000;

    // Update the local cache
    cache.set(cacheKey, { key, expires });
    inFlight.delete(keyId);

    return key;
  }

  // Attempt to read the key from the local cache
  if (value) {
    if (value.expires > now + 10_000) {
      // If the key is about to expire, start a new request in the background
      if (value.expires - now < 600_000) {
        const promise = fetchKey();
        inFlight.set(cacheKey, promise);
        if (options.waitUntil) {
          options.waitUntil(promise);
        }
      }
      return value.key;
    } else {
      cache.delete(cacheKey);
    }
  }

  // Check if there is an in-flight request for the same key ID
  let promise = inFlight.get(cacheKey);

  // If not, start a new request
  if (!promise) {
    promise = fetchKey();
    inFlight.set(cacheKey, promise);
  }

  return await promise;
}

/**
 * Service account credentials for Google Cloud Platform (GCP).
 *
 * @see https://cloud.google.com/iam/docs/creating-managing-service-account-keys
 */
export type Credentials = {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_id: string;
  client_email: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
};
