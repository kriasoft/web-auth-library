/* SPDX-FileCopyrightText: 2020-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import QuickLRU from "quick-lru";
/* @ts-expect-error TODO: Fix types resolution for this module */
import { base64url } from "rfc4648";
import { decodeCredentials, type Credentials } from "./credentials.js";

type Options = {
  credentials: Credentials | string;
  keyUsages: Usage[];
};

const algo: CryptoKeyAlgorithmVariant = {
  name: "RSASSA-PKCS1-V1_5",
  hash: { name: "SHA-256" },
};

const cache = new QuickLRU<symbol, CryptoKey>({ maxSize: 100 });

/**
 * Returns a `CryptoKey` object that you can use in the `Web Crypto API`.
 * https://developer.mozilla.org/docs/Web/API/SubtleCrypto
 *
 * @example
 *   const credentials = decodeCredentials(env.GOOGLE_CLOUD_CREDENTIALS);
 *   const signKey = await importKey(credentials, ["sign"]);
 */
async function importKey(options: Options): Promise<CryptoKey> {
  const credentials =
    typeof options.credentials === "string"
      ? decodeCredentials(options.credentials)
      : options.credentials;
  const keyUsages = options.keyUsages;
  const privateKeyId = credentials.privateKeyId ?? credentials.clientEmail;
  const cacheKey = Symbol.for(`${privateKeyId}:${keyUsages.join(",")}`);
  let cryptoKey = cache.get(cacheKey);

  if (!cryptoKey) {
    cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      credentials.privateKey,
      algo,
      false,
      keyUsages
    );

    cache.set(cacheKey, cryptoKey);
  }

  return cryptoKey;
}

async function sign(credentials: Credentials, data: string): Promise<string> {
  const dataArray = new TextEncoder().encode(data);
  const key = await importKey({ credentials, keyUsages: ["sign"] });
  const buff = await self.crypto.subtle.sign(key.algorithm, key, dataArray);
  return base64url.stringify(new Uint8Array(buff), { pad: false });
}

type Usage =
  | "encrypt"
  | "decrypt"
  | "sign"
  | "verify"
  | "deriveKey"
  | "deriveBits"
  | "wrapKey"
  | "unwrapKey";

export { importKey, sign };
