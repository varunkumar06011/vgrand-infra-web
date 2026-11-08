export interface Approval {
  entity: string;
  kind: 'Company' | 'Residential' | 'Healthcare';
  /** RERA registration number. Leave undefined until the real number is supplied — never guess. */
  reraNo?: string;
  slug?: string;
  note?: string;
}

/**
 * RERA registrations. V Grand Infra is the registered developer; each project is registered
 * under it. Add `reraNo` for each entry as the numbers are confirmed.
 */
export const approvals: Approval[] = [
  { entity: 'V Grand Infra', kind: 'Company', note: 'Registered real estate developer' },
  { entity: 'Elite Homes', kind: 'Residential', reraNo: 'P08440065656', slug: 'elite-homes', note: '3 BHK gated community, Koppolu' },
  { entity: 'Tripura', kind: 'Residential', slug: 'tripura', note: '2 BHK apartments, Koppolu' },
  { entity: 'V Grand Gateway', kind: 'Residential', slug: 'v-grand-gateway', note: '2 & 3 BHK premium flats' },
  { entity: 'V Grand Healthcare', kind: 'Healthcare', slug: 'v-grand-healthcare', note: 'Hospital, Ongole' },
];

export const buyerChecklist = [
  { title: 'RERA registration', body: 'Confirm the project number on the official state RERA portal before you pay any booking amount.' },
  { title: 'Clear title & land documents', body: 'Ask for the sale deed, encumbrance certificate and land-use details. We share these openly with serious buyers.' },
  { title: 'Approved plans', body: 'Check the sanctioned building plan and local-authority approvals match what is being built.' },
  { title: 'Agreement of sale', body: 'Read the payment schedule, handover date and specifications in writing before signing.' },
];
