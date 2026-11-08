export interface NavProject {
  slug: string;
  name: string;
  note: string;
  group: 'Ongoing' | 'Upcoming';
}

/** Static list for the Projects dropdown (kept independent of the DB so the menu never breaks). */
export const navProjects: NavProject[] = [
  { slug: 'elite-homes', name: 'Elite Homes', note: '3 BHK gated community · Koppolu', group: 'Ongoing' },
  { slug: 'tripura', name: 'Tripura', note: 'Affordable 2 BHK · Koppolu', group: 'Ongoing' },
  { slug: 'v-grand-healthcare', name: 'V Grand Healthcare', note: 'Hospital · Ongole', group: 'Ongoing' },
  { slug: 'v-grand-gateway', name: 'V Grand Gateway', note: '2 & 3 BHK premium flats', group: 'Upcoming' },
];

export const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Projects', href: '/projects', dropdown: true },
  { name: 'About', href: '/about' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'Approvals', href: '/approvals' },
  { name: 'EMI Calculator', href: '/emi-calculator' },
  { name: 'Contact', href: '/contact' },
] as const;
