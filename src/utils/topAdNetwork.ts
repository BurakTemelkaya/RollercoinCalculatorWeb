export type TopAdNetwork = 'clever' | 'adsense';

export function resolveTopAdNetwork(country: string | null, cleverNoFill = false): TopAdNetwork | null {
  if (cleverNoFill || country === 'BR') return 'adsense';
  return country ? 'clever' : null;
}
