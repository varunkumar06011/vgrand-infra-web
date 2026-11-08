export interface Testimonial {
  name: string;
  project: string;
  quote: string;
  /** Optional: e.g. "Elite Homes resident". */
  role?: string;
}

/**
 * Real customer quotes only. The homepage "Happy families" section renders nothing while this
 * array is empty — add entries here (with the customer's permission) and it appears automatically.
 */
export const testimonials: Testimonial[] = [];
