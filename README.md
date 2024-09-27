# Web Auth Library

[![NPM Version](https://img.shields.io/npm/v/web-auth-library?style=flat-square)](https://www.npmjs.com/package/web-auth-library)
[![NPM Downloads](https://img.shields.io/npm/dm/web-auth-library?style=flat-square)](https://www.npmjs.com/package/web-auth-library)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg?style=flat-square)](http://www.typescriptlang.org/)
[![Donate](https://img.shields.io/badge/dynamic/json?color=%23ff424d&label=Patreon&style=flat-square&query=data.attributes.patron_count&suffix=%20patrons&url=https%3A%2F%2Fwww.patreon.com%2Fapi%2Fcampaigns%2F233228)](http://patreon.com/koistya)
[![Discord](https://img.shields.io/discord/643523529131950086?label=Chat&style=flat-square)](https://discord.gg/bSsv7XM)

Authentication library for Google Cloud, Firebase, and other cloud providers that uses standard [Web Crypto API](https://developer.mozilla.org/docs/Web/API/Web_Crypto_API) and runs in different environments and runtimes, including but not limited to:

- [Bun](https://bun.sh/)
- [Browsers](https://developer.mozilla.org/docs/Web/API/Web_Crypto_API)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Deno](https://deno.land/)
- [Electron](https://www.electronjs.org/)
- [Node.js](https://nodejs.org/)
- [Vercel's Edge Runtime](https://edge-runtime.vercel.app/)

It has minimum dependencies, small bundle size, and optimized for speed and performance.

## Getting Stated

```bash
# Install using NPM
$ npm install web-auth-library --save

# Install using Yarn
$ yarn add web-auth-library
```

## Usage Examples

### Verify the user ID Token issued by Google or Firebase

**NOTE**: The `credentials` argument in the examples below is expected to be a serialized JSON string of a [Google Cloud service account key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys), `apiKey` is Google Cloud API Key (Firebase API Key), and `projectId` is a Google Cloud project ID.

```ts
import { verifyIdToken } from "web-auth-library/google";

const token = await verifyIdToken({
  idToken,
  credentials: env.GOOGLE_CLOUD_CREDENTIALS,
});

// => {
//   iss: 'https://securetoken.google.com/example',
//   aud: 'example',
//   auth_time: 1677525930,
//   user_id: 'temp',
//   sub: 'temp',
//   iat: 1677525930,
//   exp: 1677529530,
//   firebase: {}
// }
```

### Create an access token for accessing [Google Cloud APIs](https://developers.google.com/apis-explorer)

```ts
import { getAccessToken } from "web-auth-library/google";

// Generate a short lived access token from the service account key credentials
const accessToken = await getAccessToken({
  credentials: env.GOOGLE_CLOUD_CREDENTIALS,
  scope: "https://www.googleapis.com/auth/cloud-platform",
});

// Make a request to one of the Google's APIs using that token
const res = await fetch(
  "https://cloudresourcemanager.googleapis.com/v1/projects",
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  }
);
```

## Create a custom ID token using Service Account credentials

```ts
import { getIdToken } from "web-auth-library/google";

const idToken = await getIdToken({
  credentials: env.GOOGLE_CLOUD_CREDENTIALS,
  audience: "https://example.com",
});
```

## An alternative way passing credentials

Instead of passing credentials via `options.credentials` argument, you can also let the library pick up credentials from the list of environment variables using standard names such as `GOOGLE_CLOUD_CREDENTIALS`, `GOOGLE_CLOUD_PROJECT`, `FIREBASE_API_KEY`, for example:

```ts
import { verifyIdToken } from "web-auth-library/google";

const env = { GOOGLE_CLOUD_CREDENTIALS: "..." };
const token = await verifyIdToken({ idToken, env });
```

## Impersonating the service account user

To send emails via the Gmail service provided by Google Cloud, you need to impersonate the service account user. This can be done by passing the `subject` argument to the `getAccessToken` function:

```js
import { getAccessToken } from "web-auth-library/google";

const senderName = "Admin";
const senderEmail = "your-service-account@yoursite.com";
const recipientName = "Lucky User";
const recipientEmail = "luckyuser@example.com";
const subject = "🤘 Hello 🤘";
const text = "This is a message just to say hello.\nSo... <b>Hello!</b>  🤘❤️😎";

const message = createMessage(senderName, senderEmail, recipientName, recipientEmail, subject, text);

const result = await sendEmail(env.GOOGLE_CLOUD_CREDENTIALS, senderEmail, message);
console.log(result);

/**
 * Create a message to be sent via Gmail.
 * Adapted from https://github.com/googleapis/google-api-nodejs-client/blob/main/samples/gmail/send.js
 * @param {string} senderName The `from` name
 * @param {string} senderEmail The `from` email address
 * @param {string} [recipientName] The `to` name
 * @param {string} recipientEmail The `to` email address
 * @param {string} subject The email subject
 * @param {string} text The email body
 */
function createMessage(senderName, senderEmail, recipientName, recipientEmail, subject, text) {
  const utf8Subject = `=?utf-8?B?${base64Encode(subject)}?=`;
  const message = [
    `From: ${senderName} <${senderEmail}>`,
    `To: ${recipientName ? `${recipientName} <${recipientEmail}>` : recipientEmail}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${utf8Subject}`,
    "",
    text,
  ].join("\n");

  const encodedMessage = base64Encode(message)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return encodedMessage;
}

/**
 * Send an email using Gmail.
 * @param {string} credentials The credentials for the service account, as stringified JSON
 * @param {string} senderEmail The `from` email address
 * @param {string} encodedMessage The base64url-encoded email message
 */
async function sendEmail(credentials, senderEmail, encodedMessage) {
  const body = JSON.stringify({
    raw: encodedMessage,
  });

  const accessToken = await getAccessToken({
    credentials,
    scope: "https://www.googleapis.com/auth/gmail.send",
    subject: senderEmail,
  });

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body,
    },
  );
  return response.json();
}

/**
 * Base64 encode a string, without using Node.js's `Buffer`.
 * @link https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
 * @param {string} message
 */
function base64Encode(message) {
  const bytes = new TextEncoder().encode(message);
  const binString = Array.from(bytes, byte =>
    String.fromCodePoint(byte),
  ).join('');
  return btoa(binString);
}
```

## Optimize cache renewal background tasks

Pass the optional `waitUntil(promise)` function provided by the target runtime to optimize the way authentication tokens are being renewed in background. For example, using Cloudflare Workers and [Hono.js](https://hono.dev/):

```ts
import { Hono } from "hono";
import { verifyIdToken } from "web-auth-library/google";

const app = new Hono();

app.get("/", ({ env, executionCtx, json }) => {
  const idToken = await verifyIdToken({
    idToken: "...",
    waitUntil: executionCtx.waitUntil,
    env,
  });

  return json({ ... });
})
```

## Backers 💰

<a href="https://reactstarter.com/b/1"><img src="https://reactstarter.com/b/1.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/2"><img src="https://reactstarter.com/b/2.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/3"><img src="https://reactstarter.com/b/3.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/4"><img src="https://reactstarter.com/b/4.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/5"><img src="https://reactstarter.com/b/5.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/6"><img src="https://reactstarter.com/b/6.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/7"><img src="https://reactstarter.com/b/7.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/8"><img src="https://reactstarter.com/b/8.png" height="60" /></a>

## Related Projects

- [React Starter Kit](https://github.com/kriasoft/react-starter-kit) — front-end template for React and Relay using Jamstack architecture
- [GraphQL API and Relay Starter Kit](https://github.com/kriasoft/graphql-starter) — monorepo template, pre-configured with GraphQL API, React, and Relay
- [Cloudflare Workers Starter Kit](https://github.com/kriasoft/cloudflare-starter-kit) — TypeScript project template for Cloudflare Workers

## How to Contribute

You're very welcome to [create a PR](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
or send me a message on [Discord](https://discord.gg/bSsv7XM).

In order to unit test this library locally you will need [Node.js](https://nodejs.org/) v18+ with [corepack enabled](https://nodejs.org/api/corepack.html), a Google Cloud [service account key](https://cloud.google.com/iam/docs/keys-create-delete) ([here](https://console.cloud.google.com/iam-admin/serviceaccounts)) and Firebase API Key ([here](https://console.cloud.google.com/apis/credentials)) that you can save into the [`test/test.override.env`](./test/test.env) file, for example:

```
GOOGLE_CLOUD_PROJECT=example
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"example",...}
FIREBASE_API_KEY=AIzaSyAZEmdfRWvEYgZpwm6EBLkYJf6ySIMF3Hy
```

Then run unit tests via `yarn test [--watch]`.

## License

Copyright © 2022-present Kriasoft. This source code is licensed under the MIT license found in the
[LICENSE](https://github.com/kriasoft/web-auth-library/blob/main/LICENSE) file.

---

<sup>Made with ♥ by Konstantin Tarkus ([@koistya](https://twitter.com/koistya), [blog](https://medium.com/@koistya))
and [contributors](https://github.com/kriasoft/web-auth-library/graphs/contributors).</sup>
