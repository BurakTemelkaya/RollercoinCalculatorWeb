import assert from 'node:assert/strict';
import { resolveTopAdNetwork } from '../src/utils/topAdNetwork';

assert.equal(resolveTopAdNetwork(null, false), null);
assert.equal(resolveTopAdNetwork('BR', false), 'coinzilla');
assert.equal(resolveTopAdNetwork('TR', false), 'clever');
assert.equal(resolveTopAdNetwork('UNKNOWN', false), 'clever');
assert.equal(resolveTopAdNetwork(null, true), 'coinzilla');

console.log('Passed: pending country, Brazil, other countries, UNKNOWN and Clever no-fill routing.');
