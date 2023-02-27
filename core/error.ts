/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

export class FetchError extends Error {
  readonly name: string = "FetchError";
  readonly response: Response;

  constructor(
    message: string,
    options: { response: Response; cause?: unknown }
  ) {
    super(message, { cause: options?.cause });
    this.response = options.response;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, Error);
    }
  }
}
