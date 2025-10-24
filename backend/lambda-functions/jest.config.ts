/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';
import { createDefaultEsmPreset } from 'ts-jest';

const config: Config = {
    ...createDefaultEsmPreset(),
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
    testMatch: ['**/tests/unit/*.test.ts'],
    moduleNameMapper: {
        '^ft-common-layer(.*)$': '<rootDir>/../layers/ft-common-layer/nodejs/node_modules/ft-common-layer$1',
    },
};

export default config;
