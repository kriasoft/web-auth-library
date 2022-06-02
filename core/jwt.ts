/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { base64url } from "rfc4648";

/**
 * Converts the given JSON Web Token string into a `Jwt` object.
 */
function decode<T = JwtPayload, H = JwtHeader>(token: string): Jwt<T, H> {
  const segments = token.split(".");
  const dec = new TextDecoder();

  if (segments.length !== 3) {
    throw new Error();
  }

  return {
    header: JSON.parse(
      dec.decode(base64url.parse(segments[0], { loose: true }))
    ),

    payload: JSON.parse(
      dec.decode(base64url.parse(segments[1], { loose: true }))
    ),

    data: `${segments[0]}.${segments[1]}`,
    signature: segments[2],
  };
}

async function verify<T = JwtPayload, H = JwtHeader>(
  token: Jwt<T, H> | string,
  options: VerifyOptions
): Promise<T | undefined> {
  const enc = new TextEncoder();
  const jwt = typeof token === "string" ? decode<T, H>(token) : token;
  const aud = (jwt.payload as { aud?: string }).aud;

  if (
    options.audience &&
    (!aud ||
      (Array.isArray(options.audience) && !options.audience.includes(aud)) ||
      options.audience !== aud)
  ) {
    return;
  }

  const verified = await crypto.subtle.verify(
    options.key.algorithm,
    options.key,
    base64url.parse(jwt.signature, { loose: true }),
    enc.encode(jwt.data)
  );

  return verified ? jwt.payload : undefined;
}

/* ------------------------------------------------------------------------------- *
 * TypeScript definitions
 * ------------------------------------------------------------------------------- */

/**
 * Identifies which algorithm is used to generate the signature.
 */
interface JwtHeader {
  /** Token type */
  typ?: string;
  /** Content type*/
  cty?: string;
  /** Message authentication code algorithm */
  alg?: string;
  /** Key ID */
  kid?: string;
  /** x.509 Certificate Chain */
  x5c?: string;
  /** x.509 Certificate Chain URL */
  x5u?: string;
  /** Critical */
  crit?: string;
}

/**
 * Contains a set of claims.
 */
interface JwtPayload {
  /** Issuer */
  iss?: string;
  /** Subject */
  sub?: string;
  /** Audience */
  aud?: string;
  /** Authorized party */
  azp?: string;
  /** Expiration time */
  exp?: number;
  /** Not before */
  nbf?: number;
  /** Issued at */
  iat?: number;
  /** JWT ID */
  jti?: string;
}

/**
 * JSON Web Token (JWT)
 */
type Jwt<T = JwtPayload, H = JwtHeader> = {
  header: H;
  payload: T;
  data: string;
  signature: string;
};

type VerifyOptions = {
  key: CryptoKey;
  audience?: string[] | string;
};

export {
  decode,
  verify,
  type Jwt,
  type JwtHeader,
  type JwtPayload,
  type VerifyOptions,
};
