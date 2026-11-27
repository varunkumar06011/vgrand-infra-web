import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RestaurantPage from '@/components/group/RestaurantPage';
import { RESTAURANTS, type Restaurant } from '@/data/group';

type Params = { params: Promise<{ town: string }> };

const find = (town: string): Restaurant | undefined => RESTAURANTS[town as Restaurant['slug']];

export function generateStaticParams() {
  return Object.keys(RESTAURANTS).map((town) => ({ town }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const r = find((await params).town);
  if (!r) return {};
  return {
    title: `${r.name} ${r.town} | ${r.tagline} | Biryani, Indian & Chinese`,
    description: r.intro,
    alternates: { canonical: `https://vgrandgroup.com/restaurant/${r.slug}` },
  };
}

export default async function Page({ params }: Params) {
  const r = find((await params).town);
  if (!r) notFound();
  return <RestaurantPage r={r} />;
}
