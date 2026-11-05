export type TopAdNetwork = 'clever' | 'coinzilla';

export function resolveTopAdNetwork(country: string | null, cleverNoFill: boolean): TopAdNetwork | null {
  if (cleverNoFill || country === 'BR') return 'coinzilla';
  return country ? 'clever' : null;
}
