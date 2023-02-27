/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { decodeJwt } from "jose";
import env from "../test/env.js";
import { getIdToken, verifyIdToken } from "./idToken.js";

test("getIdToken({ uid, apiKey, projectId, credentials })", async () => {
  const token = await getIdToken({
    uid: "temp",
    claims: { foo: "bar" },
    apiKey: env.FIREBASE_API_KEY,
    credentials: env.GOOGLE_CLOUD_CREDENTIALS,
  });

  expect(token).toEqual(
    expect.objectContaining({
      kind: "identitytoolkit#VerifyCustomTokenResponse",
      idToken: expect.stringMatching(/^eyJhbGciOiJSUzI1NiIs/),
      refreshToken: expect.any(String),
      expiresIn: "3600",
      isNewUser: expect.any(Boolean),
    })
  );

  expect(decodeJwt(token.idToken)).toEqual(
    expect.objectContaining({
      sub: "temp",
      user_id: "temp",
      aud: env.GOOGLE_CLOUD_PROJECT,
      iss: `https://securetoken.google.com/${env.GOOGLE_CLOUD_PROJECT}`,
      iat: expect.any(Number),
      exp: expect.any(Number),
      auth_time: expect.any(Number),
    })
  );
});

test("verifyIdToken({ idToken })", async () => {
  const { idToken } = await getIdToken({
    uid: "temp",
    apiKey: env.FIREBASE_API_KEY,
    credentials: env.GOOGLE_CLOUD_CREDENTIALS,
  });
  const token = await verifyIdToken({ idToken, env });

  expect(token).toEqual(
    expect.objectContaining({
      aud: env.GOOGLE_CLOUD_PROJECT,
      iss: `https://securetoken.google.com/${env.GOOGLE_CLOUD_PROJECT}`,
      sub: "temp",
      user_id: "temp",
      iat: expect.any(Number),
      exp: expect.any(Number),
    })
  );
});
