import type { ArtKind, RugKind, Weave } from './textures';

/**
 * The three interiors. Every surface in the home belongs to a named "slot"; a style is just a
 * recipe per slot (colour, sheen, and which procedural texture to paint). Switching style
 * re-skins the same geometry, so walls, furniture positions and sizes never change.
 */

export type StyleId = 'lux' | 'modern' | 'scandi';

export const STYLE_LIST: { id: StyleId; name: string; short: string; blurb: string }[] = [
  { id: 'lux', name: 'Warm Luxury', short: 'Luxury', blurb: 'Marble-look tile, walnut, brass and boucle' },
  { id: 'modern', name: 'Modern', short: 'Modern', blurb: 'Stone grey, matte black and clean lines' },
  { id: 'scandi', name: 'Scandinavian', short: 'Scandi', blurb: 'Pale oak, white linen and soft sage' },
];

export type TexSpec =
  | { gen: 'tile'; n: number; base: string; veins: string[]; grout: string; vein: number; cloud: number; seed: number }
  | { gen: 'slab'; base: string; veins: string[]; vein: number; seed: number }
  | { gen: 'wood'; cols: number; base: string; dark: string; variance: number; gap: number; joints: boolean; seed: number }
  | { gen: 'fabric'; base: string; contrast: number; scale: number; seed: number; weave?: Weave }
  | { gen: 'plaster'; base: string; seed: number }
  | { gen: 'grid'; cols: number; rows: number; base: string; grout: string; variance: number; bond?: boolean; seed: number }
  | { gen: 'rug'; kind: RugKind; pal: string[]; seed: number; aspect: number }
  | { gen: 'art'; kind: ArtKind; pal: string[]; seed: number }
  | { gen: 'granite'; base: string; flecks: string[]; seed: number }
  | { gen: 'print'; base: string; ink: string[]; seed: number; motif: 'butti' | 'jaal' }
  | { gen: 'kalamkari'; seed: number }
  | { gen: 'rangoli'; seed: number };

export type MatSpec = {
  /** flat colour, or a tint over the texture */
  c?: string;
  /** roughness, metalness */
  r?: number;
  m?: number;
  tex?: TexSpec;
  /** metres covered by one repeat of the texture */
  size?: number;
  bump?: number;
  env?: number;
  /** strength of the real-time floor reflection (floor slots only) */
  refl?: number;
  opacity?: number;
  /** emissive colour (driven by the time of day) */
  e?: string;
};

export type SlotKind = 'std' | 'floor' | 'glass' | 'sheer' | 'unit' | 'emit' | 'mirror';
export type SlotFlags = { kind?: SlotKind; cast?: boolean; recv?: boolean; double?: boolean; hideInMirror?: boolean };

/** how each slot behaves, independent of style */
export const SLOT_FLAGS: Record<string, SlotFlags> = {
  floorMain: { kind: 'floor', cast: false, hideInMirror: true },
  floorMaster: { kind: 'floor', cast: false, hideInMirror: true },
  floorBath: { cast: false, hideInMirror: true },
  floorDeck: { cast: false, hideInMirror: true },
  floorHall: { cast: false, hideInMirror: true },
  slabEdge: { hideInMirror: true },
  glass: { kind: 'glass', cast: false, recv: false },
  sheer: { kind: 'sheer', cast: false, double: true },
  mirror: { kind: 'mirror', cast: false },
  rugA: { kind: 'unit', cast: false }, rugB: { kind: 'unit', cast: false }, rugC: { kind: 'unit', cast: false }, rugR: { kind: 'unit', cast: false },
  art: { kind: 'unit', cast: false },
  bulb: { kind: 'emit', cast: false, recv: false },
  shade: { kind: 'emit', cast: false, double: true },
  downlight: { kind: 'emit', cast: false, recv: false },
  cove: { kind: 'emit', cast: false, recv: false },
  diya: { kind: 'emit', cast: false, recv: false },
  screen: { cast: false },
  leaf: { double: true }, leaf2: { double: true },
  curtain: { double: true },
  kalamkari: { kind: 'unit', cast: false },
  rangoli: { kind: 'glass', cast: false, recv: true, hideInMirror: true },
  water: { cast: false },
  marigold: { cast: false },
  flame: { kind: 'emit', cast: false, recv: false },
  acLed: { kind: 'emit', cast: false, recv: false },
};

