/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { base64, base64url } from "rfc4648";

const algorithm: SubtleCryptoImportKeyAlgorithm = {
  name: "RSASSA-PKCS1-v1_5",
  hash: { name: "SHA-256" },
};

type KeyUsage =
  | "encrypt"
  | "decrypt"
  | "sign"
  | "verify"
  | "deriveKey"
  | "deriveBits"
  | "wrapKey"
  | "unwrapKey";

/**
 * Returns a `CryptoKey` object that you can use in the `Web Crypto API`.
 * https://developer.mozilla.org/docs/Web/API/SubtleCrypto
 *
 * @example
 *   const signingKey = await importKey(
 *     env.GOOGLE_CLOUD_CREDENTIALS.private_key,
 *     ["sign"],
 *   );
 */
function importKey(keyData: string, keyUsages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "pkcs8",
    base64.parse(
      keyData
        .replace("-----BEGIN PRIVATE KEY-----", "")
        .replace("-----END PRIVATE KEY-----", "")
        .replace(/\n/g, "")
    ),
    algorithm,
    false,
    keyUsages
  );
}

/**
 * Generates a digital signature.
 */
async function sign(key: CryptoKey, data: string): Promise<string> {
  const input = new TextEncoder().encode(data);
  const output = await self.crypto.subtle.sign(key.algorithm, key, input);
  return base64url.stringify(new Uint8Array(output), { pad: false });
}

export { sign, importKey, KeyUsage, algorithm };
