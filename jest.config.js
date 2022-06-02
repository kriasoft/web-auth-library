/* SPDX-FileCopyrightText: 2020-present Kriasoft */
/* SPDX-License-Identifier: MIT */

/**
 * Jest configuration
 * https://jestjs.io/docs/configuration
 *
 * @type {import("@jest/types").Config.InitialOptions}
 */
export default {
  testPathIgnorePatterns: [
    "<rootDir>/.cache/",
    "<rootDir>/.github/",
    "<rootDir>/.husky/",
    "<rootDir>/.vscode/",
    "<rootDir>/.yarn/",
    "<rootDir>/dist/",
    "<rootDir>/scripts/",
  ],

  moduleFileExtensions: [
    "ts",
    "js",
    "mjs",
    "cjs",
    "jsx",
    "ts",
    "tsx",
    "json",
    "node",
  ],

  modulePathIgnorePatterns: ["<rootDir>/dist/"],

  // transform: {
  //   "\\.ts$": "babel-jest",
  // },

  extensionsToTreatAsEsm: [".ts"],
};
