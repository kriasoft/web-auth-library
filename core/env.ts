/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

export const canUseDefaultCache =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeof (globalThis as any).caches?.default?.put === "function";
