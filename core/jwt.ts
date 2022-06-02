/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { base64url } from "rfc4648";

const decode: DecodeFn = function decode(token, options = {}) {
  const parts = token.split(".");
  const dec = new TextDecoder();
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const jwt = {} as any;

  if (parts.length != 3) {
    throw new Error();
  }

  if (options.header ?? true) {
    Object.defineProperty(jwt, "header", {
      value: JSON.parse(dec.decode(base64url.parse(parts[0], { loose: true }))),
      enumerable: true,
    });
  }

  if (options.payload ?? true) {
    Object.defineProperty(jwt, "payload", {
      value: JSON.parse(dec.decode(base64url.parse(parts[1], { loose: true }))),
      enumerable: true,
    });
  }

  if (options.signature ?? true) {
    Object.defineProperty(jwt, "signature", {
      value: parts[2],
      enumerable: true,
    });
  }

  return jwt;
};

/* ------------------------------------------------------------------------------- *
 * TypeScript definitions
 * ------------------------------------------------------------------------------- */

interface JwtHeader {
  type: string;
  alg: string;
  kid: string;
}

interface JwtPayload {
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

type Jwt<
  Header extends JwtHeader = JwtHeader,
  Payload extends JwtPayload = JwtPayload,
  Signature extends string = string
> = Pick<
  {
    header: Header;
    payload: Payload;
    signature: Signature;
  },
  | (Header extends JwtHeader ? "header" : never)
  | (Payload extends JwtPayload ? "payload" : never)
  | (Signature extends string ? "signature" : never)
>;

type DecodeOptions = {
  /** @default true */
  header?: boolean;
  /** @default true */
  payload?: boolean;
  /** @default true */
  signature?: boolean;
};

type DecodeFn<
  Header extends JwtHeader = JwtHeader,
  Payload extends JwtPayload = JwtPayload,
  Signature extends string = string,
  Options extends DecodeOptions = DecodeOptions
> = (
  token: string,
  options?: Options
) => Jwt<
  Options extends { header: false } ? never : Header,
  Options extends { payload: false } ? never : Payload,
  Options extends { signature: false } ? never : Signature
>;

export { decode, type Jwt, type JwtHeader, type JwtPayload };
