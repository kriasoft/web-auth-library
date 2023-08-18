/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

const logOnceKeys = new Set<string>()
type Severity = 'log' | 'warn' | 'error'

export function logOnce(severity: Severity, key: string, message: string) {
  if (!logOnceKeys.has(key)) {
    logOnceKeys.add(key)
    console[severity](message)
  }
}
