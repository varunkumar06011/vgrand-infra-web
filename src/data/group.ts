/**
 * V Grand Groups: the two restaurants, the hospital (coming soon) and the /group chooser.
 *
 * Details come from the TL's form (26 Nov 2026); restaurant photos from Google Maps (27 Nov). The owner/about text reuses the founder details from the Infra site and
 * can be edited here.
 */

export type Fact = { label: string; value: string };
export type Point = { title: string; body: string };
export type Faq = { q: string; a: string };
/** w/h are the real pixel sizes of the file under /public */
export type Photo = { src: string; alt: string; w: number; h: number };

export type Restaurant = {
  slug: 'ongole' | 'kandukur';
  name: string;
  town: string;
  status: string;
  tagline: string;
  intro: string;
  about: string;
  address: string[];
  /** Google Maps link from the TL */
  maps: string;
  phone: string;
  /** digits with country code */
  whatsapp: string;
  instagram: string | null;
  /** main photo, shown in the feature card */
  image: Photo | null;
  /** more photos, shown in the gallery */
  gallery: Photo[];
  facts: Fact[];
  numbers: { value: string; label: string }[];
  points: Point[];
  specialities: { name: string; te: string }[];
  spaces: string[];
  services: string[];
  faqs: Faq[];
};

const TIMINGS = '10 AM – 11 PM, every day';

