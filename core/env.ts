/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

export const canUseDefaultCache =
  typeof self.caches?.default?.put === "function";
