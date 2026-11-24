/**
 * Elite Homes 3 BHK — East and West facing floor plans, transcribed from the brochure sheets.
 *
 * Everything here is in FEET, in the same orientation as the printed plan:
 *   x → right on the sheet, y → down on the sheet. On both sheets the top edge is EAST
 *   (so left = north, right = south, bottom = west).
 * The origin is the inside face of the top-left room corner. Room rectangles are clear
 * internal sizes exactly as printed; walls are 5" inside (4.5" brick + plaster) and 9" outside,
 * which is the only pair of thicknesses that makes every printed dimension add up.
 *
 * The 3D model, the collision map, the plan thumbnails and the tour are all generated from
 * this one file, so a correction here corrects all of them.
 */

export const FT = 0.3048;
/** inner wall, outer wall, railing/parapet thickness (ft) */
export const T = 5 / 12;
export const X = 0.75;
const R = 0.33;
/** glass balustrade */
const G = 0.17;

/** heights (ft) — not given on the plan, standard for this kind of apartment */
export const CEIL = 10;
export const DOOR_HEAD = 7;
export const SILL = 3;

export type PlanId = 'east' | 'west';
export type Rect4 = [number, number, number, number];
export type RoomKind = 'living' | 'dining' | 'kitchen' | 'bed' | 'master' | 'bath' | 'balcony' | 'service' | 'passage' | 'puja';
export type FloorKind = 'main' | 'master' | 'bath' | 'deck';

export type RoomDef = {
  id: string;
  name: string;
  kind: RoomKind;
  /** clear internal rectangle [x0, y0, x1, y1] */
  r: Rect4;
  /** size as printed on the plan */
  dims: string;
  floor: FloorKind;
  /** one honest selling point, derived from the plan itself */
  point: string;
  /** where a visitor stands and what they look at: [standX, standY, lookX, lookY] */
  view: [number, number, number, number];
  /** leave it out of the dollhouse labels (tiny spaces) */
  quiet?: boolean;
};

export type OpeningKind = 'main' | 'door' | 'bath' | 'gdoor' | 'arch' | 'slider' | 'window' | 'vent';
export type Opening = {
  kind: OpeningKind;
  /** start / end along the wall (same axis as the wall's a..b) */
  a: number;
  b: number;
  sill?: number;
  head?: number;
  /** which end the leaf is hung on, and which side it opens to (+1 = right/down, -1 = left/up) */
  hinge?: 'a' | 'b';
  swing?: 1 | -1;
  /** how far the leaf stands open, degrees */
  angle?: number;
  /** sliding doors: which end is slid open */
  openAt?: 'a' | 'b';
};

export type WallDef = {
  /** 'h' runs along x at y = c..c+t · 'v' runs along y at x = c..c+t */
  o: 'h' | 'v';
  c: number;
  a: number;
  b: number;
  t: number;
  kind?: 'wall' | 'parapet' | 'rail';
  open?: Opening[];
};

export type TourNode = {
  p: [number, number];
  /** present on the nodes where the camera stops */
  stop?: { room: string; look: [number, number]; title?: string };
};

export type PlanDef = {
  id: PlanId;
  label: string;
  facing: string;
  rooms: RoomDef[];
  walls: WallDef[];
  /** outer slab rectangles (floor + ceiling) */
  slabs: Rect4[];
  /** the bit of common corridor outside the main door */
  entry: { r: Rect4; side: 'top' | 'bottom' };
  /** start pose for free walking: [x, y, lookX, lookY] */
  spawn: [number, number, number, number];
  tour: TourNode[];
};

const win = (a: number, b: number, sill = SILL, head = DOOR_HEAD): Opening => ({ kind: 'window', a, b, sill, head });
const vent = (a: number, b: number): Opening => ({ kind: 'vent', a, b, sill: 5.5, head: 7.5 });
const door = (kind: OpeningKind, a: number, b: number, hinge: 'a' | 'b', swing: 1 | -1, angle = 90): Opening =>
  ({ kind, a, b, hinge, swing, angle, head: DOOR_HEAD });

