import { useSyncExternalStore } from 'react';
import type { Sponsor, SponsorMetric } from '../types/sponsor';
import { sponsorErrors } from '../utils/sponsorRotation';
const KEY = 'angarali.sponsor-drafts.v1', METRICS = 'angarali.sponsor-local-metrics.v1';
export const DEFAULT_SPONSORS: Sponsor[] = [{ id:'angarali-kral', name:'ANGARALI KRAL', description:'Topluluğumuzun resmî sponsorunu YouTube’da keşfet.', logoUrl:'', url:'https://www.youtube.com/@angarali006', socials:{youtube:'https://www.youtube.com/@angarali006'}, tier:'gold', active:true, startsAt:null, endsAt:null, accent:'#e5bd70', weight:3, order:0 }];
const listeners = new Set<()=>void>(), metricListeners = new Set<()=>void>();
let cachedRaw: string | null | undefined, snapshot: Sponsor[] = DEFAULT_SPONSORS;
let metricsRaw: string | null | undefined, metricsSnapshot: Record<string,SponsorMetric> = {};
const emptyMetrics: Record<string,SponsorMetric> = {};
const serverSponsors = () => DEFAULT_SPONSORS, serverMetrics = () => emptyMetrics;
function read(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function normalize(value: unknown): Sponsor[] {
    if (!Array.isArray(value)) return DEFAULT_SPONSORS;
    const ids = new Set<string>();
    return value.slice(0,500).filter((x): x is Sponsor => {
        try { if (!x || typeof x.active !== 'boolean' || typeof x.socials !== 'object' || !x.socials || sponsorErrors(x).length || ids.has(x.id)) return false; ids.add(x.id); return true; } catch { return false; }
    });
}
function getSponsors() {
    const raw = read(KEY);
    if (raw !== cachedRaw) { cachedRaw = raw; try { snapshot = raw === null ? DEFAULT_SPONSORS : normalize(JSON.parse(raw)); } catch { snapshot = DEFAULT_SPONSORS; } }
    return snapshot;
}
function getMetrics() {
    const raw = read(METRICS);
    if (raw !== metricsRaw) { metricsRaw=raw; try { const parsed=JSON.parse(raw||'{}'); metricsSnapshot={}; for(const [id,v] of Object.entries(parsed)) { const x=v as SponsorMetric; if(x && [x.impressions,x.clicks,x.visibleMs].every(n=>Number.isSafeInteger(n)&&n>=0)) metricsSnapshot[id]=x; } } catch { metricsSnapshot={}; } }
    return metricsSnapshot;
}
function listen(set: Set<()=>void>, key: string, callback: ()=>void) {
    set.add(callback); const onStorage=(event:StorageEvent)=>{if(event.key === key || event.key === null) callback();}; window.addEventListener('storage',onStorage);
    return ()=>{set.delete(callback);window.removeEventListener('storage',onStorage);};
}
export function useSponsors() { return useSyncExternalStore(callback=>listen(listeners,KEY,callback),getSponsors,serverSponsors); }
export function useSponsorMetrics() { return useSyncExternalStore(callback=>listen(metricListeners,METRICS,callback),getMetrics,serverMetrics); }
/** Local administrative preview only; shared publication requires a server-authorized repository. */
export function saveSponsorDrafts(sponsors: Sponsor[]): boolean {
    if (sponsors.length>500 || sponsors.some(s=>sponsorErrors(s).length) || new Set(sponsors.map(s=>s.id)).size !== sponsors.length) throw new Error('Sponsor listesi geçersiz.');
    const raw=JSON.stringify(sponsors); let persistent=true;
    try { localStorage.setItem(KEY,raw); } catch { persistent=false; }
    cachedRaw=read(KEY); snapshot=sponsors; listeners.forEach(fn=>fn()); return persistent;
}
function addMetric(id: string, part: Partial<SponsorMetric>) {
    const stats={...getMetrics()}; const old=stats[id]??{impressions:0,clicks:0,visibleMs:0};
    stats[id]={impressions:old.impressions+(part.impressions||0),clicks:old.clicks+(part.clicks||0),visibleMs:old.visibleMs+(part.visibleMs||0)};
    const raw=JSON.stringify(stats);try{localStorage.setItem(METRICS,raw);}catch{/* Retain session-only counts. */} metricsRaw=read(METRICS);metricsSnapshot=stats;metricListeners.forEach(fn=>fn());
}
const seen = new Set<string>(), lastClicks = new Map<string,number>();
export function recordSponsorImpression(id: string, now=Date.now()) {
    const key='angarali.sponsor-seen.'+id;let last=0;try{last=Number(sessionStorage.getItem(key))||0;}catch{/* Memory fallback. */}
    const bucket=id+':'+Math.floor(now/1800000);
    if((last>0 && now-last<1800000) || seen.has(bucket))return false;
    seen.add(bucket);try{sessionStorage.setItem(key,String(now));}catch{/* Memory fallback. */} addMetric(id,{impressions:1});return true;
}
export function recordSponsorClick(id: string, now=Date.now()) { if(now-(lastClicks.get(id)??0)<1000)return false;lastClicks.set(id,now);addMetric(id,{clicks:1});return true; }
export function recordSponsorVisibleTime(id: string, ms: number) { if(Number.isFinite(ms)&&ms>0)addMetric(id,{visibleMs:Math.round(ms)}); }
