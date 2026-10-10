/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Standalone test execution runner for Proofline quality checks.
 */

import { runFrontendQualityTests } from '../src/tests/investigation.test';

console.log('--------------------------------------------------');
console.log('Running Proofline Frontend Quality & Security Tests...');
console.log('--------------------------------------------------');

const results = runFrontendQualityTests();

console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);

if (results.failed > 0) {
  console.error('\nTest Failures:');
  results.errors.forEach((err, i) => {
    console.error(`  ${i + 1}. ${err}`);
  });
  process.exit(1);
} else {
  console.log('\nAll Quality & Security Checks Passed Successfully.');
  process.exit(0);
}
