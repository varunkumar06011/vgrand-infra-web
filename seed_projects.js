const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, serviceKey);

const projects = [
  {
    name: 'Elite Homes',
    slug: 'elite-homes',
    type: 'Luxury 3BHK Apartments',
    location: 'Koppolu, Ongole',
    status: 'Ongoing',
    description: 'V Grand Elite Homes is a premium residential project located in the rapidly developing area of Koppolu, Ongole. Designed for modern families, it offers spacious 3BHK flats with state-of-the-art amenities and excellent connectivity.',
    starting_price: '₹76 Lakhs*',
    area: '1771 - 1800 sq.ft',
    handover: 'December 2026',
    rera: 'Applied',
    images: ['/images/ban a.png'],
    highlights: [
      'Gated Community with 24/7 Security',
      'Strategic Location near Koppolu Bypass',
      'Premium 3BHK Layouts',
      'East & West Facing Options',
      'Quality Construction by V Grand Infra'
    ],
    amenities: [
      'Children\'s Play Area',
      'Power Backup',
      'Jogging Track',
      'Multipurpose Hall',
      'Rainwater Harvesting'
    ],
    specs: {
      "Structure": "R.C.C. Framed structure with high-quality earthquake resistant design.",
      "Walls": "Solid brick masonry with cement plastering.",
      "Flooring": "Premium Vitrified tiles for living and bedrooms.",
      "Kitchen": "Granite platform with stainless steel sink and ceramic wall tiles.",
      "Electrical": "Concealed copper wiring with modular switches."
    }
  },
  {
    name: 'V Grand Tripura',
    slug: 'v-grand-tripura',
    type: '2 BHK',
    location: 'Koppolu, Ongole',
    status: 'Ongoing',
    description: 'Tripura by V Grand Infra is a premium residential project in Koppolu, Ongole. Thoughtfully designed 2BHK homes offering 1198 sq.ft of well-planned living space, combining affordability with quality modern living.',
    starting_price: '₹36 Lakhs per unit',
    area: '1198 sq.ft',
    handover: '8 Months',
    rera: 'OMC Approved',
    images: ['/images/ban b.png'],
    highlights: [
      'Prime location in Koppolu, Ongole',
      '2 BHK units with 1198 sq.ft area',
      'Price: ₹36 Lakhs per unit',
      'Handover: 8 months',
      'OMC Approved',
      'Affordable premium living',
      'Quality construction materials',
      'Close to schools, hospitals and NH-16 highway'
    ],
    amenities: [
      '24x7 Security',
      'Power Backup',
      'Children Play Area',
      'Car Parking'
    ],
    specs: {
      "Structure": "RCC Framed Structure",
      "Flooring": "Vitrified tiles",
      "Windows": "UPVC windows",
      "Electrical": "Concealed copper wiring"
    }
  },
  {
    name: 'V Grand Gateway',
    slug: 'v-grand-gateway',
    type: '2 & 3 BHK Premium Flats',
    location: 'Koppolu, Ongole',
    status: 'Upcoming',
    description: 'Redefine your standard of living at V-Grand Gateway, a masterpiece of modern architecture designed for those who seek elegance, comfort, and unparalleled connectivity. Nestled near Dreams School in Koppolu, this project offers an effortless commute with direct proximity to the Express Highway. Every inch speaks of quality, with expansive layouts, premium finishes, and thoughtful sustainable design.',
    starting_price: 'Contact for details',
    area: '2 & 3 BHK',
    handover: 'Coming Soon',
    rera: 'Applied',
    images: ['/images/ban c (1).png'],
    brochure_url: '/brochures/VGrand Gatway_Brochure.pdf',
    highlights: [
      '2 BHK & 3 BHK premium luxurious residential flats',
      'Prime location in Koppolu, Ongole, near Dreams School',
      'Direct proximity to Express Highway',
      'RCC Framed Structure with premium construction',
      '9" outer & 4.5" inner AAC Block walls',
      'Teak main door with laminated internal doors',
      'Full body granite kitchen platform with steel sink',
      '24"x24" Vitrified tiles flooring',
      'UPVC windows with safety grills',
      'Modern lift of 6 passenger capacity',
      'Generator backup for lift and common lighting',
      'Concealed copper wiring with 3-phase power supply'
    ],
    amenities: [
      '24x7 Security',
      'Power Backup',
      'Lift',
      'Car Parking',
      'Children Play Area',
      'Modern Lift',
      'Generator Backup'
    ],
    specs: {
      "Structure": "RCC Framed Structure",
      "Walls": "9\" Thick outer and 4 ½\" thick inner AAC Block walls with cement mortar (1:6)",
      "Doors": "Main door are Teak doors, all other door shutters are laminated doors",
      "Kitchen": "Full body granite top with steel sink for the kitchen platform, Glazed tile dado upto 2’ height above kitchen platform",
      "Toilets": "Ceramic tile flooring of standard make in all toilets and glazed tile dado upto door height. Wall mixers with showers in toilets standard make. European WC’s and PVC pipes for sewerage lines of standard make, CPVC pipes for all inlet & External water lines",
      "Plastering": "Plastering with sponge finish in cement mortar",
      "Windows": "UPVC windows with safety grills",
      "Water Supply": "Overhead tank, Municipal water point in kitchen from overhead tank",
      "Flooring": "24\"x24\" Vitrified tiles flooring for hall, drawing, dining bedrooms and kitchen",
      "Telephone & Cable": "TV points in hall and bedrooms Provision for Internet",
      "Painting": "Luppam finishing in hall, drawing, dining and bedrooms with best branded emulsion, Enamel paint for grills",
      "Lift": "Modern Lift of 6 passengers capacity",
      "Generator": "Backup for lift, Common lighting",
      "Electrical": "Concealed copper wiring with adequate points in all rooms. A.C Points and two way switches will be provided in bedrooms. Modular switch board of standard make for electrical points, 3 phase power supply"
    }
  }
];

async function seedData() {
  console.log('Seeding projects data...');
  
  for (const project of projects) {
    console.log(`Upserting ${project.name}...`);
    const { data, error } = await supabase
      .from('projects')
      .upsert(project, { onConflict: 'slug' })
      .select();

    if (error) {
      console.error(`Error upserting ${project.name}:`, error.message);
    } else {
      console.log(`Successfully seeded ${project.name}`);
    }
  }
}

seedData();