export const RESTAURANTS: Record<Restaurant['slug'], Restaurant> = {
  ongole: {
    slug: 'ongole',
    name: 'V Grand Restaurant',
    town: 'Ongole',
    status: 'Open every day',
    tagline: 'Raja of Biryanis',
    intro: 'The Raja of Biryanis on Guntur Road, Ongole. Indian, Chinese and tandoori food, served in AC dining rooms since 2018.',
    about:
      'V Grand Restaurant opened in Ongole in 2018 and is part of V Grand Groups, led by founder Vinod Kumar Talasila. The same care that goes into V Grand homes goes into our kitchen: biryanis cooked the way Ongole likes them, clean AC dining, and rooms for families, functions and business meetings.',
    address: ['Guntur Rd, opp. TDP Office, Gopal Nagar', 'Ongole, Andhra Pradesh 523001'],
    maps: 'https://maps.app.goo.gl/LG4ofyhNybnmZzdWA',
    phone: '+91 93917 98370',
    whatsapp: '919391798370',
    instagram: 'https://www.instagram.com/vgrand_lounge/',
    // Photos: the building and banquet hall were posted on Google Maps by V Grand itself; the
    // others were posted there by customers. Swap in V Grand's own photos before launch.
    image: { src: '/images/group/ongole/building.webp', alt: 'V Grand Restaurant building on Guntur Road, Ongole', w: 722, h: 528 },
    gallery: [
      { src: '/images/group/ongole/banquet-hall.webp', alt: 'Banquet and function hall set for an event', w: 722, h: 326 },
      { src: '/images/group/ongole/dining-hall.webp', alt: 'AC dining hall with a long table set for a party', w: 722, h: 950 },
      { src: '/images/group/ongole/interior.webp', alt: 'Restaurant interior with a decorated idol and flower rangoli', w: 722, h: 950 },
      { src: '/images/group/ongole/mocktail.webp', alt: 'A green mint mocktail with lemon', w: 600, h: 1030 },
    ],
    facts: [
      { label: 'Food', value: 'Indian, Chinese, Tandoori, Biryanis' },
      { label: 'Timings', value: TIMINGS },
      { label: 'Serving since', value: '2018' },
      { label: 'Order on', value: 'Swiggy, Zomato, phone' },
    ],
    numbers: [
      { value: '2018', label: 'Serving Ongole since' },
      { value: '7', label: 'Days a week, 10 AM – 11 PM' },
      { value: '5', label: 'Dining spaces, from AC hall to function hall' },
      { value: '2', label: 'Branches: Ongole and Kandukur' },
    ],
    points: [
      { title: 'Raja of Biryanis', body: 'Rambo, Raju Gari Kodi and Ajantha biryanis are the reason people keep coming back.' },
      { title: 'Indian, Chinese & tandoori', body: 'From starters and tandoori to fried rice and curries, there is something for everyone at the table.' },
      { title: 'Rooms for every occasion', body: 'AC dining, private dining rooms, a conference room and a function hall for parties and family events.' },
      { title: 'Eat in or order home', body: 'Takeaway, home delivery, and orders on Swiggy and Zomato, with parking when you visit.' },
    ],
    specialities: [
      { name: 'Rambo Biryani', te: 'రాంబో బిర్యానీ' },
      { name: 'Raju Gari Kodi Biryani', te: 'రాజు గారి కోడి బిర్యానీ' },
      { name: 'Ajantha Biryani', te: 'అజంతా బిర్యానీ' },
      { name: 'V Grand Special Chicken Fried Rice', te: 'వి గ్రాండ్ స్పెషల్ చికెన్ ఫ్రైడ్ రైస్' },
    ],
    spaces: ['AC dining hall', 'Private dining rooms', 'Conference room', 'Function hall', 'Bar (AC and non-AC)'],
    services: ['Takeaway', 'Home delivery', 'Swiggy', 'Zomato', 'Party orders', 'Parking'],
    faqs: [
      { q: 'Where is V Grand Restaurant in Ongole?', a: 'On Guntur Road, opposite the TDP Office, Gopal Nagar, Ongole 523001. Tap "Directions" to open it in Google Maps.' },
      { q: 'What are the timings?', a: 'We are open every day from 10 AM to 11 PM.' },
      { q: 'Can I book the function hall or a private room?', a: 'Yes. We have a function hall, private dining rooms and a conference room. Call or WhatsApp +91 93917 98370 with the date and number of guests.' },
      { q: 'Do you deliver?', a: 'Yes, by home delivery, or order on Swiggy and Zomato. Takeaway is also available.' },
      { q: 'Is there parking?', a: 'Yes, there is parking at the restaurant.' },
    ],
  },
  kandukur: {
    slug: 'kandukur',
    name: 'V Grand Restaurant',
    town: 'Kandukur',
    status: 'Open every day',
    tagline: 'Raja of Biryanis, now in Kandukur',
    intro: 'The V Grand biryanis, now near the Kandukur bus stand. AC dine-in, a curry point, takeaway and home delivery.',
    about:
      'Our Kandukur branch opened in 2025, bringing the V Grand kitchen from Ongole closer to Kandukur families. It is part of V Grand Groups, led by founder Vinod Kumar Talasila, with the same biryanis, the same care and an easy spot near the bus stand.',
    address: ['Near Bus Stand, Kovur', 'Kandukur, Andhra Pradesh 523105'],
    maps: 'https://maps.app.goo.gl/Kj8eQR1MFJWia56D7',
    phone: '+91 93917 98370',
    whatsapp: '919391798370',
    instagram: 'https://www.instagram.com/vgrandkandukur/',
    // Photos were posted on Google Maps by customers; swap in V Grand's own photos before launch.
    image: { src: '/images/group/kandukur/building.webp', alt: 'V Grand family restaurant building near the bus stand, Kandukur', w: 722, h: 402 },
    gallery: [
      { src: '/images/group/kandukur/takeaway.webp', alt: 'V Grand takeaway and ice cream counter, Kandukur', w: 722, h: 400 },
      { src: '/images/group/kandukur/food.webp', alt: 'Tandoori chicken starter on a black plate', w: 722, h: 538 },
    ],
    facts: [
      { label: 'Food', value: 'Indian, Chinese, Tandoori, Biryanis' },
      { label: 'Timings', value: TIMINGS },
      { label: 'Serving since', value: '2025' },
      { label: 'Order on', value: 'Swiggy, phone' },
    ],
    numbers: [
      { value: '2025', label: 'Serving Kandukur since' },
      { value: '7', label: 'Days a week, 10 AM – 11 PM' },
      { value: '5', label: 'Signature dishes' },
      { value: '2', label: 'Branches: Ongole and Kandukur' },
    ],
    points: [
      { title: 'Raja of Biryanis', body: 'Paradise, Rambo, Ajantha and Paneer Mushroom biryanis, cooked the V Grand way.' },
      { title: 'AC dine-in', body: 'A cool, clean AC dining hall to sit down with family and friends.' },
      { title: 'Curry Point', body: 'Pick up fresh curries for home from our curry point.' },
      { title: 'Order home', body: 'Takeaway, home delivery, party orders and Swiggy, with parking when you visit.' },
    ],
    specialities: [
      { name: 'Paradise Biryani', te: 'ప్యారడైజ్ బిర్యానీ' },
      { name: 'Rambo Biryani', te: 'రాంబో బిర్యానీ' },
      { name: 'Ajantha Biryani', te: 'అజంతా బిర్యానీ' },
      { name: 'Paneer Mushroom Biryani', te: 'పనీర్ మష్రూమ్ బిర్యానీ' },
      { name: 'Badam Milk', te: 'బాదం మిల్క్' },
    ],
    spaces: ['AC dine-in', 'Curry Point'],
    services: ['Takeaway', 'Home delivery', 'Swiggy', 'Party orders', 'Parking'],
    faqs: [
      { q: 'Where is V Grand Restaurant in Kandukur?', a: 'Near the bus stand, Kovur, Kandukur 523105. Tap "Directions" to open it in Google Maps.' },
      { q: 'What are the timings?', a: 'We are open every day from 10 AM to 11 PM.' },
      { q: 'Do you take party orders?', a: 'Yes. Call or WhatsApp +91 93917 98370 with the date and number of people.' },
      { q: 'Do you deliver?', a: 'Yes, by home delivery, or order on Swiggy. Takeaway is also available.' },
      { q: 'Is there parking?', a: 'Yes, there is parking at the restaurant.' },
    ],
  },
};

