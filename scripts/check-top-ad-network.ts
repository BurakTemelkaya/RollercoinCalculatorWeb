import assert from 'node:assert/strict';
import { resolveTopAdNetwork } from '../src/utils/topAdNetwork';

assert.equal(resolveTopAdNetwork(null), null);
assert.equal(resolveTopAdNetwork('BR'), 'coinzilla');
assert.equal(resolveTopAdNetwork('TR'), 'clever');
assert.equal(resolveTopAdNetwork('UNKNOWN'), 'clever');

console.log('Passed: pending country, Brazil, other countries and UNKNOWN routing.');