const wood = (base: string, dark: string, seed: number, cols = 1, variance = 0.25): TexSpec =>
  ({ gen: 'wood', cols, base, dark, variance, gap: 0, joints: false, seed });
const cloth = (base: string, seed: number, contrast = 9, scale = 2, weave: Weave = 'plain'): TexSpec => ({ gen: 'fabric', base, contrast, scale, seed, weave });

/** slots that look the same whatever the style */
const COMMON: Record<string, MatSpec> = {
  ceiling: { c: '#f7f4ee', r: 0.96 },
  upvc: { c: '#f5f5f3', r: 0.42 },
  ceramic: { c: '#f8f7f3', r: 0.1, env: 1.2 },
  chrome: { c: '#e2e5e8', r: 0.1, m: 1, env: 1.4 },
  steel: { c: '#bfc2c6', r: 0.3, m: 1, env: 1.2 },
  black: { c: '#101012', r: 0.3 },
  screen: { c: '#06070a', r: 0.06, env: 1.5 },
  white: { c: '#f3f2ef', r: 0.45 },
  glass: { c: '#e6f2f4', r: 0.05, opacity: 0.1, env: 0.55 },
  mirror: { c: '#f2f6f7', r: 0.02, m: 1, env: 2.2 },
  leaf: { c: '#3f6b3a', r: 0.62 },
  leaf2: { c: '#5d8a47', r: 0.6 },
  soil: { c: '#3a2c22', r: 1 },
  bulb: { c: '#fff2d6', e: '#ffd9a0', r: 0.4 },
  shade: { c: '#f1e6d2', e: '#ffcf8f', r: 0.9 },
  downlight: { c: '#fbf6ea', e: '#ffe2b4', r: 0.5 },
  cove: { c: '#fbf3e2', e: '#ffd49a', r: 0.6 },
  diya: { c: '#ffb24d', e: '#ff9a2e', r: 0.5 },
  linen: { tex: cloth('#f4f1ea', 11, 6, 2, 'linen'), size: 0.5, r: 0.95, bump: 0.15 },
  towel: { tex: cloth('#efe9df', 12, 10, 3, 'terry'), size: 0.25, r: 1, bump: 0.6 },
  floorHall: { tex: { gen: 'tile', n: 2, base: '#cfc8bb', veins: ['#b9b1a2', '#ddd7cb'], grout: '#aaa294', vein: 0.25, cloud: 0.14, seed: 91 }, size: 1.2192, r: 0.4 },
  hallWall: { c: '#e7e2d8', r: 0.95 },
  slabEdge: { c: '#d9d5cc', r: 0.9 },
  paper: { c: '#f1ede4', r: 0.8 },
  fruit: { c: '#d98a2b', r: 0.5 },
  fruit2: { c: '#8f2f25', r: 0.45 },
  /* Indian household things — the same in every style */
  brass: { c: '#c99a3e', r: 0.26, m: 1, env: 1.5 },
  copper: { c: '#b9643d', r: 0.3, m: 1, env: 1.4 },
  vessel: { c: '#dfe2e4', r: 0.14, m: 1, env: 1.6 },
  plastic: { c: '#2f6db5', r: 0.32 },
  plasticR: { c: '#c4261c', r: 0.36 },
  grill: { c: '#2c2c2e', r: 0.45, m: 0.5 },
  acBody: { c: '#f4f4f2', r: 0.32 },
  acLed: { c: '#6fd0ff', e: '#4fc3ff', r: 0.4 },
  terracotta: { c: '#a9582f', r: 0.85 },
  whitewash: { c: '#f1ece1', r: 0.9 },
  marigold: { c: '#f39612', r: 0.75 },
  jasmine: { c: '#fbf8ef', r: 0.7 },
  rose: { c: '#b8182c', r: 0.6 },
  water: { c: '#1c2a2a', r: 0.04, env: 2 },
  flame: { c: '#ffcf6b', e: '#ffb02e', r: 0.5 },
  rope: { c: '#8a6b45', r: 0.95 },
  granite: { tex: { gen: 'granite', base: '#121112', flecks: ['#9b7b4b', '#c4a070', '#8c8f96', '#d8d2c6', '#5a4a3a'], seed: 61 }, size: 0.7, r: 0.12, env: 1.4 },
  kalamkari: { tex: { gen: 'kalamkari', seed: 71 }, r: 0.9 },
  rangoli: { tex: { gen: 'rangoli', seed: 72 }, r: 0.95, opacity: 1 },
  teak: { tex: { gen: 'wood', cols: 1, base: '#7a4a26', dark: '#3e2310', variance: 0.3, gap: 0, joints: false, seed: 73 }, size: 0.9, r: 0.36, bump: 0.3, env: 1.1 },
  laminate: { tex: { gen: 'wood', cols: 1, base: '#a57c55', dark: '#6b4a2e', variance: 0.2, gap: 0, joints: false, seed: 74 }, size: 1.4, r: 0.4, bump: 0.1 },
  tileFloorB: { tex: { gen: 'grid', cols: 4, rows: 4, base: '#a9a29a', grout: '#8b847c', variance: 0.06, seed: 75 }, size: 1.2192, r: 0.6, bump: 0.5 },
};