/** Hospital: construction not started yet (same project as /projects/v-grand-healthcare). */
export const HOSPITAL = {
  name: 'V Grand Healthcare',
  town: 'Ongole',
  company: 'V Grand Healthcare Pvt Ltd',
  status: 'Coming soon',
  opening: 'Dussehra 2027',
  beds: '150',
  intro:
    'A 150-bed hospital coming up in Bhagyanagar, Ongole, planned to open at Dussehra 2027. Everyday and emergency care for families across Prakasam district, close to home.',
  /** concept renders made from the TL's details (150 beds); not the final architect's design */
  concepts: [
    { src: '/images/group/hospital/concept-front.webp', alt: "Artist's impression of V Grand Healthcare: a white ward block with a V Grand Healthcare sign above a two-storey OPD and emergency wing", w: 1600, h: 1000 },
    { src: '/images/group/hospital/concept-aerial.webp', alt: "Artist's impression from above, showing the hospital, entrance canopy, emergency bay, parking and trees", w: 1600, h: 1000 },
    { src: '/images/group/hospital/concept-entrance.webp', alt: "Artist's impression of the main entrance and OPD canopy", w: 1600, h: 1000 },
  ],
  address: ['Opp. Sai ITA Convention Hall, Near ACB Office', 'Bhagyanagar, Ongole, Andhra Pradesh'],
  phone: '+91 90301 43333',
  whatsapp: '919030143333',
  projectHref: '/projects/v-grand-healthcare',
  facts: [
    { label: 'Beds', value: '150' },
    { label: 'Opening', value: 'Dussehra 2027' },
    { label: 'Status', value: 'Construction starting soon' },
    { label: 'Location', value: 'Bhagyanagar, Ongole' },
  ] as Fact[],
  /** planned; to be confirmed as the hospital nears opening */
  specialities: [
    { name: 'General Medicine', te: 'జనరల్ మెడిసిన్' },
    { name: 'General Surgery', te: 'జనరల్ సర్జరీ' },
    { name: 'Obstetrics & Gynaecology', te: 'ప్రసూతి & స్త్రీ వైద్యం' },
    { name: 'Paediatrics', te: 'పిల్లల వైద్యం' },
    { name: 'Orthopaedics', te: 'ఎముకల వైద్యం' },
    { name: 'ENT', te: 'చెవి, ముక్కు, గొంతు' },
    { name: 'Ophthalmology', te: 'కంటి వైద్యం' },
    { name: 'Dermatology', te: 'చర్మ వైద్యం' },
    { name: 'Dental', te: 'దంత వైద్యం' },
    { name: '24×7 Emergency', te: 'అత్యవసర వైద్యం' },
  ],
  points: [
    { title: 'Built by V Grand', body: 'Designed and built by the team behind V Grand Infra homes, with the same care for quality construction.' },
    { title: 'Care close to home', body: 'Good everyday and emergency care in Ongole itself, so families do not have to travel to bigger cities.' },
    { title: 'For the whole family', body: 'From check-ups and childbirth to surgery and fractures, the main specialities a family needs under one roof.' },
  ] as Point[],
  /** where the build is; update as work moves on */
  progress: [
    { step: 'Design and planning', done: false, now: true },
    { step: 'Construction', done: false, now: false },
    { step: 'Interiors and equipment', done: false, now: false },
    { step: 'Opening: Dussehra 2027', done: false, now: false },
  ],
};

