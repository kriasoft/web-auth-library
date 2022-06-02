/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import {
  decode as decodeCore,
  verify as verifyCore,
  type VerifyOptions,
} from "../core/jwt.js";
export { decode, verify, type JwtHeader, type JwtPayload, type Jwt };

/**
 * Identifies which algorithm is used to generate the signature.
 */
interface JwtHeader {
  /** Token type */
  typ: string;
  /** Message authentication code algorithm */
  alg: string;
  /** Key ID */
  kid: string;
}

/**
 * Contains a set of claims.
 */
interface JwtPayload {
  /** Issuer */
  iss: string;
  /** Subject */
  sub: string;
  /** Audience */
  aud: string;
  /** Authorized party */
  azp: string;
  /** Expiration time */
  exp: number;
  /** Issued at */
  iat: number;

  email: string;
  email_verified: boolean;
}

type Jwt = {
  header: JwtHeader;
  payload: JwtPayload;
  data: string;
  signature: string;
};

const decode = decodeCore as (token: string) => Jwt;
const verify = verifyCore as (
  token: Jwt | string,
  options: VerifyOptions
) => Promise<Jwt | undefined>;
