/**
 * Partner banks / lenders shown on the EMI calculator page and project pages.
 * The "Home loan partners" strip renders nothing while this is empty.
 * Add real partners only, e.g. { name: 'State Bank of India', logo: '/images/banks/sbi.svg' }.
 */
export interface BankPartner {
  name: string;
  logo?: string;
}

export const bankPartners: BankPartner[] = [];