/* ------------------------------------------------------------------ EAST */

const east: PlanDef = {
  id: 'east',
  label: 'East facing',
  facing: 'Main door faces east',
  rooms: [
    { id: 'living', name: 'Living room', kind: 'living', r: [0, 0, 16.75, 12.417], dims: `16'9" × 12'5"`, floor: 'main',
      point: 'The largest room in the home sits right at the entrance, with a full wall for the TV.', view: [10.6, 5.6, 3.4, 8.4] },
    { id: 'kitchen', name: 'Kitchen', kind: 'kitchen', r: [17.167, 0, 26.417, 12.417], dims: `9'3" × 12'5"`, floor: 'main',
      point: 'An L-shaped counter with the sink under an east window — morning light while you cook.', view: [22.3, 8.2, 21.2, 0.5] },
    { id: 'service', name: 'Service balcony', kind: 'service', r: [26.833, -0.75, 30.833, 12.417], dims: `4'0" wide`, floor: 'deck',
      point: 'A separate 4 ft wash area off the kitchen keeps laundry out of the living spaces.', view: [28.8, 7.9, 28.8, 1.5], quiet: true },
    { id: 'dining', name: 'Dining', kind: 'dining', r: [11.667, 12.833, 26.417, 23.833], dims: `14'9" × 11'0"`, floor: 'main',
      point: 'Seats six comfortably, open to the kitchen and to the balcony on the south side.', view: [14.6, 14.6, 21.6, 18.4] },
    { id: 'balcony', name: 'Balcony', kind: 'balcony', r: [26.833, 12.833, 30.833, 23.833], dims: `4'0" wide`, floor: 'deck',
      point: 'An 11 ft long sit-out through a wide sliding door from the dining.', view: [28.7, 16.4, 29.6, 22.5] },
    { id: 'bed1', name: 'Bedroom 1', kind: 'bed', r: [0, 12.833, 11.25, 23.833], dims: `11'3" × 11'0"`, floor: 'main',
      point: 'Has its own attached bathroom, tucked between two built-in wardrobes.', view: [8.6, 18.6, 3.2, 15.6] },
    { id: 'bath1', name: 'Bathroom 1', kind: 'bath', r: [0, 24.25, 11.25, 29.25], dims: `11'3" × 5'0"`, floor: 'bath',
      point: 'More than 11 ft long, with the shower kept apart from the basin and WC.', view: [5.3, 25.5, 9.6, 27.2], quiet: true },
    { id: 'bed2', name: 'Bedroom 2', kind: 'bed', r: [0, 29.667, 11.25, 41], dims: `11'3" × 11'4"`, floor: 'main',
      point: 'Opens onto a private balcony of its own on the west side.', view: [8.6, 35.6, 3.2, 32.6] },
    { id: 'balcony2', name: 'Bedroom balcony', kind: 'balcony', r: [-0.75, 41.417, 11.25, 44.417], dims: `3'0" wide`, floor: 'deck',
      point: 'A 12 ft long private balcony facing west — made for the evening sky.', view: [2.4, 42.75, 9, 43.2], quiet: true },
    { id: 'passage', name: 'Passage', kind: 'passage', r: [11.667, 23.833, 15.667, 33.583], dims: `4'0" wide`, floor: 'main',
      point: 'The bedrooms sit off their own passage, away from the living and dining.', view: [13.7, 25.4, 13.7, 32], quiet: true },
    { id: 'bathc', name: 'Common bathroom', kind: 'bath', r: [11.667, 34, 15.667, 42], dims: `4'0" × 8'0"`, floor: 'bath',
      point: 'Opens straight off Bedroom 2, so the bedroom gets a second bathroom without a trip down the passage.', view: [13.8, 35.4, 13.3, 40.6], quiet: true },
    { id: 'master', name: 'Master bedroom', kind: 'master', r: [16.083, 29.667, 30.083, 43.667], dims: `14'0" × 14'0"`, floor: 'master',
      point: 'A full 14 × 14 ft suite with a west window and its own 14 ft bathroom.', view: [19.4, 32.6, 26.2, 38.2] },
    { id: 'bathm', name: 'Master bathroom', kind: 'bath', r: [16.083, 24.25, 30.083, 29.25], dims: `14'0" × 5'0"`, floor: 'bath',
      point: '14 ft long with a walk-in shower bay at one end.', view: [22.6, 27.5, 28, 26.4], quiet: true },
  ],
  walls: [
    // outer shell
    { o: 'h', c: -X, a: -X, b: 26.833, t: X, open: [door('main', 4.2, 7.7, 'a', 1), win(18.3, 21.3, 3.5)] },
    { o: 'v', c: -X, a: 0, b: 41.417, t: X, open: [win(4, 9), win(15.5, 20), vent(25.75, 27.75), win(32.5, 37)] },
    { o: 'v', c: 30.083, a: 24.25, b: 44.417, t: X, open: [vent(25.75, 27.75)] },
    { o: 'h', c: 43.667, a: 15.667, b: 30.083, t: X, open: [win(21.4, 26.4, 2.5)] },
    { o: 'h', c: 42, a: 11.25, b: 16.083, t: X, open: [vent(12.9, 14.6)] },
    { o: 'v', c: 11.25, a: 42.75, b: 44.417, t: T },
    // kitchen · service · balcony
    { o: 'v', c: 26.417, a: 0, b: 12.417, t: T, open: [win(2.8, 5.6, 3.5), door('gdoor', 6.6, 9.1, 'b', 1, 172)] },
    { o: 'h', c: 12.417, a: 24.2, b: 30.833, t: T },
    { o: 'v', c: 26.417, a: 12.833, b: 23.833, t: T, open: [{ kind: 'slider', a: 15, b: 22.5, head: DOOR_HEAD, openAt: 'a' }] },
    { o: 'h', c: 23.833, a: 15.667, b: 30.833, t: T },
    // living
    { o: 'h', c: 12.417, a: 0, b: 11.25, t: T },
    { o: 'v', c: 16.75, a: 0, b: 11.5, t: T },
    // bedroom spine
    { o: 'v', c: 11.25, a: 12.417, b: 42, t: T, open: [door('door', 13.4, 16.4, 'a', -1), door('door', 30.6, 33.6, 'a', -1), door('bath', 36.6, 39.1, 'a', -1)] },
    { o: 'h', c: 23.833, a: 0, b: 11.25, t: T, open: [door('bath', 3.3, 5.8, 'a', 1)] },
    { o: 'h', c: 29.25, a: 0, b: 11.25, t: T },
    { o: 'h', c: 41, a: -X, b: 11.25, t: T, open: [door('gdoor', 0.6, 3.4, 'a', -1)] },
    // master side
    { o: 'v', c: 15.667, a: 24.25, b: 43.667, t: T, open: [door('door', 30.3, 33.3, 'a', 1)] },
    { o: 'h', c: 29.25, a: 16.083, b: 30.083, t: T, open: [door('bath', 20.5, 23, 'a', -1)] },
    { o: 'h', c: 33.583, a: 11.667, b: 15.667, t: T },
    // balcony edges
    { o: 'h', c: -X, a: 26.833, b: 30.833, t: R, kind: 'parapet' },
    { o: 'v', c: 30.5, a: -X, b: 12.417, t: R, kind: 'parapet' },
    { o: 'v', c: 30.833 - G, a: 12.833, b: 23.833, t: G, kind: 'rail' },
    { o: 'h', c: 44.417 - G, a: -X, b: 11.25, t: G, kind: 'rail' },
    { o: 'v', c: -X, a: 41.417, b: 44.417, t: G, kind: 'rail' },
  ],
  slabs: [[-X, -X, 30.833, 42.75], [-X, 42.75, 11.667, 44.417], [15.667, 42.75, 30.833, 44.417]],
  entry: { r: [1.4, -6.25, 10.6, -X], side: 'top' },
  spawn: [5.95, 2.6, 8.5, 8],
  tour: [
    { p: [5.95, -3.6], stop: { room: 'entry', look: [5.95, 4], title: 'Welcome home' } },
    { p: [5.95, 1.6] },
    { p: [8.8, 4.4] },
    { p: [10.6, 5.6], stop: { room: 'living', look: [3.4, 8.4] } },
    { p: [13.4, 10.2] },
    { p: [14.8, 13.2] },
    { p: [18, 13.4] },
    { p: [21.4, 13.3] },
    { p: [22.2, 10.6] },
    { p: [22.3, 8.2], stop: { room: 'kitchen', look: [21.2, 0.5] } },
    { p: [24.6, 7.85] },
    { p: [27.4, 7.85] },
    { p: [28.8, 7.9], stop: { room: 'service', look: [28.8, 1.5] } },
    { p: [27.2, 7.85] },
    { p: [24.4, 8.4] },
    { p: [22.2, 11.2] },
    { p: [20.8, 13.3] },
    { p: [17.5, 13.4] },
    { p: [14.6, 14.6], stop: { room: 'dining', look: [21.6, 18.4] } },
    { p: [17.5, 13.4] },
    { p: [21.6, 13.8] },
    { p: [24.5, 13.95] },
    { p: [25.5, 15.4] },
    { p: [27.2, 16.3] },
    { p: [28.7, 16.4], stop: { room: 'balcony', look: [29.6, 22.5] } },
    { p: [27, 16.3] },
    { p: [25.5, 15.3] },
    { p: [24.5, 13.95] },
    { p: [21, 13.75] },
    { p: [15.4, 13.5] },
    { p: [12.6, 14.9] },
    { p: [10.3, 15] },
    { p: [8.8, 16.4] },
    { p: [8.6, 18.6], stop: { room: 'bed1', look: [3.2, 15.6] } },
    { p: [8.5, 20.5] },
    { p: [4.8, 20.85] },
    { p: [4.55, 23.6] },
    { p: [5.3, 25.5], stop: { room: 'bath1', look: [9.6, 27.2] } },
    { p: [4.55, 23.4] },
    { p: [4.9, 20.85] },
    { p: [8.4, 20.5] },
    { p: [8.7, 17.2] },
    { p: [10.3, 15] },
    { p: [12.8, 15.2] },
    { p: [13.7, 20] },
    { p: [13.7, 28.5] },
    { p: [13, 32] },
    { p: [10.3, 32.2] },
    { p: [8.8, 33.6] },
    { p: [8.6, 35.6], stop: { room: 'bed2', look: [3.2, 32.6] } },
    { p: [8.4, 37.6] },
    { p: [2.6, 37.9] },
    { p: [2, 40.6] },
    { p: [2.4, 42.75], stop: { room: 'balcony2', look: [9, 43.2] } },
    { p: [2, 40.4] },
    { p: [2.7, 37.9] },
    { p: [8.3, 37.6] },
    { p: [10, 37.85] },
    { p: [12.4, 37.85] },
    { p: [13.8, 35.4], stop: { room: 'bathc', look: [13.3, 40.6] } },
    { p: [12.4, 37.85] },
    { p: [10, 37.85] },
    { p: [8.7, 34.2] },
    { p: [10.3, 32.2] },
    { p: [13.2, 32.2] },
    { p: [14.6, 31.8] },
    { p: [17.6, 31.8] },
    { p: [19.4, 32.6], stop: { room: 'master', look: [26.2, 38.2] } },
    { p: [21.75, 31.2] },
    { p: [21.75, 29] },
    { p: [22.6, 27.5], stop: { room: 'bathm', look: [28, 26.4] } },
  ],
};

