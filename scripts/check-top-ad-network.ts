import assert from 'node:assert/strict';
import { resolveTopAdNetwork } from '../src/utils/topAdNetwork';

assert.equal(resolveTopAdNetwork(null), null);
assert.equal(resolveTopAdNetwork('BR'), 'coinzilla');
assert.equal(resolveTopAdNetwork('TR'), 'clever');
assert.equal(resolveTopAdNetwork('UNKNOWN'), 'clever');
assert.equal(resolveTopAdNetwork('TR', true), 'coinzilla');
assert.equal(resolveTopAdNetwork(null, true), 'coinzilla');

console.log('Passed: pending country, Brazil, other countries, UNKNOWN and Clever no-fill routing.');
