# Authentication Library for the Web

[![NPM Version](https://img.shields.io/npm/v/web-auth-library?style=flat-square)](https://www.npmjs.com/package/web-auth-library)
[![NPM Downloads](https://img.shields.io/npm/dm/web-auth-library?style=flat-square)](https://www.npmjs.com/package/web-auth-library)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg?style=flat-square)](http://www.typescriptlang.org/)
[![Donate](https://img.shields.io/badge/dynamic/json?color=%23ff424d&label=Patreon&style=flat-square&query=data.attributes.patron_count&suffix=%20patrons&url=https%3A%2F%2Fwww.patreon.com%2Fapi%2Fcampaigns%2F233228)](http://patreon.com/koistya)
[![Discord](https://img.shields.io/discord/643523529131950086?label=Chat&style=flat-square)](https://discord.gg/bSsv7XM)

A collection of utility functions for working with [Web Crypto API](https://developer.mozilla.org/docs/Web/API/Web_Crypto_API).

```bash
# Install using NPM
$ npm install web-auth-library --save

# Install using Yarn
$ yarn add web-auth-library
```

## Usage Example

### Retrieving an access token from Google's OAuth 2.0 authorization server

```ts
import { getAuthToken } from "web-auth-library/google";

const token = await getAuthToken({
  credentials: env.GOOGLE_CLOUD_CREDENTIALS,
  scope: "https://www.googleapis.com/auth/cloud-platform",
});
// => {
//   accessToken: "ya29.c.b0AXv0zTOQVv0...",
//   type: "Bearer",
//   expires: 1653855236,
// }

return fetch("https://cloudresourcemanager.googleapis.com/v1/projects", {
  headers: {
    authorization: `Bearer ${token.accessToken}`,
  },
});
```

Where `env.GOOGLE_CLOUD_CREDENTIALS` is an environment variable / secret
containing a [service account key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)
(JSON) obtained from the [Google Cloud Platform](https://cloud.google.com/).

#### Retrieving an ID token for the target audience

```ts
import { getAuthToken } from "web-auth-library/google";

const token = await getAuthToken({
  credentials: env.GOOGLE_CLOUD_CREDENTIALS,
  audience: "https://example.com",
});
// => {
//   idToken: "eyJhbGciOiJSUzI1NiIsImtpZ...",
//   audience: "https://example.com",
//   expires: 1654199401,
// }
```

#### Decoding an ID token

```ts
import { jwt } from "web-auth-library/google";

jwt.decode(idToken);
// {
//   header: {
//     alg: 'RS256',
//     kid: '38f3883468fc659abb4475f36313d22585c2d7ca',
//     typ: 'JWT'
//   },
//   payload: {
//     iss: 'https://accounts.google.com',
//     sub: '118363561738753879481'
//     aud: 'https://example.com',
//     azp: 'example@example.iam.gserviceaccount.com',
//     email: 'example@example.iam.gserviceaccount.com',
//     email_verified: true,
//     exp: 1654199401,
//     iat: 1654195801,
//   },
//   data: 'eyJhbGciOiJ...',
//   signature: 'MDzBStL...'
// }
```

#### Verifying an ID token

```ts
import { verifyIdToken } from "web-auth-library/google";

const token = await verifyIdToken(idToken, { audience: "https://example.com" });
// => {
//   iss: 'https://accounts.google.com',
//   aud: 'https://example.com',
//   sub: '118363561738753879481'
//   azp: 'example@example.iam.gserviceaccount.com',
//   email: 'example@example.iam.gserviceaccount.com',
//   email_verified: true,
//   exp: 1654199401,
//   iat: 1654195801,
// }
```

#### Generating a digital signature

```ts
import { getCredentials, importKey, sign } from "web-auth-library/google";

const credentials = getCredentials(env.GOOGLE_CLOUD_CREDENTIALS);
const signingKey = await importKey(credentials.private_key, ["sign"]);
const signature = await sign(signingKey, "xxx");
```

#### Decoding a `JWT` token

```ts
import { jwt } from "web-auth-library";

jwt.decode("eyJ0eXAiOiJKV1QiLC...");
// => {
//   header: { alg: "HS256", typ: "JWT" },
//   payload: { iss: "...", aud: "...", iat: ..., exp: ... },
//   signature: "xxx"
// }

jwt.decode("eyJ0eXAiOiJKV1QiLC...", { header: false, signature: false });
// => {
//   payload: { iss: "...", aud: "...", iat: ..., exp: ... },
// }
```

## Backers 💰

<a href="https://reactstarter.com/b/1"><img src="https://reactstarter.com/b/1.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/2"><img src="https://reactstarter.com/b/2.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/3"><img src="https://reactstarter.com/b/3.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/4"><img src="https://reactstarter.com/b/4.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/5"><img src="https://reactstarter.com/b/5.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/6"><img src="https://reactstarter.com/b/6.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/7"><img src="https://reactstarter.com/b/7.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/8"><img src="https://reactstarter.com/b/8.png" height="60" /></a>

## Related Projects

- [Cloudflare Workers Starter Kit](https://github.com/kriasoft/cloudflare-starter-kit) — TypeScript project template for Cloudflare Workers
- [React Starter Kit](https://github.com/kriasoft/react-starter-kit) — front-end template for React and Relay using Jamstack architecture
- [GraphQL API and Relay Starter Kit](https://github.com/kriasoft/graphql-starter) — monorepo template, pre-configured with GraphQL API, React, and Relay

## How to Contribute

You're very welcome to [create a PR](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
or send me a message on [Discord](https://discord.gg/bSsv7XM).

## License

Copyright © 2022-present Kriasoft. This source code is licensed under the MIT license found in the
[LICENSE](https://github.com/kriasoft/web-auth-library/blob/main/LICENSE) file.

---

<sup>Made with ♥ by Konstantin Tarkus ([@koistya](https://twitter.com/koistya), [blog](https://medium.com/@koistya))
and [contributors](https://github.com/kriasoft/web-auth-library/graphs/contributors).</sup>
