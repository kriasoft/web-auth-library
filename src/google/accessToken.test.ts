/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { decodeJwt } from 'jose'
import env from '../../test/env.js'
import { getAccessToken } from './accessToken.js'

test('getAccessToken({ credentials, scope })', async () => {
  const accessToken = await getAccessToken({
    credentials: env.GOOGLE_CLOUD_CREDENTIALS,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  })

  expect(accessToken?.substring(0, 30)).toEqual(expect.stringContaining('ya29.c.'))
})

test('getAccessToken({ credentials, audience })', async () => {
  const idToken = await getAccessToken({
    credentials: env.GOOGLE_CLOUD_CREDENTIALS,
    audience: 'https://example.com',
  })

  expect(idToken?.substring(0, 30)).toEqual(expect.stringContaining('eyJhbGciOi'))

  expect(decodeJwt(idToken)).toEqual(
    expect.objectContaining({
      aud: 'https://example.com',
      email_verified: true,
      iss: 'https://accounts.google.com',
    }),
  )
})