/* ------------------------------------------------------------------ WEST */

const west: PlanDef = {
  id: 'west',
  label: 'West facing',
  facing: 'Main door faces west',
  rooms: [
    { id: 'living', name: 'Living room', kind: 'living', r: [0, 31.667, 15.583, 43.667], dims: `15'7" × 12'0"`, floor: 'main',
      point: 'Step straight in from the front door, with a full wall for the TV and a north window.', view: [10.2, 39.8, 3.6, 34.8] },
    { id: 'master', name: 'Master bedroom', kind: 'master', r: [16, 28.667, 30, 43.667], dims: `14'0" × 15'0"`, floor: 'master',
      point: 'The biggest bedroom on either plan — 14 × 15 ft with a full wall of wardrobe.', view: [19.7, 31.4, 26, 36.6] },
    { id: 'bathm', name: 'Master bathroom', kind: 'bath', r: [20, 23.25, 30, 28.25], dims: `10'0" × 5'0"`, floor: 'bath',
      point: 'Attached to the master, with a separate shower bay.', view: [25.3, 26.5, 28.6, 25.2], quiet: true },
    { id: 'passage', name: 'Lobby', kind: 'passage', r: [11.667, 17.833, 19.583, 28.25], dims: `8'0" wide`, floor: 'main',
      point: 'An 8 ft wide family lobby connects every bedroom — no dark corridor.', view: [14.6, 26, 17.6, 21.5], quiet: true },
    { id: 'bed2', name: 'Bedroom 2', kind: 'bed', r: [0, 14.833, 11.25, 26.333], dims: `11'3" × 11'6"`, floor: 'main',
      point: 'A north-facing room that stays cool, with its own attached bathroom.', view: [9.3, 22.7, 3.4, 18.4] },
    { id: 'bath2', name: 'Bathroom 2', kind: 'bath', r: [0, 26.75, 11.25, 31.25], dims: `11'3" × 4'6"`, floor: 'bath',
      point: 'Attached to bedroom 2 and more than 11 ft long.', view: [2.5, 28.6, 9.4, 29], quiet: true },
    { id: 'bed3', name: 'Bedroom 3', kind: 'bed', r: [16, 7.917, 30, 17.417], dims: `14'0" × 9'6"`, floor: 'main',
      point: '14 ft wide with room for a study corner by the south window, plus its own bathroom.', view: [21, 16, 24.2, 10] },
    { id: 'bath3', name: 'Bathroom 3', kind: 'bath', r: [20, 17.833, 30, 22.833], dims: `10'0" × 5'0"`, floor: 'bath',
      point: 'Every bedroom in this plan has an attached bathroom — this is the third.', view: [25.3, 19.6, 28.6, 21], quiet: true },
    { id: 'dining', name: 'Dining', kind: 'dining', r: [0, 3.667, 15.583, 14.417], dims: `15'7" × 10'9"`, floor: 'main',
      point: 'Light from two sides: a north window and a wide sliding door to the east balcony.', view: [12.6, 11.8, 5.2, 7.4] },
    { id: 'puja', name: 'Puja', kind: 'puja', r: [11.667, 0, 15.583, 3.25], dims: `4'0" × 3'3"`, floor: 'main',
      point: 'A dedicated puja alcove in the north-east corner of the home.', view: [13.6, 6.6, 13.6, 1.4], quiet: true },
    { id: 'kitchen', name: 'Kitchen', kind: 'kitchen', r: [16, 0, 26.333, 7.5], dims: `10'4" × 7'6"`, floor: 'main',
      point: 'Two parallel counters with the sink under an east window, right beside the dining.', view: [18.2, 4.2, 23.4, 1] },
    { id: 'service', name: 'Service balcony', kind: 'service', r: [26.75, -0.75, 30.75, 7.5], dims: `4'0" wide`, floor: 'deck',
      point: 'A separate wash area off the kitchen keeps laundry out of sight.', view: [28.7, 4.2, 28.7, 0.4], quiet: true },
    { id: 'balcony', name: 'Balcony', kind: 'balcony', r: [-0.75, -0.75, 11.25, 3.25], dims: `4'0" wide`, floor: 'deck',
      point: 'A 12 ft long east balcony off the dining — sunrise with your morning coffee.', view: [8, 1.35, 1.2, 0.8] },
  ],
  walls: [
    // outer shell
    { o: 'h', c: -X, a: 11.25, b: 26.75, t: X, open: [win(18.2, 21.2, 3.5)] },
    { o: 'v', c: -X, a: 3.25, b: 44.417, t: X, open: [win(6.5, 11.5), win(18.5, 23), vent(28, 30), win(35, 40)] },
    { o: 'h', c: 43.667, a: -X, b: 30.75, t: X, open: [door('main', 0.7, 4.2, 'a', -1)] },
    { o: 'v', c: 30, a: 7.5, b: 43.667, t: X, open: [win(8.6, 11.6), vent(19.3, 21.3), vent(24.75, 26.75), win(30.45, 32.2, 2.5), win(38.4, 40.15, 2.5)] },
    // balcony · puja · kitchen · service
    { o: 'v', c: 11.25, a: -X, b: 3.25, t: T },
    { o: 'h', c: 3.25, a: -X, b: 15.583, t: T, open: [{ kind: 'slider', a: 2, b: 9.5, head: DOOR_HEAD, openAt: 'b' }, { kind: 'arch', a: 11.9, b: 15.35, head: DOOR_HEAD }] },
    { o: 'v', c: 26.333, a: 0, b: 7.5, t: T, open: [door('gdoor', 2.75, 5.25, 'b', 1, 172)] },
    { o: 'h', c: 7.5, a: 15.583, b: 30.75, t: T },
    { o: 'v', c: 15.583, a: 0, b: 17.833, t: T, open: [{ kind: 'arch', a: 3.9, b: 7.4, head: DOOR_HEAD }] },
    // bedroom 3 and the two south bathrooms
    { o: 'h', c: 17.417, a: 16, b: 30, t: T, open: [door('door', 16.4, 19.4, 'a', -1), door('bath', 23.5, 26, 'a', 1)] },
    { o: 'v', c: 19.583, a: 17.833, b: 28.25, t: T },
    { o: 'h', c: 22.833, a: 20, b: 30, t: T },
    // master
    { o: 'h', c: 28.25, a: 15.583, b: 30, t: T, open: [door('door', 16.4, 19.4, 'a', 1), door('bath', 23.5, 26, 'a', -1)] },
    { o: 'v', c: 15.583, a: 28.667, b: 43.667, t: T },
    // bedroom 2 and its bathroom
    { o: 'h', c: 14.417, a: 0, b: 11.667, t: T },
    { o: 'v', c: 11.25, a: 14.833, b: 31.25, t: T, open: [door('door', 18.4, 21.4, 'a', -1)] },
    { o: 'h', c: 26.333, a: 0, b: 11.25, t: T, open: [door('bath', 0.4, 2.9, 'a', 1)] },
    { o: 'h', c: 31.25, a: 0, b: 11.667, t: T },
    // balcony edges
    { o: 'h', c: -X, a: -X, b: 11.25, t: G, kind: 'rail' },
    { o: 'v', c: -X, a: -X, b: 3.25, t: G, kind: 'rail' },
    { o: 'h', c: -X, a: 26.75, b: 30.75, t: R, kind: 'parapet' },
    { o: 'v', c: 30.42, a: -X, b: 7.5, t: R, kind: 'parapet' },
  ],
  slabs: [[-X, -X, 30.75, 44.417]],
  entry: { r: [-0.6, 44.417, 9.4, 49.9], side: 'bottom' },
  spawn: [2.45, 41.2, 7.5, 36.5],
  tour: [
    { p: [2.45, 47.2], stop: { room: 'entry', look: [2.45, 40], title: 'Welcome home' } },
    { p: [2.45, 42.2] },
    { p: [6.4, 40.6] },
    { p: [10.2, 39.8], stop: { room: 'living', look: [3.6, 34.8] } },
    { p: [13.2, 35] },
    { p: [13.8, 30] },
    { p: [16.2, 26.8] },
    { p: [17.9, 27.4] },
    { p: [17.9, 29.6] },
    { p: [19.7, 31.4], stop: { room: 'master', look: [26, 36.6] } },
    { p: [23.6, 30.6] },
    { p: [24.75, 29.4] },
    { p: [24.75, 27.8] },
    { p: [25.3, 26.5], stop: { room: 'bathm', look: [28.6, 25.2] } },
    { p: [24.75, 28] },
    { p: [24.2, 30] },
    { p: [18.6, 30.2] },
    { p: [17.9, 27.6] },
    { p: [15.4, 23.4] },
    { p: [12.8, 20] },
    { p: [10.3, 20.4] },
    { p: [9.3, 22.7], stop: { room: 'bed2', look: [3.4, 18.4] } },
    { p: [6.4, 23.1] },
    { p: [1.9, 23.3] },
    { p: [1.65, 25.6] },
    { p: [2.5, 28.6], stop: { room: 'bath2', look: [9.4, 29] } },
    { p: [1.65, 26] },
    { p: [2, 23.2] },
    { p: [8.6, 22.9] },
    { p: [10.3, 20.3] },
    { p: [13.4, 20] },
    { p: [17.2, 19.4] },
    { p: [17.9, 17.6] },
    { p: [18.4, 16.2] },
    { p: [21, 16], stop: { room: 'bed3', look: [24.2, 10] } },
    { p: [23.8, 16] },
    { p: [24.75, 17.4] },
    { p: [25.3, 19.6], stop: { room: 'bath3', look: [28.6, 21] } },
    { p: [24.75, 17.6] },
    { p: [23.6, 16.1] },
    { p: [18.6, 16.2] },
    { p: [17.9, 19] },
    { p: [14.8, 19] },
    { p: [13.6, 15] },
    { p: [12.6, 11.8], stop: { room: 'dining', look: [5.2, 7.4] } },
    { p: [13.6, 9] },
    { p: [13.6, 6.6], stop: { room: 'puja', look: [13.6, 1.4] } },
    { p: [14.4, 5.7] },
    { p: [16.8, 5.4] },
    { p: [18.2, 4.2], stop: { room: 'kitchen', look: [23.4, 1] } },
    { p: [22, 3.9] },
    { p: [25.4, 4] },
    { p: [27.4, 4] },
    { p: [28.7, 4.2], stop: { room: 'service', look: [28.7, 0.4] } },
    { p: [27, 4] },
    { p: [24, 3.9] },
    { p: [17.4, 4.6] },
    { p: [14.2, 5.6] },
    { p: [10.6, 4.9] },
    { p: [8.3, 4.5] },
    { p: [8.25, 2.6] },
    { p: [8, 1.35], stop: { room: 'balcony', look: [1.2, 0.8] } },
  ],
};

export const PLANS: Record<PlanId, PlanDef> = { east, west };

export const sqft = (r: Rect4) => Math.round((r[2] - r[0]) * (r[3] - r[1]));

export function roomById(plan: PlanDef, id: string): RoomDef | undefined {
  return plan.rooms.find((r) => r.id === id);
}

/** which room a point (feet) is in; the wall band around a room counts as that room */
export function roomAt(plan: PlanDef, x: number, y: number): RoomDef | null {
  let best: RoomDef | null = null;
  let bestArea = Infinity;
  for (const room of plan.rooms) {
    const [x0, y0, x1, y1] = room.r;
    const m = 0.25;
    if (x >= x0 - m && x <= x1 + m && y >= y0 - m && y <= y1 + m) {
      const area = (x1 - x0) * (y1 - y0);
      if (area < bestArea) { best = room; bestArea = area; }
    }
  }
  return best;
}

/** overall bounds of the flat in feet */
export function planBounds(plan: PlanDef): Rect4 {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of plan.slabs) {
    x0 = Math.min(x0, s[0]); y0 = Math.min(y0, s[1]); x1 = Math.max(x1, s[2]); y1 = Math.max(y1, s[3]);
  }
  return [x0, y0, x1, y1];
}
