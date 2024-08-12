/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { decodeProtectedHeader, errors, jwtVerify } from "jose";
import { canUseDefaultCache } from "../core/env.js";
import { FetchError } from "../core/error.js";
import { logOnce } from "../core/utils.js";
import { Credentials, getCredentials, importPublicKey } from "./credentials.js";
import { createCustomToken } from "./customToken.js";

/**
 * Creates a User ID token using Google Cloud service account credentials.
 */
export async function getIdToken(options: {
  /**
   * User ID.
   */
  uid: string;
  /**
   * Additional user claims.
   */
  claims?: Record<string, unknown>;
  /**
   * Google Cloud API key.
   * @see https://console.cloud.google.com/apis/credentials
   * @default env.FIREBASE_API_KEY
   */
  apiKey?: string;
  /**
   * Google Cloud project ID.
   * @default env.GOOGLE_CLOUD_PROJECT;
   */
  projectId?: string;
  /**
   * Google Cloud service account credentials.
   * @see https://cloud.google.com/iam/docs/creating-managing-service-account-keys
   * @default env.GOOGLE_CLOUD_PROJECT
   */
  credentials?: Credentials | string;
  /**
   * Alternatively, you can pass credentials via the environment variable.
   */
  env?: {
    /**
     * Google Cloud API key.
     * @see https://console.cloud.google.com/apis/credentials
     */
    FIREBASE_API_KEY: string;
    /**
     * Google Cloud project ID.
     */
    GOOGLE_CLOUD_PROJECT: string;
    /**
     * Google Cloud service account credentials.
     * @see https://cloud.google.com/iam/docs/creating-managing-service-account-keys
     */
    GOOGLE_CLOUD_CREDENTIALS: string;
  };
}) {
  const uid = options?.uid;

  if (!uid) {
    throw new TypeError("Missing uid");
  }

  let apiKey = options?.apiKey;

  if (!apiKey) {
    if (options?.env?.FIREBASE_API_KEY) {
      apiKey = options.env.FIREBASE_API_KEY;
    } else {
      throw new TypeError("Missing apiKey");
    }
  }

  let credentials = options?.credentials;

  if (credentials) {
    credentials = getCredentials(credentials);
  } else {
    if (options?.env?.GOOGLE_CLOUD_CREDENTIALS) {
      credentials = getCredentials(options.env.GOOGLE_CLOUD_CREDENTIALS);
    } else {
      throw new TypeError("Missing credentials");
    }
  }

  let projectId = options?.projectId;

  if (!projectId && options?.env?.GOOGLE_CLOUD_PROJECT) {
    projectId = options.env.GOOGLE_CLOUD_PROJECT;
  }

  if (!projectId) {
    projectId = credentials.project_id;
  }

  if (!projectId) {
    throw new TypeError("Missing projectId");
  }

  const customToken = await createCustomToken({
    ...options.claims,
    credentials,
    audience:
      "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
    uid: options.uid,
  });

  const url = new URL("https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken"); // prettier-ignore
  url.searchParams.set("key", apiKey);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: customToken,
      returnSecureToken: true,
    }),
  });

  if (!res.ok) {
    const message = await res
      .json<{ error: { message: string } }>()
      .then((body) => body?.error?.message)
      .catch(() => undefined);
    throw new FetchError(message ?? "Failed to verify custom token", {
      response: res,
    });
  }

  return await res.json<VerifyCustomTokenResponse>();
}

/**
 * Verifies the authenticity of an ID token issued by Google.
 *
 * @example
 *   const token = await verifyIdToken({
 *     idToken: "eyJhbGciOiJSUzI1NiIsImtpZC...yXQ"
 *     projectId: "my-project"
 *     waitUntil: ctx.waitUntil,
 *   });
 *
 * @example
 *   const token = await verifyIdToken({
 *     idToken: "eyJhbGciOiJSUzI1NiIsImtpZC...yXQ"
 *     waitUntil: ctx.waitUntil,
 *     env: { GOOGLE_CLOUD_PROJECT: "my-project" }
 *   });
 *
 * @see https://firebase.google.com/docs/auth/admin/verify-id-tokens
 *
 * @throws {TypeError} if the ID token is missing
 * @throws {FetchError} if unable to fetch the public key
 * @throws {JWTClaimValidationFailed} if the token is invalid
 * @throws {JWTExpired} if the token has expired
 */
