# Authentication Library for the Web Environment

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

Retrieving an access token from the Google's OAuth 2.0 authorization server using
a [service account key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)
(JSON), in [Cloudflare Workers](https://workers.cloudflare.com/) environment:

```ts
import { getAuthToken } from "web-auth-library/gcp";

export default {
  async fetch(req, env) {
    // Get an access token for interacting with Google Cloud Platform APIs.
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
  },
} as ExportedHandler;
```

Where `env.GOOGLE_CLOUD_CREDENTIALS` is an environment variable / secret
containing a [service account key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)
(JSON) obtained from the [Google Cloud Platform](https://cloud.google.com/).

```ts
import { getAuthToken, importKey, sign } from "web-auth-library/gcp";

// Get an ID token for the target resource (audience)
const token = await getAuthToken({
  credentials: env.GOOGLE_CLOUD_CREDENTIALS,
  audience: "https://example.com",
});
// => {
//   idToken: "eyJhbGciOiJSUzI1NiIsImtpZ...",
//   audience: "https://example.com",
//   expires: 1653855236,
// }

// Convert GCP service account key into `CryptoKey` object
const credentials = JSON.parse(env.GOOGLE_CLOUD_CREDENTIALS);
const signingKey = await importKey(credentials.private_key, ["sign"]);

// Generate a digital signature
const signature = await sign(signingKey, "xxx");
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
