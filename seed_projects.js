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
    images: ['/images/elite-homes.jpg', '/images/swimming pool elite .png'],
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
    type: 'Luxury Villa Plots',
    location: 'Surareddypalem, Ongole',
    status: 'Upcoming',
    description: 'V Grand Tripura offers beautifully landscaped luxury villa plots at Surareddypalem. This DTCP approved layout provides a peaceful living environment with wide roads, greenery, and modern infrastructure, making it an ideal investment for your dream home.',
    starting_price: '₹22,000 per sq.yd',
    area: '150 - 500 sq.yds',
    handover: 'Ready to Construct',
    rera: 'DTCP Approved',
    images: ['/images/tripura.jpg'],
    highlights: [
      'DTCP Approved Layout',
      '40ft & 33ft Wide Internal Roads',
      'Clear Title & Immediate Registration',
      'Underground Drainage & Water Supply',
      'Avenue Plantation'
    ],
    amenities: [
      'Children\'s Park',
      'Street Lighting',
      'Compound Wall for Entire Layout',
      'Overhead Tank',
      'Security Post'
    ],
    specs: {
      "Layout": "Approved DTCP layout with clear documentation.",
      "Roads": "Well-paved Black Top (BT) roads.",
      "Drainage": "Comprehensive underground drainage system.",
      "Greenery": "Dedicated park areas and tree-lined roads."
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