export async function verifyIdToken(options: {
  /**
   * The ID token to verify.
   */
  idToken: string;
  /**
   * Google Cloud project ID. Set to `null` to disable the check.
   * @default env.GOOGLE_CLOUD_PROJECT
   */
  projectId?: string | null;
  /**
   * Alternatively, you can provide the following environment variables:
   */
  env?: {
    /**
     * Google Cloud project ID.
     */
    GOOGLE_CLOUD_PROJECT?: string;
    /**
     * Google Cloud service account credentials.
     * @see https://cloud.google.com/iam/docs/creating-managing-service-account-keys
     */
    GOOGLE_CLOUD_CREDENTIALS?: string;
  };
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  waitUntil?: (promise: Promise<any>) => void;
}): Promise<UserToken> {
  if (!options?.idToken) {
    throw new TypeError(`Missing "idToken"`);
  }

  let projectId = options?.projectId;

  if (projectId === undefined) {
    projectId = options?.env?.GOOGLE_CLOUD_PROJECT;
  }

  if (projectId === undefined && options?.env?.GOOGLE_CLOUD_CREDENTIALS) {
    const credentials = getCredentials(options.env.GOOGLE_CLOUD_CREDENTIALS);
    projectId = credentials?.project_id;
  }

  if (projectId === undefined) {
    throw new TypeError(`Missing "projectId"`);
  }

  if (!options.waitUntil && canUseDefaultCache) {
    logOnce("warn", "verifyIdToken", "verifyIdToken missing `waitUntil` option.");
  }

  // Import the public key from the Google Cloud project
  const header = decodeProtectedHeader(options.idToken);
  const now = Math.floor(Date.now() / 1000);
  const key = await importPublicKey({
    keyId: header.kid as string,
    certificateURL: "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com", // prettier-ignore
    waitUntil: options.waitUntil,
  });

  const { payload } = await jwtVerify(options.idToken, key, {
    audience: projectId == null ? undefined : projectId,
    issuer:
      projectId == null
        ? undefined
        : `https://securetoken.google.com/${projectId}`,
    maxTokenAge: "1h",
  });

  if (!payload.sub) {
    throw new errors.JWTClaimValidationFailed(`Missing "sub" claim`, "sub");
  }

  if (typeof payload.auth_time === "number" && payload.auth_time > now) {
    throw new errors.JWTClaimValidationFailed(
      `Unexpected "auth_time" claim value`,
      "auth_time"
    );
  }

  return payload as UserToken;
}

type VerifyCustomTokenResponse = {
  kind: "identitytoolkit#VerifyCustomTokenResponse";
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  isNewUser: boolean;
};

export interface UserToken {
  /**
   * Always set to https://securetoken.google.com/GOOGLE_CLOUD_PROJECT
   */
  iss: string;

  /**
   * Always set to GOOGLE_CLOUD_PROJECT
   */
  aud: string;

  /**
   * The user's unique ID
   */
  sub: string;

  /**
   * The token issue time, in seconds since epoch
   */
  iat: number;

  /**
   * The token expiry time, normally 'iat' + 3600
   */
  exp: number;

  /**
   * The user's unique ID. Must be equal to 'sub'
   */
  user_id: string;

  /**
   * The time the user authenticated, normally 'iat'
   */
  auth_time: number;

  /**
   * The sign in provider, only set when the provider is 'anonymous'
   */
  provider_id?: "anonymous";

  /**
   * The user's primary email
   */
  email?: string;

  /**
   * The user's email verification status
   */
  email_verified?: boolean;

  /**
   * The user's primary phone number
   */
  phone_number?: string;

  /**
   * The user's display name
   */
  name?: string;

  /**
   * The user's profile photo URL
   */
  picture?: string;

  /**
   * Information on all identities linked to this user
   */
  firebase: {
    /**
     * The primary sign-in provider
     */
    sign_in_provider: SignInProvider;

    /**
     * A map of providers to the user's list of unique identifiers from
     * each provider
     */
    identities?: { [provider in SignInProvider]?: string[] };
  };

  /**
   * Custom claims set by the developer
   */
  [claim: string]: unknown;

  /**
   * @deprecated use `sub` instead
   */
  uid?: never;
}

export type SignInProvider =
  | "custom"
  | "email"
  | "password"
  | "phone"
  | "anonymous"
  | "google.com"
  | "facebook.com"
  | "github.com"
  | "twitter.com"
  | "microsoft.com"
  | "apple.com";
