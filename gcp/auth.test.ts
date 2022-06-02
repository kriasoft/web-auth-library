/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import env from "../test/env.js";
import { getAuthToken } from "./auth.js";

test("getAuthToken()", async () => {
  const token = await getAuthToken({
    credentials: env.GOOGLE_CLOUD_CREDENTIALS,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  });

  expect(token).toEqual({
    accessToken: expect.any(String),
    expires: expect.any(Number),
    scope: "https://www.googleapis.com/auth/cloud-platform",
    type: "Bearer",
  });

  expect(token.accessToken?.substring(0, 7)).toEqual("ya29.c.");
  expect(token.expires).toBeLessThan(Date.now() / 1000 + 3600);
  expect(token.expires).toBeGreaterThan(Date.now() / 1000);
});
