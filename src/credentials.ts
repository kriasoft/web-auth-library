/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import QuickLRU from "quick-lru";
// @ts-expect-error https://github.com/swansontec/rfc4648.js/pull/20
import { base64 } from "rfc4648";

const cache = new QuickLRU<symbol, Credentials>({ maxSize: 100 });

interface Credentials {
  clientId: string;
  clientEmail: string;
  privateKey: ArrayBuffer;
  privateKeyId: string;
  tokenUri: string;
}

/**
 * Converts a base64-encoded JSON key string into `Credentials` object.
 */
function decodeCredentials(value: string): Credentials {
  const cacheKey = Symbol.for(value);
  let credentials = cache.get(cacheKey);

  if (!credentials) {
    const {
      client_id,
      client_email,
      private_key,
      private_key_id,
      token_uri,
      ...other
    } = JSON.parse(self.atob(value));

    credentials = {
      ...other,
      clientId: client_id,
      clientEmail: client_email,
      privateKeyId: private_key_id,
      privateKey: base64.parse(
        private_key
          .replace("-----BEGIN PRIVATE KEY-----", "")
          .replace("-----END PRIVATE KEY-----", "")
          .replace(/\n/g, "")
      ),
      tokenUri: token_uri,
    } as Credentials;
    cache.set(cacheKey, credentials);
  }

  return credentials;
}

export { decodeCredentials, type Credentials };
