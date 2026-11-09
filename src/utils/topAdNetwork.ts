export type TopAdNetwork = 'clever' | 'coinzilla';

export function resolveTopAdNetwork(country: string | null, cleverNoFill = false): TopAdNetwork | null {
  if (cleverNoFill || country === 'BR') return 'coinzilla';
  return country ? 'clever' : null;
}
