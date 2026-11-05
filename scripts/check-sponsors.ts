import assert from 'node:assert/strict';
import { sponsorErrors, eligibleSponsors, nextSponsor, safeSponsorUrl } from '../src/utils/sponsorRotation';
import type { Sponsor } from '../src/types/sponsor';
import { DEFAULT_SPONSORS, recordSponsorClick, recordSponsorImpression, recordSponsorVisibleTime, saveSponsorDrafts } from '../src/services/sponsorStore';
const base=DEFAULT_SPONSORS[0];
const make=(id:string,weight:number):Sponsor=>({...base,id,name:'TEST '+id,weight,socials:{...base.socials}});
const now=Date.parse('2026-11-04T12:00:00Z');
assert.equal(sponsorErrors(base).length,0);
assert.equal(eligibleSponsors([],now).length,0);
assert.equal(eligibleSponsors([{...base,active:false}],now).length,0);
assert.equal(eligibleSponsors([{...base,endsAt:new Date(now).toISOString()}],now).length,0);
assert.equal(eligibleSponsors([{...base,startsAt:new Date(now+1).toISOString()}],now).length,0);
assert.equal(eligibleSponsors([{...base,startsAt:new Date(now).toISOString(),endsAt:new Date(now+1).toISOString()}],now).length,1);
assert.ok(sponsorErrors({...base,weight:0}).length);
assert.ok(sponsorErrors({...base,id:'__proto__'}).length);
assert.ok(sponsorErrors({...base,startsAt:'invalid'}).length);
assert.ok(sponsorErrors({...base,startsAt:'2026-11-05',endsAt:'2026-11-04'}).length);
assert.equal(safeSponsorUrl('javascript:alert(1)'),false);
assert.equal(safeSponsorUrl('https://user:secret@example.org'),false);
assert.equal(safeSponsorUrl('https://www.youtube.com/@angarali006'),true);
assert.equal(nextSponsor([], '', {}),null);
assert.equal(nextSponsor([base],base.id,{}),base.id);
const list=[make('test-gold',3),make('test-premium',2),make('test-standard',1)];const scores:Record<string,number>={};const counts:Record<string,number>={};let previous='';
for(let i=0;i<600;i++){const id=nextSponsor(list,previous,scores)!;assert.notEqual(id,previous);counts[id]=(counts[id]??0)+1;previous=id;}
assert.ok(counts['test-gold']>counts['test-premium']);assert.ok(counts['test-premium']>counts['test-standard']);
const hundred=Array.from({length:100},(_,i)=>make('test-'+i,1+(i%3)));previous='';for(let i=0;i<10000;i++){const id=nextSponsor(hundred,previous,scores)!;assert.notEqual(id,previous);previous=id;}
class MemoryStorage { map=new Map<string,string>();getItem(k:string){return this.map.get(k)??null;}setItem(k:string,v:string){this.map.set(k,String(v));}removeItem(k:string){this.map.delete(k);}clear(){this.map.clear();} }
const local=new MemoryStorage(),session=new MemoryStorage();Object.defineProperty(globalThis,'localStorage',{value:local,configurable:true});Object.defineProperty(globalThis,'sessionStorage',{value:session,configurable:true});
assert.equal(saveSponsorDrafts([]),true);assert.equal(local.getItem('angarali.sponsor-drafts.v1'),'[]');assert.throws(()=>saveSponsorDrafts([base,base]));assert.equal(saveSponsorDrafts(list),true);
assert.equal(recordSponsorImpression(base.id,now),true);assert.equal(recordSponsorImpression(base.id,now+1000),false);assert.equal(recordSponsorImpression(base.id,now+1800001),true);
assert.equal(recordSponsorClick(base.id,now),true);assert.equal(recordSponsorClick(base.id,now+500),false);assert.equal(recordSponsorClick(base.id,now+1001),true);recordSponsorVisibleTime(base.id,1250);
const metrics=JSON.parse(local.getItem('angarali.sponsor-local-metrics.v1')!)[base.id];assert.deepEqual(metrics,{impressions:2,clicks:2,visibleMs:1250});
console.log('Sponsor model, dates, disabled/empty lists, safe URLs, 100-sponsor weighted rotation, no adjacent repeats, draft validation and real-event metric deduplication passed');
