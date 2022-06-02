/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import QuickLRU from "quick-lru";

const cache = new QuickLRU<symbol, Credentials>({ maxSize: 100 });

/**
 * Service account key for Google Cloud Platform (GCP)
 * https://cloud.google.com/iam/docs/creating-managing-service-account-keys
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

export function getCredentials(value: Credentials | string): Credentials {
  if (typeof value === "string") {
    const cacheKey = Symbol.for(value);
    let credentials = cache.get(cacheKey);

    if (!credentials) {
      credentials = JSON.parse(value) as Credentials;
      cache.set(cacheKey, credentials);
    }

    return credentials;
  }

  return value;
}
