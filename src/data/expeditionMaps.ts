export interface ExpeditionMap {
  id: string;
  name: string;
  base?: string;
  scenery?: string;
  tiles?: string;
  difficulty: number;
  durationHours: number;
  active?: boolean;
}

// The PNGs and Tiled JSON layers live in public/expedition/maps/<id>/.
// Missing assets in the supplied archive are intentionally optional.
export const EXPEDITION_MAPS: ExpeditionMap[] = [
  // RollerCoin carousel order; inactive maps remain available at the end.
  { id: 'Plague_City', name: 'Plague City', base: 'layer0.png', scenery: 'layer1.png', tiles: 'road.png', difficulty: 6, durationHours: 20 },
  { id: 'lost_shrime', name: 'Lost Shrine', base: 'layer0.png', scenery: 'layer1.png', tiles: 'roadmap.png', difficulty: 10, durationHours: 30 },
  { id: 'dark_valley', name: 'Dark Valleys', base: 'layer0.png', scenery: 'layer1.png', tiles: 'road.png', difficulty: 7, durationHours: 24 },
  { id: 'Beach_Walk', name: 'Beach Walk', base: 'layer0.png', scenery: 'layer1.png', tiles: 'road.png', difficulty: 8, durationHours: 24 },
  { id: 'Valhalla_Trail', name: 'Valhalla Trail', base: 'layer0.png', scenery: 'layer1.png', tiles: 'road.png', difficulty: 8, durationHours: 18 },
  { id: 'deep_forest', name: 'Deep Forest', base: 'layer0.png', scenery: 'layer1.png', tiles: 'road.png', difficulty: 2, durationHours: 3 },
  { id: 'Tousland', name: 'Tousland', base: 'layer0.png', scenery: 'layer1.png', tiles: 'road.png', difficulty: 4, durationHours: 12, active: false },
];