export type GroupBusiness = {
  id: 'infra' | 'hospital-ongole' | 'restaurant-ongole' | 'restaurant-kandukur';
  href: string;
  kind: 'infra' | 'hospital' | 'restaurant';
  name: string;
  te: string;
  place: string;
  text: string;
  badge?: string;
  photo: Photo;
};

/** The businesses on the /group chooser, in display order. */
export const GROUP_BUSINESSES: GroupBusiness[] = [
  {
    id: 'infra',
    href: '/',
    kind: 'infra',
    name: 'V Grand Infra',
    te: 'వి గ్రాండ్ ఇన్‌ఫ్రా',
    place: 'Koppolu, Ongole',
    text: 'Gated-community flats and homes: Elite Homes, Tripura and V Grand Gateway.',
    photo: { src: '/images/elite-homes.jpg', alt: 'Elite Homes by V Grand Infra, Koppolu', w: 1920, h: 869 },
  },
  {
    id: 'hospital-ongole',
    href: '/hospital/ongole',
    kind: 'hospital',
    name: 'V Grand Healthcare',
    te: 'వి గ్రాండ్ హెల్త్‌కేర్',
    place: 'Ongole',
    text: 'A 150-bed hospital coming up in Bhagyanagar, Ongole, planned to open at Dussehra 2027.',
    badge: 'Coming soon',
    photo: { src: '/images/group/hospital/concept-front.webp', alt: "Artist's impression of V Grand Healthcare", w: 1600, h: 1000 },
  },
  {
    id: 'restaurant-ongole',
    href: '/restaurant/ongole',
    kind: 'restaurant',
    name: 'V Grand Restaurant',
    te: 'వి గ్రాండ్ రెస్టారెంట్',
    place: 'Ongole',
    text: 'Raja of Biryanis on Guntur Road since 2018, with AC dining and a function hall.',
    photo: { src: '/images/group/ongole/building.webp', alt: 'V Grand Restaurant building, Ongole', w: 722, h: 528 },
  },
  {
    id: 'restaurant-kandukur',
    href: '/restaurant/kandukur',
    kind: 'restaurant',
    name: 'V Grand Restaurant',
    te: 'వి గ్రాండ్ రెస్టారెంట్',
    place: 'Kandukur',
    text: 'V Grand biryanis near the Kandukur bus stand, with AC dine-in and a curry point.',
    photo: { src: '/images/group/kandukur/building.webp', alt: 'V Grand Restaurant building, Kandukur', w: 722, h: 402 },
  },
];

export const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, '')}`;
export const waHref = (num: string) => `https://wa.me/${num}`;