const LUX: Record<string, MatSpec> = {
  wall: { tex: { gen: 'plaster', base: '#efe7da', seed: 3 }, size: 2.4, r: 0.93 },
  wallAccent: { tex: { gen: 'plaster', base: '#a9967e', seed: 4 }, size: 2.4, r: 0.9 },
  panel: { tex: wood('#6e4c35', '#3d281b', 21, 6, 0.3), size: 1.5, r: 0.5 },
  skirting: { c: '#f1ece2', r: 0.6 },
  floorMain: { tex: { gen: 'tile', n: 2, base: '#e9dfcf', veins: ['#c7b499', '#b39a7b', '#f8f2e8'], grout: '#b5a78f', vein: 0.5, cloud: 0.26, seed: 7 }, size: 1.2192, r: 0.16, refl: 0.34, env: 0.55 },
  floorMaster: { tex: { gen: 'tile', n: 2, base: '#bdbab5', veins: ['#8d8a86', '#e5e3df', '#a3a09b'], grout: '#8a8782', vein: 0.5, cloud: 0.26, seed: 8 }, size: 1.2192, r: 0.18, refl: 0.32, env: 0.55 },
  floorBath: { tex: { gen: 'grid', cols: 4, rows: 4, base: '#8d7763', grout: '#6f5c4b', variance: 0.08, seed: 9 }, size: 1.2192, r: 0.55, bump: 0.4 },
  floorDeck: { tex: { gen: 'wood', cols: 8, base: '#8a5f41', dark: '#4e3322', variance: 0.4, gap: 3, joints: true, seed: 10 }, size: 1.1, r: 0.7, bump: 0.6 },
  bathWall: { tex: { gen: 'grid', cols: 2, rows: 4, base: '#e8dfd0', grout: '#d0c4b0', variance: 0.035, seed: 12 }, size: 1.2192, r: 0.2, env: 1.1 },
  backsplash: { tex: { gen: 'slab', base: '#f1ece2', veins: ['#bca98c', '#d9cdb8'], vein: 0.5, seed: 13 }, size: 2.2, r: 0.12 },
  counter: { tex: { gen: 'granite', base: '#121112', flecks: ['#9b7b4b', '#c4a070', '#8c8f96', '#d8d2c6', '#5a4a3a'], seed: 14 }, size: 0.7, r: 0.1, env: 1.4 },
  wood: { tex: wood('#6e4c35', '#3d281b', 21), size: 0.9, r: 0.42, bump: 0.25 },
  wood2: { tex: wood('#4c3525', '#271810', 22), size: 0.9, r: 0.4, bump: 0.25 },
  cabinet: { tex: wood('#6e4c35', '#3d281b', 23, 4, 0.2), size: 1.2, r: 0.4 },
  cabinetUp: { c: '#ece5d7', r: 0.38 },
  lacquer: { c: '#ece5d7', r: 0.4 },
  doorLeaf: { tex: wood('#7a543a', '#42291b', 24), size: 1.1, r: 0.45, bump: 0.2 },
  doorMain: { tex: wood('#6e4224', '#341b0b', 25, 1, 0.25), size: 1.1, r: 0.34, bump: 0.3, env: 1.1 },
  frame: { tex: wood('#5b3a26', '#2a170d', 26), size: 0.8, r: 0.45 },
  metal: { c: '#b9985c', r: 0.3, m: 1, env: 1.3 },
  fabric: { tex: cloth('#d6cab7', 31, 10, 3, 'boucle'), size: 0.22, r: 0.98, bump: 0.7 },
  fabric2: { tex: cloth('#8c6a4e', 32, 9, 2, 'velvet'), size: 0.45, r: 0.78, bump: 0.15 },
  duvet: { tex: { gen: 'print', base: '#f3ead8', ink: ['#a8342a', '#3c5a46', '#2a2320'], seed: 33, motif: 'butti' }, size: 0.42, r: 0.96 },
  throw: { tex: cloth('#a5673f', 34, 10, 3, 'knit'), size: 0.42, r: 1, bump: 0.9 },
  cushionA: { tex: cloth('#a5673f', 35, 9, 2, 'velvet'), size: 0.4, r: 0.8 },
  cushionB: { tex: cloth('#3f5a4a', 36, 8, 2, 'linen'), size: 0.3, r: 0.95, bump: 0.2 },
  curtain: { tex: cloth('#cdbfa6', 37, 7, 2, 'linen'), size: 0.4, r: 0.95 },
  sheer: { c: '#fffaf0', r: 0.9, opacity: 0.42 },
  pot: { c: '#e7dfd0', r: 0.5 },
  decorA: { c: '#a5673f', r: 0.45 },
  decorB: { c: '#2f4a3c', r: 0.4 },
  artFrame: { c: '#b9985c', r: 0.35, m: 1 },
  rugA: { tex: { gen: 'rug', kind: 'persian', pal: ['#7d3f31', '#e6d6ba', '#27344a', '#bd9156'], seed: 41, aspect: 1.3 }, r: 1 },
  rugB: { tex: { gen: 'rug', kind: 'persian', pal: ['#e3d5bb', '#8a4a39', '#9a7d58', '#4a6052'], seed: 42, aspect: 1.45 }, r: 1 },
  rugC: { tex: { gen: 'rug', kind: 'persian', pal: ['#2f3d50', '#e6d6ba', '#7d3f31', '#bd9156'], seed: 43, aspect: 1.3 }, r: 1 },
  rugR: { tex: { gen: 'rug', kind: 'persian', pal: ['#7d3f31', '#e6d6ba', '#27344a', '#bd9156'], seed: 44, aspect: 3.2 }, r: 1 },
  fanBlade: { tex: wood('#6e4224', '#341b0b', 27), size: 0.6, r: 0.4 },
  fanBody: { c: '#c99a3e', r: 0.28, m: 1, env: 1.4 },
  art: { tex: { gen: 'art', kind: 'warm', pal: ['#e9dcc4', '#b5673c', '#d9a35c', '#51634e', '#7d4a33', '#f1e6cf'], seed: 51 }, r: 0.8 },
};

