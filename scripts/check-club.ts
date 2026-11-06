import assert from 'node:assert/strict';
import { profileErrors, editableProfile, clubAuthReturn, CLUB_MODULES } from '../src/features/club/model';
const value = { username:'player_01',displayName:'Oyuncu',avatarUrl:null,bio:'<script>alert(1)</script>',visibility:'private' as const,version:'v1' };
assert.deepEqual(profileErrors(value),[]); // Rendered as React text, never HTML.
assert.ok(profileErrors({...value,username:'ab'}).length);
assert.ok(profileErrors({...value,avatarUrl:'javascript:alert(1)'}).length);
assert.ok(profileErrors({...value,avatarUrl:'https://user:pass@example.com/a.png'}).length);
assert.ok(profileErrors({...value,bio:'a'.repeat(501)}).length);
const polluted={...value,userId:'other',xp:99999,level:50,roles:['Admin'],badges:['owner']};
const payload=editableProfile(polluted);
assert.deepEqual(Object.keys(payload).sort(),['username','displayName','avatarUrl','bio','visibility','version'].sort());
assert.equal(clubAuthReturn('?returnTo=https://evil.example','tr'),'/tr');
assert.equal(clubAuthReturn('?returnTo=//evil.example','tr'),'/tr');
assert.equal(clubAuthReturn('?returnTo=/tr/v2/club','tr'),'/tr/v2/club');
assert.equal(clubAuthReturn('?returnTo=/en/v2/club','tr'),'/tr');
assert.equal(new Set(CLUB_MODULES.map(m=>m.id)).size,5);
console.log('Club profile validation, privilege-field exclusion, auth redirect allow-list and five module placeholders passed.');
