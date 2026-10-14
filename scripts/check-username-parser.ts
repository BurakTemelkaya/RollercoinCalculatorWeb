import assert from 'node:assert/strict';
import { parseUsernameInput } from '../src/utils/usernameParser';

const links: [string, string][] = [
    ['https://rollercoin.com/p/BURAK', 'BURAK'],
    ['https://rollercoin.com/p/kb550ilu/games', 'kb550ilu'],
    ['https://rollercoin.com/p/BuRaK/games/extra?ref=123#stats', 'BuRaK'],
    ['http://www.rollercoin.com/p/BURAK/', 'BURAK'],
    ['  https://ROLLERCOIN.COM/p/BURAK?ref=123  ', 'BURAK'],
    ['rollercoin.com/p/kmmt5bp0', 'kmmt5bp0'],
    ['www.rollercoin.com/p/mv7jlx23/games', 'mv7jlx23'],
    ['//rollercoin.com/p/BURAK', 'BURAK'],
    ['/p/l83slilx/games?tab=miners#top', 'l83slilx'],
    ['p/l83slilx', 'l83slilx'],
    ['https://rollercoin.com/p/%42URAK/games', 'BURAK'],
    ['https://rollercoin.com/p/M%C3%BCller', 'Müller'],
    ['[Profile](https://rollercoin.com/p/BURAK/games)', 'BURAK'],
    ['<https://rollercoin.com/p/BURAK>', 'BURAK'],
];
for (const [input, username] of links) {
    assert.deepEqual(parseUsernameInput(input), { username, isProfileLink: true }, input);
    assert.deepEqual(parseUsernameInput(username), { username, isProfileLink: false });
}
for (const name of ['BURAK', 'BuRaK', 'some_name-123', 'Prince Gardener', '3.5']) {
    assert.deepEqual(parseUsernameInput(`  ${name}  `), { username: name, isProfileLink: false });
}
for (const input of [
    '', ' ', 'https://rollercoin.com/p/', 'https://rollercoin.com/p//games',
    'https://rollercoin.com/profile/personal-profile', 'https://example.com/p/BURAK',
    'https://rollercoin.com.evil.test/p/BURAK', 'https://rollercoin.com@evil.test/p/BURAK',
    'https://user:pass@rollercoin.com/p/BURAK', 'ftp://rollercoin.com/p/BURAK',
    'javascript:alert(1)', '/p/', 'p/', 'https://rollercoin.com/p/%ZZ',
    'https://rollercoin.com/p/%2FBURAK', 'https://rollercoin.com/p/%5CBURAK',
    'https://rollercoin.com/p/%00', 'https://rollercoin.com/p/BURAK%0A',
]) assert.equal(parseUsernameInput(input), null, input);
console.log('Passed: profile links, trailing paths/query/hash, log-derived relative links, case preservation, encoded names, plain names and invalid input.');
