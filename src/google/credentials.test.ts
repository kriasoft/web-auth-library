/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import env from "../../test/env.js";
import {
  getCredentials,
  getPrivateKey,
  importPublicKey,
} from "./credentials.js";

test("getPrivateKey({ credentials })", async () => {
  const privateKey = await getPrivateKey({
    credentials: env.GOOGLE_CLOUD_CREDENTIALS,
  });

  expect(privateKey).toEqual(
    expect.objectContaining({
      algorithm: expect.objectContaining({
        hash: { name: "SHA-256" },
        modulusLength: 2048,
        name: "RSASSA-PKCS1-v1_5",
      }),
    })
  );
});

test("importPublicKey({ keyId, certificateURL })", async () => {
  const credentials = getCredentials(env.GOOGLE_CLOUD_CREDENTIALS);
  const privateKey = await importPublicKey({
    keyId: credentials.private_key_id,
    certificateURL: credentials.client_x509_cert_url,
  });

  expect(privateKey).toEqual(
    expect.objectContaining({
      algorithm: expect.objectContaining({
        hash: { name: "SHA-256" },
        modulusLength: 2048,
        name: "RSASSA-PKCS1-v1_5",
      }),
    })
  );
});
