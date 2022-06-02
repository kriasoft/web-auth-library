/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import env from "../test/env.js";
import { getAuthToken, verifyIdToken } from "./auth.js";
import { getCredentials } from "./credentials.js";

const audience = "https://example.com";
const credentials = getCredentials(env.GOOGLE_CLOUD_CREDENTIALS);

test("getAuthToken() => AccessToken", async () => {
  const scope = "https://www.googleapis.com/auth/cloud-platform";
  const token = await getAuthToken({ credentials, scope });

  expect(token).toEqual({
    accessToken: expect.any(String),
    expires: expect.any(Number),
    scope,
    type: "Bearer",
  });

  expect(token.accessToken?.substring(0, 7)).toEqual("ya29.c.");
  expect(token.expires).toBeLessThan(Date.now() / 1000 + 3600);
  expect(token.expires).toBeGreaterThan(Date.now() / 1000);
});

test("getAuthToken() => IdToken", async () => {
  const token = await getAuthToken({ credentials, audience });

  expect(token).toEqual({
    idToken: expect.any(String),
    expires: expect.any(Number),
    audience,
  });

  expect(token.idToken?.substring(0, 7)).toEqual("eyJhbGc");
  expect(token.expires).toBeLessThan(Date.now() / 1000 + 3600);
  expect(token.expires).toBeGreaterThan(Date.now() / 1000);
});

test("verifyIdToken(idToken)", async () => {
  const token = await getAuthToken({ credentials, audience });
  const payload = await verifyIdToken(token.idToken);

  expect(payload).toEqual({
    iss: "https://accounts.google.com",
    aud: audience,
    sub: credentials.client_id,
    azp: credentials.client_email,
    email: credentials.client_email,
    email_verified: true,
    exp: expect.any(Number),
    iat: expect.any(Number),
  });
});

test("verifyIdToken(idToken, { audience })", async () => {
  const token = await getAuthToken({ credentials, audience });
  const payload = await verifyIdToken(token.idToken, { audience });

  expect(payload).toEqual({
    iss: "https://accounts.google.com",
    aud: audience,
    sub: credentials.client_id,
    azp: credentials.client_email,
    email: credentials.client_email,
    email_verified: true,
    exp: expect.any(Number),
    iat: expect.any(Number),
  });

  // Invalid audience -> undefined
  const none = await verifyIdToken(token.idToken, { audience: "n/a" });
  expect(none).toBeUndefined();
});
