/*
 * V Grand Gateway — the two flat types on the typical floor, traced from
 * "Gate Way Floor Plan 01.pdf" (Mr. Design & Draft, 15.10.2026).
 *
 * Coordinates are in trace pixels: 52 px = 1 ft. x runs left→right across the sheet,
 * y top→bottom (north is to the LEFT on the sheet). The viewer converts to metres.
 * Wall gaps are [start, end, kind] along the wall's long axis.
 * Not on the plan, assumed: ceiling 10'-0", doors 7'-0", window sills 3'-0" (toilet vents 5'-0").
 */

export type GatewayRoomKey =
  | 'living' | 'livdin' | 'dining' | 'puja' | 'kitchen' | 'service'
  | 'passage' | 'master' | 'bed' | 'tbed' | 'tmaster' | 'balcony';

export type GatewayFloor = 'tile' | 'ktile' | 'wet' | 'balc' | 'marble' | 'wood';
export type GatewayGap = [number, number, 'door' | 'win' | 'vent' | 'slider'];
export type GatewayWall = [number, number, number, number, GatewayGap[]?, { h0?: number; h1?: number }?];

export type GatewayFlat = {
  id: '900' | '970';
  areaLabel: string;
  /** trace-pixel origin of the flat (its outer top-left corner) */
  ox: number;
  oy: number;
  outline: [number, number, number, number];
  /** [x, y, yaw] just inside the main door */
  spawn: [number, number, number];
  walls: GatewayWall[];
  /** door leaves in their open position as drawn: [hingeX, hingeY, endX, endY] */
  doors: [number, number, number, number][];
  floors: [number, number, number, number, GatewayFloor][];
  rooms: [GatewayRoomKey, string, number, number, number, number][];
  /** room order for "Show me" and for the room buttons */
  tour: GatewayRoomKey[];
};

export const GATEWAY_PX_PER_FT = 52;
export const GATEWAY_CEILING_FT = 10;

export const gatewayFlats: GatewayFlat[] = [
  {
    id: '900', areaLabel: '900 sq.ft', ox: 45, oy: 40, outline: [45, 40, 1830, 1388],
    spawn: [190, 190, Math.atan2(-1, -0.45)],
    walls: [
      [45, 40, 1830, 78, [[108, 253, 'door'], [443, 650, 'win'], [1275, 1480, 'win']]],
      [45, 78, 83, 1350, [[265, 470, 'win'], [755, 962, 'win']]],
      [1792, 78, 1830, 1350, [[622, 828, 'win']]],
      [45, 1350, 1830, 1388, [[697, 800, 'vent'], [928, 1030, 'vent']]],
      [875, 78, 893, 235], [1065, 78, 1083, 235], [893, 217, 1065, 235, [], { h0: 7 }],
      [1605, 78, 1622, 572, [[238, 355, 'door']]],
      [1083, 572, 1830, 590],
      [1083, 590, 1100, 1350, [[745, 888, 'door'], [960, 1080, 'door']]],
      [83, 700, 648, 720],
      [630, 720, 648, 1350, [[745, 888, 'door'], [960, 1080, 'door']]],
      [648, 915, 1083, 935],
      [857, 935, 875, 1350],
    ],
    doors: [[110, 60, 110, 200], [1613, 238, 1733, 238], [637, 748, 493, 748], [1093, 748, 1237, 748], [637, 962, 757, 962], [1093, 962, 972, 962]],
    floors: [
      [83, 78, 1792, 1350, 'tile'], [1083, 78, 1605, 572, 'ktile'], [893, 78, 1065, 217, 'marble'], [1622, 78, 1792, 572, 'wet'],
      [83, 720, 630, 1350, 'wood'], [1100, 590, 1792, 1350, 'wood'], [648, 935, 857, 1350, 'wet'], [875, 935, 1083, 1350, 'wet'],
    ],
    rooms: [
      ['livdin', `19'-3" × 12'-0"`, 83, 78, 1083, 700],
      ['puja', `4'-0" × 3'-0"`, 893, 78, 1065, 217],
      ['kitchen', `10'-0" × 9'-6"`, 1083, 78, 1605, 572],
      ['service', `4'-0" wide`, 1622, 78, 1792, 572],
      ['passage', '', 648, 700, 1083, 915],
      ['master', `13'-3" × 14'-7"`, 1100, 590, 1792, 1350],
      ['bed', `10'-6" × 12'-1"`, 83, 720, 630, 1350],
      ['tbed', `8'-0" × 4'-0"`, 648, 935, 857, 1350],
      ['tmaster', `8'-0" × 4'-0"`, 875, 935, 1083, 1350],
    ],
    tour: ['livdin', 'puja', 'kitchen', 'service', 'master', 'tmaster', 'bed', 'tbed'],
  },
  {
    id: '970', areaLabel: '970 sq.ft', ox: 45, oy: 43, outline: [45, 43, 1830, 1508],
    spawn: [724, 1380, 0],
    walls: [
      [603, 43, 1830, 82, [[1255, 1462, 'win']]],
      [45, 43, 603, 51, [], { h1: 3.5 }], [45, 51, 53, 407, [], { h1: 3.5 }],
      [45, 407, 83, 1470, [[478, 688, 'win'], [1175, 1280, 'vent']]],
      [1792, 82, 1830, 1470, [[562, 665, 'vent'], [800, 1008, 'win']]],
      [45, 1470, 1830, 1508, [[648, 800, 'door']]],
      [83, 407, 603, 445],
      [603, 43, 622, 1470, [[165, 322, 'slider'], [518, 663, 'door']]],
      [83, 1138, 390, 1158],
      [370, 1158, 390, 1470, [[1205, 1330, 'door']]],
      [832, 82, 852, 258], [1062, 82, 1083, 258], [852, 238, 1062, 258, [], { h0: 7 }],
      [1603, 82, 1622, 493, [[238, 358, 'door']]],
      [1248, 493, 1830, 515],
      [1248, 515, 1268, 1470, [[830, 985, 'door']]],
      [1268, 722, 1792, 742, [[1445, 1567, 'door']]],
      [840, 722, 1248, 742],
    ],
    doors: [[655, 1496, 655, 1352], [615, 522, 470, 522], [385, 1210, 263, 1210], [1610, 240, 1730, 240], [1445, 732, 1445, 612], [1258, 835, 1402, 835]],
    floors: [
      [83, 82, 1792, 1470, 'tile'], [53, 51, 603, 407, 'balc'], [1083, 82, 1603, 493, 'ktile'], [852, 82, 1062, 238, 'marble'],
      [1622, 82, 1792, 493, 'wet'], [83, 445, 603, 1138, 'wood'], [390, 1138, 603, 1470, 'wood'], [83, 1158, 370, 1470, 'wet'],
      [1268, 515, 1792, 722, 'wet'], [1268, 742, 1792, 1470, 'wood'],
    ],
    rooms: [
      ['living', `12'-0" × 14'-0"`, 622, 742, 1248, 1470],
      ['dining', `12'-0" × 9'-0"`, 622, 82, 1248, 742],
      ['puja', `4'-0" × 3'-0"`, 852, 82, 1062, 238],
      ['kitchen', `10'-0" × 8'-0"`, 1083, 82, 1603, 493],
      ['service', `4'-0" wide`, 1622, 82, 1792, 493],
      ['balcony', `10'-0" × 7'-0"`, 53, 51, 603, 407],
      ['bed', `10'-0" × 13'-4"`, 83, 445, 603, 1470],
      ['tbed', `5'-6" × 6'-0"`, 83, 1158, 370, 1470],
      ['master', `10'-1" × 14'-0"`, 1268, 742, 1792, 1470],
      ['tmaster', `10'-1" × 4'-0"`, 1268, 515, 1792, 722],
    ],
    tour: ['living', 'dining', 'puja', 'kitchen', 'service', 'master', 'tmaster', 'bed', 'tbed', 'balcony'],
  },
];

