/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

/**
 * Jest configuration
 * https://jestjs.io/docs/configuration
 *
 * @type {import("@jest/types").Config.InitialOptions}
 */
export default {
  testEnvironment: 'miniflare',

  testPathIgnorePatterns: ['<rootDir>/.git/', '<rootDir>/.yarn/', '<rootDir>/dist/'],

  moduleFileExtensions: ['ts', 'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json', 'node'],

  modulePathIgnorePatterns: ['<rootDir>/dist/'],

  setupFiles: ['<rootDir>/test/setup.ts'],

  transform: {
    '\\.ts$': 'babel-jest',
  },

  extensionsToTreatAsEsm: ['.ts'],
}
