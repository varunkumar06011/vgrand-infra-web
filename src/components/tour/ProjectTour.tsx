import { getTour } from '@/data/tours';
import FlatWalkthrough from '@/components/walkthrough/FlatWalkthrough';

/**
 * Server Component — shows the 3D flat walkthrough for projects that have a
 * tour config. Renders nothing for other slugs.
 */
export default function ProjectTour({ slug }: { slug: string }) {
  if (!getTour(slug)) return null;

  return (
    <div role="region" aria-label="3D walkthrough of the 3 BHK flat at Elite Homes, Koppolu, Ongole">
      <FlatWalkthrough />
    </div>
  );
}