export type GatewayLang = 'en' | 'te';

export const gatewayText: Record<GatewayLang, {
  flat: Record<'900' | '970', string>;
  showMe: string; myself: string; top: string; walk: string; touring: string;
  outside: string; whole: string; langSwitch: string; help: string; close: string; map: string;
  introTitle: string; step1: string; step2: string; step3: string;
  rooms: Record<GatewayRoomKey, string>;
}> = {
  en: {
    flat: { '900': '2 bedroom flat', '970': '2 bedroom + balcony' },
    showMe: 'Show me', myself: "I'll look myself", top: 'Top view', walk: 'Walk inside',
    touring: 'Showing the house', outside: 'Outside the flat', whole: 'Whole flat from the top',
    langSwitch: 'తెలుగు', help: 'How to use', close: 'Close 3D walkthrough', map: 'Map · orange dot is you',
    introTitle: 'Walk through your new home',
    step1: 'Drag the screen to look around', step2: 'Press the arrow buttons to walk', step3: 'Tap a room at the bottom to go there',
    rooms: {
      living: 'Hall', livdin: 'Hall & dining', dining: 'Dining', puja: 'Puja room', kitchen: 'Kitchen', service: 'Utility',
      passage: 'Passage', master: 'Master bedroom', bed: 'Bedroom', tbed: 'Bathroom (bedroom)', tmaster: 'Bathroom (master)', balcony: 'Balcony',
    },
  },
  te: {
    flat: { '900': '2 బెడ్‌రూమ్ ఫ్లాట్', '970': '2 బెడ్‌రూమ్ + బాల్కనీ' },
    showMe: 'నాకు చూపించు', myself: 'నేనే చూస్తాను', top: 'పై నుండి చూడు', walk: 'లోపల నడువు',
    touring: 'ఇల్లు చూపిస్తున్నాం', outside: 'ఫ్లాట్ బయట', whole: 'ఫ్లాట్ మొత్తం పై నుండి',
    langSwitch: 'English', help: 'ఎలా వాడాలి', close: '3D వాక్‌త్రూ మూసివేయండి', map: 'మ్యాప్ · నారింజ చుక్క మీరే',
    introTitle: 'మీ కొత్త ఇంటిలో నడిచి చూడండి',
    step1: 'చుట్టూ చూడటానికి స్క్రీన్‌ను వేలితో లాగండి', step2: 'నడవడానికి బాణం బటన్లు నొక్కండి', step3: 'ఆ గదికి వెళ్ళడానికి కింద ఉన్న గది పేరు నొక్కండి',
    rooms: {
      living: 'హాల్', livdin: 'హాల్ & డైనింగ్', dining: 'డైనింగ్', puja: 'పూజ గది', kitchen: 'వంటగది', service: 'యుటిలిటీ',
      passage: 'దారి', master: 'మాస్టర్ బెడ్‌రూమ్', bed: 'బెడ్‌రూమ్', tbed: 'బాత్‌రూమ్ (బెడ్‌రూమ్)', tmaster: 'బాత్‌రూమ్ (మాస్టర్)', balcony: 'బాల్కనీ',
    },
  },
};

export const GATEWAY_SLUG = 'v-grand-gateway';
