export type TopAdNetwork = 'clever' | 'coinzilla';

export function resolveTopAdNetwork(country: string | null): TopAdNetwork | null {
  if (country === 'BR') return 'coinzilla';
  return country ? 'clever' : null;
}
