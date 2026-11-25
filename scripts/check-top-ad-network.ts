import assert from 'node:assert/strict';
import { resolveTopAdNetwork } from '../src/utils/topAdNetwork';

assert.equal(resolveTopAdNetwork(null), null);
assert.equal(resolveTopAdNetwork('BR'), 'adsense');
assert.equal(resolveTopAdNetwork('TR'), 'clever');
assert.equal(resolveTopAdNetwork('UNKNOWN'), 'clever');
assert.equal(resolveTopAdNetwork('TR', true), 'adsense');
assert.equal(resolveTopAdNetwork(null, true), 'adsense');
assert.equal(resolveTopAdNetwork('CA', false, 'Ontario'), 'adsense');
assert.equal(resolveTopAdNetwork('CA', false, 'Alberta'), 'adsense');
assert.equal(resolveTopAdNetwork('CA', false, 'Quebec'), 'clever');
assert.equal(resolveTopAdNetwork('CA'), 'clever');

console.log('Passed: pending country, Brazil, Alberta/Ontario, other countries, UNKNOWN and Clever no-fill routing.');
