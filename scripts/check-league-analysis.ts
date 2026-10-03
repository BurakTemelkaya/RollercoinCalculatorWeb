import assert from 'node:assert/strict';
import { LEAGUES, type LeagueInfo } from '../src/data/leagues';
import type { ApiLeagueData } from '../src/types/api';
import { getLeagueByPower } from '../src/utils/leagueHelper';
import { getLeagueAnalysisCeilingGh, getLeagueMiningRate, getNextLeaguePower } from '../src/utils/leagueAnalysis';

const leagues = [...LEAGUES].sort((a, b) => a.minPower - b.minPower);
for (let i = 0; i < leagues.length - 1; i++) {
    const powerGh = getLeagueAnalysisCeilingGh(leagues[i], leagues[i + 1]);
    assert.ok(powerGh >= leagues[i].minPower && powerGh < leagues[i + 1].minPower);
    assert.equal(getLeagueByPower({ value: powerGh, unit: 'Gh' }).id, leagues[i].id);
}

const league: LeagueInfo = { id: 'test', name: 'Test', minPower: 0, currencies: [{ name: 'LTC_SMALL', payout: 100000000, duration: 1200 }] };
const nextLeague = { ...league, id: 'next', minPower: 100 };
assert.equal(getLeagueAnalysisCeilingGh(league, { ...nextLeague, minPower: 650e9 }), 649.9e9);
assert.equal(getLeagueAnalysisCeilingGh(league, { ...nextLeague, minPower: 25e12 }), 24.9e12);
assert.equal(getLeagueAnalysisCeilingGh(league, { ...nextLeague, minPower: 150e6 }), 149e6);
assert.equal(getLeagueAnalysisCeilingGh(league, { ...nextLeague, minPower: 1e15 }), 999.9e12);
assert.equal(getLeagueAnalysisCeilingGh(nextLeague), nextLeague.minPower);

const api: ApiLeagueData = {
    id: 'next', title: 'Next', level: 2, minPower: 100, imageUrl: '', lastUpdatedAt: '',
    currencies: [{ id: 1, name: 'LTC_SMALL', totalPower: 1000, userCount: 10, payoutAmount: 100000000, duration: 600 }],
};
const currentRate = getLeagueMiningRate(league, 'LTC_SMALL', 100, {}, { ...api, currencies: [{ ...api.currencies[0], duration: 1200 }] })!;
const target = currentRate.dailyReward * 100 / currentRate.totalPowerGh;
const nextRate = getLeagueMiningRate(nextLeague, 'LTC_SMALL', 100, {}, api)!;
assert.equal(nextRate.duration, 600); // The next league's own duration takes precedence.
const result = getNextLeaguePower(target, 'LTC', nextLeague, undefined, {}, api);
assert.deepEqual(result, { status: 'available', powerGh: 100, exceedsLeague: false }); // Entry power already earns more.

const matching = getNextLeaguePower(36, 'LTC', nextLeague, { ...nextLeague, minPower: 200 }, {}, api);
assert.deepEqual(matching, { status: 'available', powerGh: 250, exceedsLeague: true });
assert.ok(matching.status === 'available');
assert.equal(nextRate.dailyReward * matching.powerGh / nextRate.totalPowerGh, 36);
assert.equal(getNextLeaguePower(145, 'LTC', nextLeague, undefined, {}, api).status, 'unreachable');
assert.deepEqual(getNextLeaguePower(144, 'LTC', nextLeague, undefined, {}, api), { status: 'available', powerGh: 1000, exceedsLeague: false });
assert.equal(getNextLeaguePower(36, 'BTC', nextLeague, undefined, {}, api).status, 'missingCoin');
assert.equal(getNextLeaguePower(36, 'LTC', nextLeague, undefined, {}).status, 'missingData');
assert.equal(getNextLeaguePower(36, 'LTC', nextLeague, undefined, {}, { ...api, currencies: [{ ...api.currencies[0], totalPower: 0 }] }).status, 'missingData');
assert.equal(getLeagueMiningRate(nextLeague, 'LTC_SMALL', 100, { LTC: 300 })?.duration, 1200);
assert.equal(getLeagueMiningRate({ ...nextLeague, currencies: [{ ...league.currencies[0], duration: undefined }] }, 'LTC_SMALL', 100, { LTC: 300 })?.duration, 300);
console.log('League analysis checks passed: ceilings, league detection, matching earnings, duration, caps, and missing data.');
