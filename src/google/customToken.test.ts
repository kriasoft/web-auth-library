/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { decodeJwt } from 'jose'
import env from '../../test/env.js'
import { createCustomToken } from './customToken.js'

test('createCustomToken({ credentials, scope })', async () => {
  const customToken = await createCustomToken({
    credentials: env.GOOGLE_CLOUD_CREDENTIALS,
    scope: 'https://www.example.com',
  })

  expect(customToken?.substring(0, 30)).toEqual(expect.stringContaining('eyJhbGciOi'))

  expect(decodeJwt(customToken)).toEqual(
    expect.objectContaining({
      iss: expect.stringMatching(/\.iam\.gserviceaccount\.com$/),
      aud: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.example.com',
      iat: expect.any(Number),
      exp: expect.any(Number),
    }),
  )
})

test('createCustomToken({ credentials, scope: scopes })', async () => {
  const customToken = await createCustomToken({
    credentials: env.GOOGLE_CLOUD_CREDENTIALS,
    scope: ['https://www.example.com', 'https://beta.example.com'],
  })

  expect(customToken?.substring(0, 30)).toEqual(expect.stringContaining('eyJhbGciOi'))

  expect(decodeJwt(customToken)).toEqual(
    expect.objectContaining({
      iss: expect.stringMatching(/\.iam\.gserviceaccount\.com$/),
      aud: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.example.com https://beta.example.com',
      iat: expect.any(Number),
      exp: expect.any(Number),
    }),
  )
})

test('createCustomToken({ env, scope })', async () => {
  const customToken = await createCustomToken({
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    env: { GOOGLE_CLOUD_CREDENTIALS: env.GOOGLE_CLOUD_CREDENTIALS },
  })

  expect(customToken?.substring(0, 30)).toEqual(expect.stringContaining('eyJhbGciOi'))

  expect(decodeJwt(customToken)).toEqual(
    expect.objectContaining({
      iss: expect.stringMatching(/\.iam\.gserviceaccount\.com$/),
      aud: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      iat: expect.any(Number),
      exp: expect.any(Number),
    }),
  )
})

test('createCustomToken({ env, scope })', async () => {
  const promise = createCustomToken({
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  })
  expect(promise).rejects.toThrow(new TypeError('Missing credentials'))
})