const MODERN: Record<string, MatSpec> = {
  wall: { tex: { gen: 'plaster', base: '#f0f0ee', seed: 103 }, size: 2.4, r: 0.93 },
  wallAccent: { tex: { gen: 'plaster', base: '#3c4046', seed: 104 }, size: 2.4, r: 0.88 },
  panel: { tex: wood('#2a2a2c', '#141415', 121, 8, 0.2), size: 1.5, r: 0.45 },
  skirting: { c: '#f0f0ee', r: 0.6 },
  floorMain: { tex: { gen: 'tile', n: 2, base: '#cbcbc8', veins: ['#b4b4b1', '#dcdcda'], grout: '#acaca9', vein: 0.26, cloud: 0.22, seed: 107 }, size: 2.4384, r: 0.22, refl: 0.3, env: 0.55 },
  floorMaster: { tex: { gen: 'tile', n: 2, base: '#8f9194', veins: ['#77797c', '#a9abad'], grout: '#74767a', vein: 0.26, cloud: 0.22, seed: 108 }, size: 2.4384, r: 0.24, refl: 0.28, env: 0.55 },
  floorBath: { tex: { gen: 'grid', cols: 2, rows: 2, base: '#585b60', grout: '#43464a', variance: 0.07, seed: 109 }, size: 1.2192, r: 0.5, bump: 0.3 },
  floorDeck: { tex: { gen: 'wood', cols: 8, base: '#74706b', dark: '#3d3a37', variance: 0.3, gap: 3, joints: true, seed: 110 }, size: 1.1, r: 0.75, bump: 0.6 },
  bathWall: { tex: { gen: 'grid', cols: 1, rows: 2, base: '#eeeeec', grout: '#d2d2d0', variance: 0.02, seed: 112 }, size: 1.2192, r: 0.18, env: 1.1 },
  backsplash: { tex: { gen: 'grid', cols: 4, rows: 12, base: '#e4e4e2', grout: '#bdbdbb', variance: 0.04, bond: true, seed: 113 }, size: 1.2, r: 0.15 },
  counter: { tex: { gen: 'slab', base: '#232427', veins: ['#5c5e62', '#3a3b3f'], vein: 0.5, seed: 114 }, size: 1.8, r: 0.12, env: 1.3 },
  wood: { tex: wood('#8d7157', '#4d3a2a', 121), size: 0.9, r: 0.45, bump: 0.25 },
  wood2: { tex: wood('#262628', '#111112', 122), size: 0.9, r: 0.4, bump: 0.2 },
  cabinet: { c: '#f3f3f1', r: 0.36 },
  cabinetUp: { c: '#2d2f34', r: 0.38 },
  lacquer: { c: '#f3f3f1', r: 0.38 },
  doorLeaf: { c: '#f1f1ef', r: 0.42 },
  doorMain: { tex: wood('#2c2c2e', '#131314', 125, 3, 0.2), size: 1.1, r: 0.38, bump: 0.3 },
  frame: { c: '#26272a', r: 0.45 },
  metal: { c: '#1b1b1d', r: 0.42, m: 0.9, env: 1.1 },
  fabric: { tex: cloth('#94979b', 131, 9, 2), size: 0.22, r: 0.96, bump: 0.4 },
  fabric2: { tex: cloth('#2d2f34', 132, 7, 2, 'velvet'), size: 0.45, r: 0.8, bump: 0.15 },
  duvet: { tex: cloth('#f3f3f1', 133, 6, 2, 'linen'), size: 0.5, r: 0.97, bump: 0.15 },
  throw: { tex: cloth('#c9a227', 134, 10, 3, 'knit'), size: 0.42, r: 1, bump: 0.9 },
  cushionA: { tex: cloth('#c9a227', 135, 9, 2, 'velvet'), size: 0.4, r: 0.8 },
  cushionB: { tex: cloth('#202124', 136, 8), size: 0.25, r: 0.95, bump: 0.2 },
  curtain: { tex: cloth('#b9bbbd', 137, 7, 2, 'linen'), size: 0.4, r: 0.95 },
  sheer: { c: '#fbfcfd', r: 0.9, opacity: 0.4 },
  pot: { c: '#2a2b2e', r: 0.5 },
  decorA: { c: '#c9a227', r: 0.45 },
  decorB: { c: '#202124', r: 0.35 },
  artFrame: { c: '#161617', r: 0.5 },
  rugA: { tex: { gen: 'rug', kind: 'geo', pal: ['#d8d8d6', '#a9abad', '#6f7275', '#c9a227', '#232427'], seed: 141, aspect: 1.3 }, r: 1 },
  rugB: { tex: { gen: 'rug', kind: 'geo', pal: ['#cfd0d1', '#8f9194', '#e6e6e4', '#232427'], seed: 142, aspect: 1.45 }, r: 1 },
  rugC: { tex: { gen: 'rug', kind: 'geo', pal: ['#3b3d41', '#5a5c60', '#8f9194', '#c9a227', '#d8d8d6'], seed: 143, aspect: 1.3 }, r: 1 },
  rugR: { tex: { gen: 'rug', kind: 'geo', pal: ['#d8d8d6', '#a9abad', '#6f7275', '#232427'], seed: 144, aspect: 3.2 }, r: 1 },
  fanBlade: { c: '#1b1b1d', r: 0.4, m: 0.3 },
  fanBody: { c: '#1b1b1d', r: 0.35, m: 0.6 },
  art: { tex: { gen: 'art', kind: 'graphic', pal: ['#111113', '#c9a227', '#8f9194', '#2b4c7e', '#d8d8d6'], seed: 151 }, r: 0.8 },
};

