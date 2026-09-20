import type { TourText } from './types';

/**
 * Elite Homes tour — ALL display strings, keyed by language.
 *
 * `en` is the source of truth (text moved out of elite-homes.ts).
 * `te` lives in elite-homes.i18n.te.ts (draft, lazy-loaded).
 *
 * Placeholders: {room} {label} {a} {b} {dir} {date} {n} are substituted
 * at render time — keep them verbatim in every language.
 */

const FITOUT_EN =
  'Sample flat fit-out, not part of standard specification. Ask our team.';

const en: TourText = {
  meta: {
    flatLabel: '3 BHK sample flat',
    area: '1,771 sq ft',
    facing: 'East facing',
    disclaimer:
      'Sample flat images for reference. Furnishings and fit-outs shown may not form part of the standard specification.',
  },

  ui: {
    dialogLabel: 'Virtual tour',
    close: 'Close tour',
    previous: 'Previous: {room}',
    next: 'Next: {room}',
    finishTour: 'Finish tour',
    goToRoom: 'Go to {label}',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    gyroOn: 'Disable gyroscope look-around',
    gyroOff: 'Enable gyroscope look-around',
    floorPlan: 'Toggle floor plan',
    fullscreen: 'Toggle fullscreen',
    replayGuide: 'Replay the tour guide',
    openRoomList: 'Open room list',
    roomsTitle: 'Rooms',
    specTag: 'Specification',
    fitoutTag: 'Sample fit-out',
    closeCard: 'Close',
    exit: 'Exit',
    planCaption: 'East-facing plan',
    endHeading: 'Walkthrough complete',
    endTitle: 'You’ve seen the whole flat',
    endSubtitle: 'Like what you saw? Book a free site visit or get the full brochure.',
    chatWhatsApp: 'Chat on WhatsApp',
    bookVisit: 'Book a site visit',
    restartTour: 'Restart tour',
    guideTag: 'Tour guide',
    guideSkip: 'Skip',
    guideNext: 'Next',
    guideDone: 'Done',
    guideSteps: [
      'Welcome! Follow the red arrows on the photo to walk into the next room.',
      'Or use the side arrows — or your ← → keys — to step back and forward.',
      'Pulsing dots reveal brochure specs and notes about what you see.',
      'The floor plan follows you — tap any room to jump straight to it.',
      'Zoom in, tilt your phone to look around, or browse every room from here.',
      'That’s it — walk to the end for the brochure and a free site visit. Enjoy!',
    ],
    chooserTitle: 'How would you like to see the flat?',
    chooserSub: 'Walk through with our guided tour, or explore every room on your own.',
    guidedTour: 'Guided tour',
    explore: 'Explore yourself',
    play: 'Play',
    pause: 'Pause',
    prevScene: 'Previous scene',
    nextScene: 'Next scene',
    mute: 'Mute narration',
    unmute: 'Unmute narration',
    captionsOn: 'Hide captions',
    captionsOff: 'Show captions',
    stopExplore: 'Stop and explore',
    guidedTag: 'Guided tour',
    sceneOf: '{a} of {b}',
    compare: 'Compare',
    compareSlider: 'Before and after comparison',
    exitCompare: 'Close compare',
    variantBaseFurnishing: 'Empty',
    variantBaseLighting: 'Day',
    stagedBadge:
      'Virtual staging — illustration only. Furniture and decor are not included.',
    floorViews: 'View from your floor',
    facingChip: '{dir} facing',
    capturedNote:
      'View captured {date}. Surroundings may change with future development.',
    floorLabel: 'Floor {n}',
    floorAria: 'Choose a floor',
    whatsappMessage:
      "Hi V Grand Infra, I was viewing the {room} in the Elite Homes 3BHK virtual tour and I'd like to book a site visit.",
    roomsViewed: 'Rooms I viewed',
    posterCta: 'View Flat',
    posterSub: 'Walk room to room with photos, a live floor plan and spec hotspots.',
    posterAria: 'View the 3 BHK flat — open the virtual walkthrough',
    openAtRoom: 'Open the tour at {room}',
  },

  plan: {
    living: 'LIVING',
    kitchen: 'KITCHEN',
    puja: 'PUJA',
    'service-balcony': 'SERVICE',
    'bedroom-1': 'BED',
    dining: 'DINING',
    balcony: 'BALCONY',
    'toilet-1': 'WC',
    'toilet-2': 'WC',
    'bedroom-2': 'BED',
    'balcony-3ft': 'BAL',
    'toilet-3': 'WC',
    master: 'M.BED',
  },

  scenes: {
    entrance: {
      room: 'Entrance Foyer',
      title: 'Entrance foyer',
      zone: 'East',
      alt: 'Entrance foyer of the Elite Homes 3 BHK sample flat with a panelled feature wall and the opening to the living room',
      narration:
        'You step in from the east side into a small foyer. The panelled feature wall is a sample flat fit-out, not part of the standard specification. Just ahead is the living room.',
      links: { hall: 'Living room' },
      hotspots: {
        'feature-wall': { title: 'Panelled feature wall', body: FITOUT_EN },
      },
    },
    hall: {
      room: 'Living Room',
      title: 'Living room · 16\'9" × 12\'5"',
      zone: 'North-East',
      alt: 'Living room of the Elite Homes 3 BHK sample flat with fluted TV wall and cove ceiling lighting',
      narration:
        'The living room measures 16 feet 9 by 12 feet 5, on the north-east of the plan. Flooring is 24-inch vitrified tiles, the same as the dining, kitchen and bedrooms.',
      links: { dining: 'Dining' },
      hotspots: {
        flooring: {
          title: 'Flooring',
          body: '24"×24" vitrified tiles in the hall, dining, bedrooms and kitchen.',
        },
        'tv-wall': { title: 'TV unit & fluted panels', body: FITOUT_EN },
        ceiling: { title: 'False ceiling with cove lighting', body: FITOUT_EN },
      },
    },
    dining: {
      room: 'Dining Room',
      title: 'Dining · 14\'9" × 11\'0"',
      zone: 'South',
      alt: 'Dining area of the Elite Homes 3 BHK sample flat with sliding door to the balcony and a sideboard',
      narration:
        'The dining space is 14 feet 9 by 11 feet, on the south side. A sliding door opens to the balcony, and the kitchen is just to the east.',
      links: { 'balcony-view': 'Balcony', 'kitchen-a': 'Kitchen' },
      hotspots: {
        flooring: {
          title: 'Flooring',
          body: '24"×24" vitrified tiles in the hall, dining, bedrooms and kitchen.',
        },
        sideboard: { title: 'Sideboard', body: FITOUT_EN },
      },
    },
    'kitchen-a': {
      room: 'Kitchen',
      title: 'Kitchen · 9\'3" × 12\'5"',
      zone: 'South-East',
      alt: 'L-shaped kitchen of the Elite Homes 3 BHK sample flat with the service balcony door on the right',
      narration:
        'The kitchen is 9 feet 3 by 12 feet 5, in the south-east, with a service balcony beside it. The modular units and loft shown here are sample flat fit-outs.',
      links: { 'kitchen-b': 'Take a closer look', dining: 'Dining' },
      hotspots: {
        flooring: {
          title: 'Flooring',
          body: '24"×24" vitrified tiles in the hall, dining, bedrooms and kitchen.',
        },
        'kitchen-fitout': { title: 'Modular kitchen with loft', body: FITOUT_EN },
      },
    },
    'kitchen-b': {
      room: 'Kitchen',
      title: 'Kitchen — closer look',
      zone: 'South-East',
      alt: 'Close-up of the kitchen counter corner in the Elite Homes 3 BHK sample flat',
      narration:
        'A closer look at the kitchen counter. The platform top and tile dado specifications are still being confirmed, so please ask our team for the final list.',
      links: { 'kitchen-a': 'Back' },
      hotspots: {
        platform: {
          title: 'Kitchen platform',
          body: 'Full body quartz stone top with steel sink.',
        },
        dado: {
          title: 'Kitchen dado',
          body: "Glazed tile dado up to 2' above the kitchen platform.",
        },
        'kitchen-fitout': { title: 'Modular kitchen with loft', body: FITOUT_EN },
      },
    },
    'bedroom-1': {
      room: 'Bedroom 1',
      title: 'Bedroom · 11\'3" × 11\'0"',
      zone: 'North',
      alt: 'First bedroom of the Elite Homes 3 BHK sample flat with wardrobe and passage door',
      narration:
        'This bedroom is 11 feet 3 by 11 feet, on the north side. It has vitrified tile flooring; the wardrobe shown is part of the sample flat fit-out.',
      links: { hall: 'Living room' },
      hotspots: {
        flooring: {
          title: 'Flooring',
          body: '24"×24" vitrified tiles in the hall, dining, bedrooms and kitchen.',
        },
        wardrobe: { title: 'Wardrobe', body: FITOUT_EN },
      },
    },
    'master-bedroom': {
      room: 'Master Bedroom',
      title: 'Master bedroom · 14\'0" × 14\'0"',
      zone: 'South-West',
      alt: 'Master bedroom of the Elite Homes 3 BHK sample flat with wardrobe wall and window niche',
      narration:
        'The master bedroom is 14 feet square, in the south-west corner. Windows are UPVC with safety grills, and the wardrobe and window niche are sample flat fit-outs.',
      hotspots: {
        flooring: {
          title: 'Flooring',
          body: '24"×24" vitrified tiles in the hall, dining, bedrooms and kitchen.',
        },
        windows: { title: 'Windows', body: 'UPVC windows with safety grills.' },
        'wardrobe-niche': { title: 'Wardrobe & window niche', body: FITOUT_EN },
      },
    },
    'bedroom-3-balcony': {
      room: 'Bedroom 2',
      title: 'Bedroom · 11\'3" × 11\'4"',
      zone: 'North-West',
      alt: 'Second bedroom of the Elite Homes 3 BHK sample flat with wardrobe and sliding door to the balcony',
      narration:
        'The second bedroom is 11 feet 3 by 11 feet 4, in the north-west, with a sliding door that opens to its own small balcony.',
      links: { 'balcony-view': 'Balcony' },
      hotspots: {
        flooring: {
          title: 'Flooring',
          body: '24"×24" vitrified tiles in the hall, dining, bedrooms and kitchen.',
        },
        wardrobe: { title: 'Wardrobe', body: FITOUT_EN },
      },
    },
    'balcony-view': {
      room: 'Balcony',
      title: 'Balcony',
      zone: 'South',
      alt: 'View from the balcony of the Elite Homes 3 BHK sample flat',
      narration:
        "From the balcony you can look out over the surroundings. This photo was taken at the sample flat's level; the view from other floors will differ.",
      links: { dining: 'Dining' },
    },
    'entrance-inside': {
      room: 'Living Room',
      title: 'Back to the entrance',
      zone: 'East',
      alt: 'View from inside the Elite Homes 3 BHK sample flat looking back at the main door',
      narration:
        'Looking back at the main door — an imported door, while the other shutters are laminated. That completes the walkthrough of this 1,771 square foot, three bedroom flat.',
      links: { end: 'Finish tour' },
      hotspots: {
        door: {
          title: 'Main door',
          body: 'Imported main door. All other door shutters are laminated.',
        },
        windows: { title: 'Windows', body: 'UPVC windows with safety grills.' },
      },
    },
  },
};

export const eliteHomesEn: TourText = en;
