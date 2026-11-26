import { GATEWAY_SLUG, getTour } from '@/data/tours';
import FlatWalkthrough from '@/components/walkthrough/FlatWalkthrough';
import GatewayWalkthrough from '@/components/walkthrough/GatewayWalkthrough';

/**
 * Server Component — shows the 3D flat walkthrough for projects that have one: Elite Homes
 * (tour config) and V Grand Gateway (its two 2 BHK plans). Renders nothing for other slugs.
 */
export default function ProjectTour({ slug }: { slug: string }) {
  if (slug === GATEWAY_SLUG) {
    return (
      <div id="walkthrough" className="scroll-mt-24" role="region" aria-label="3D walkthrough of the 2 BHK flats at V Grand Gateway, Koppolu, Ongole">
        <GatewayWalkthrough />
      </div>
    );
  }
  if (!getTour(slug)) return null;

  return (
    <div id="walkthrough" className="scroll-mt-24" role="region" aria-label="3D walkthrough of the 3 BHK flat at Elite Homes, Koppolu, Ongole">
      <FlatWalkthrough />
    </div>
  );
}
