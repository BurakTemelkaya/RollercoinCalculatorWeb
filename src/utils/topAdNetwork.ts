export type TopAdNetwork = 'clever' | 'adsense';

// Clever asked us not to send them traffic from these Canadian provinces.
const CLEVER_BLOCKED_CA_REGIONS = ['Alberta', 'Ontario'];

export function resolveTopAdNetwork(country: string | null, cleverNoFill = false, region: string | null = null): TopAdNetwork | null {
  if (cleverNoFill || country === 'BR') return 'adsense';
  if (country === 'CA' && region && CLEVER_BLOCKED_CA_REGIONS.includes(region)) return 'adsense';
  return country ? 'clever' : null;
}