const SCANDI: Record<string, MatSpec> = {
  wall: { tex: { gen: 'plaster', base: '#f5f2ec', seed: 203 }, size: 2.4, r: 0.94 },
  wallAccent: { tex: { gen: 'plaster', base: '#c2ccbc', seed: 204 }, size: 2.4, r: 0.92 },
  panel: { tex: wood('#dcc5a1', '#b39369', 221, 8, 0.25), size: 1.5, r: 0.55 },
  skirting: { c: '#fbfaf6', r: 0.6 },
  floorMain: { tex: { gen: 'wood', cols: 6, base: '#d9bf9a', dark: '#b08f66', variance: 0.5, gap: 1.5, joints: true, seed: 207 }, size: 1.1, r: 0.38, refl: 0.16, env: 0.5, bump: 0.15 },
  floorMaster: { tex: { gen: 'wood', cols: 6, base: '#cfb894', dark: '#a48560', variance: 0.5, gap: 1.5, joints: true, seed: 208 }, size: 1.1, r: 0.38, refl: 0.16, env: 0.5, bump: 0.15 },
  floorBath: { tex: { gen: 'grid', cols: 4, rows: 4, base: '#cbc9c3', grout: '#b1afa9', variance: 0.05, seed: 209 }, size: 1.2192, r: 0.5, bump: 0.3 },
  floorDeck: { tex: { gen: 'wood', cols: 8, base: '#bfa27e', dark: '#8a7052', variance: 0.35, gap: 3, joints: true, seed: 210 }, size: 1.1, r: 0.7, bump: 0.6 },
  bathWall: { tex: { gen: 'grid', cols: 4, rows: 8, base: '#f5f4f0', grout: '#d6d4ce', variance: 0.03, bond: true, seed: 212 }, size: 1.2192, r: 0.2, env: 1.1 },
  backsplash: { tex: { gen: 'grid', cols: 4, rows: 12, base: '#f7f6f2', grout: '#d3d1cb', variance: 0.03, bond: true, seed: 213 }, size: 1.2, r: 0.16 },
  counter: { tex: { gen: 'slab', base: '#f5f4f1', veins: ['#d5d3ce', '#e6e4df'], vein: 0.3, seed: 214 }, size: 1.8, r: 0.16, env: 1.1 },
  wood: { tex: wood('#dcc5a1', '#b39369', 221), size: 0.9, r: 0.5, bump: 0.2 },
  wood2: { tex: wood('#bd9f76', '#8e6f4a', 222), size: 0.9, r: 0.5, bump: 0.2 },
  cabinet: { c: '#fbfaf6', r: 0.4 },
  cabinetUp: { tex: wood('#dcc5a1', '#b39369', 223, 4, 0.2), size: 1.2, r: 0.5 },
  lacquer: { c: '#fbfaf6', r: 0.42 },
  doorLeaf: { c: '#fbfaf6', r: 0.45 },
  doorMain: { tex: wood('#c9ac82', '#94734c', 225, 3, 0.25), size: 1.1, r: 0.45, bump: 0.3 },
  frame: { c: '#fbfaf6', r: 0.5 },
  metal: { c: '#c3c5c8', r: 0.34, m: 1, env: 1.2 },
  fabric: { tex: cloth('#ddd7cc', 231, 10, 3, 'boucle'), size: 0.22, r: 0.98, bump: 0.7 },
  fabric2: { tex: cloth('#9fb0b5', 232, 8, 2, 'linen'), size: 0.3, r: 0.92, bump: 0.25 },
  duvet: { tex: { gen: 'print', base: '#f6f3ec', ink: ['#2e4a78', '#6f8fb8', '#22314f'], seed: 233, motif: 'jaal' }, size: 0.42, r: 0.96 },
  throw: { tex: cloth('#9fb0b5', 234, 10, 3, 'knit'), size: 0.42, r: 1, bump: 0.9 },
  cushionA: { tex: cloth('#b9c4b2', 235, 8, 2, 'linen'), size: 0.3, r: 0.95, bump: 0.2 },
  cushionB: { tex: cloth('#d9b8a8', 236, 9, 2, 'velvet'), size: 0.4, r: 0.8 },
  curtain: { tex: cloth('#f1eee7', 237, 7, 2, 'linen'), size: 0.4, r: 0.95 },
  sheer: { c: '#ffffff', r: 0.9, opacity: 0.4 },
  pot: { c: '#f4f1ea', r: 0.55 },
  decorA: { c: '#9fb0b5', r: 0.5 },
  decorB: { c: '#b9c4b2', r: 0.5 },
  artFrame: { tex: wood('#dcc5a1', '#b39369', 226), size: 0.6, r: 0.55 },
  rugA: { tex: { gen: 'rug', kind: 'berber', pal: ['#efe9dd', '#6b6f73', '#9fb0b5'], seed: 241, aspect: 1.3 }, r: 1 },
  rugB: { tex: { gen: 'rug', kind: 'berber', pal: ['#f1ece2', '#b9a58a', '#d9b8a8'], seed: 242, aspect: 1.45 }, r: 1 },
  rugC: { tex: { gen: 'rug', kind: 'berber', pal: ['#e7e3da', '#8a9a8a', '#b9c4b2'], seed: 243, aspect: 1.3 }, r: 1 },
  rugR: { tex: { gen: 'rug', kind: 'berber', pal: ['#efe9dd', '#6b6f73', '#9fb0b5'], seed: 244, aspect: 3.2 }, r: 1 },
  fanBlade: { tex: wood('#dcc5a1', '#b39369', 227), size: 0.6, r: 0.5 },
  fanBody: { c: '#f3f2ee', r: 0.35 },
  art: { tex: { gen: 'art', kind: 'line', pal: ['#f7f4ee', '#b9c4b2', '#d9b8a8', '#9fb0b5', '#e3d3b8'], seed: 251 }, r: 0.85 },
};

const TABLE: Record<StyleId, Record<string, MatSpec>> = { lux: LUX, modern: MODERN, scandi: SCANDI };

export function matSpec(slot: string, style: StyleId): MatSpec {
  const s = TABLE[style][slot] ?? COMMON[slot] ?? LUX[slot];
  if (!s) throw new Error(`flat3d: unknown material slot "${slot}"`);
  return s;
}

export const ALL_STYLES: StyleId[] = ['lux', 'modern', 'scandi'];
