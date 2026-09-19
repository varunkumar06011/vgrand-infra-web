import { getTour } from '@/data/tours';
import TourRoot from './TourRoot';

/**
 * Server Component — renders the crawlable tour block (heading, copy,
 * launch UI) and mounts the interactive client experience via TourRoot.
 * Renders nothing for slugs without a tour config.
 */
export default function ProjectTour({ slug }: { slug: string }) {
  const tour = getTour(slug);
  if (!tour) return null;

  return (
    <div role="region" aria-labelledby="virtual-tour-heading" style={{ marginBottom: 56 }}>
      <h2
        id="virtual-tour-heading"
        style={{
          fontFamily: 'var(--font-heading)',
          color: '#1a1a1a',
          fontSize: 28,
          marginBottom: 16,
          fontWeight: 700,
        }}
      >
        Virtual Tour: 3 BHK Flat at Elite Homes, Koppolu, Ongole
      </h2>
      <p style={{ fontSize: 16, lineHeight: 1.8, color: '#444', marginBottom: 24 }}>
        Walk through our {tour.flatLabel} ({tour.area}, {tour.facing}) room by room — from the
        entrance foyer and living room to the kitchen, bedrooms and balcony. Tap the arrows to move,
        follow the live floor plan, and check brochure specifications right on the photos.
      </p>

      <TourRoot tour={tour} />
    </div>
  );
}
