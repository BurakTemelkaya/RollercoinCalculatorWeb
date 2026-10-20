import assert from 'node:assert/strict';
import { getLeagueByPower, getLeaguePowerCeilingGh } from '../src/utils/leagueHelper';
import { LEAGUES, type LeagueInfo } from '../src/data/leagues';

const leagues: LeagueInfo[] = [
    { id: 'first', name: 'First', minPower: 0, currencies: [] },
    { id: 'next', name: 'Next', minPower: 615, currencies: [] },
    { id: 'last', name: 'Last', minPower: 1000, currencies: [] },
];
const first = getLeaguePowerCeilingGh(leagues[0], leagues)!;
const next = getLeaguePowerCeilingGh(leagues[1], leagues)!;
assert(first < 615 && first > 614.999999);
assert(next < 1000 && next > 999.999999, 'Next league ceiling must use the following league entry, not its own entry');
assert.equal(getLeaguePowerCeilingGh(leagues[2], leagues), undefined, 'The highest league has no ceiling');
assert.equal(getLeaguePowerCeilingGh(leagues[1], [...leagues].reverse()), next, 'API ordering must not change the ceiling');
assert(Number.isNaN(getLeaguePowerCeilingGh({ ...leagues[0], minPower: NaN }, leagues)));
const titanI = getLeagueByPower({ value: 1.6, unit: 'Zh' });
assert.equal(titanI.name, 'Titan I');
const titanCeiling = getLeaguePowerCeilingGh(titanI, LEAGUES)!;
assert(titanCeiling < 2.16e12 && titanCeiling > 2.159999e12, 'Titan I must stop below 2.16 Zh/s, not the Titan II ceiling at 4 Zh/s');
assert.equal(getLeagueByPower({ value: 1149004754213, unit: 'Gh' }).name, 'Diamond III', 'The supplied league power is below the Titan I entry');
assert.equal(getLeagueByPower({ value: 1277947452824, unit: 'Gh' }).name, 'Titan I', 'Total power must not determine the starting league');
for (const league of LEAGUES) {
    const upperEntry = Math.min(...LEAGUES.filter(l => l.minPower > league.minPower).map(l => l.minPower));
    const ceiling = getLeaguePowerCeilingGh(league, LEAGUES);
    if (upperEntry === Infinity) assert.equal(ceiling, undefined);
    else { assert(ceiling! < upperEntry); assert(ceiling! >= league.minPower); }
}
console.log('Auto placement league ceilings: selected/next league, unsorted API data, all local leagues, strict boundaries and unbounded top tier passed.');
