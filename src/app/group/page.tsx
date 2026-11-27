import type { Metadata } from 'next';
import Image from 'next/image';
import GroupChooser from '@/components/group/GroupChooser';

export const metadata: Metadata = {
  title: 'V Grand Groups | Infra, Hospital & Restaurants in Ongole and Kandukur',
  description:
    'Choose a V Grand business: V Grand Infra (flats in Koppolu, Ongole), V Grand Hospital Ongole, and V Grand Restaurant in Ongole and Kandukur.',
  alternates: { canonical: 'https://vgrandgroup.com/group' },
};

export default function GroupPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-forest px-5 pb-16 pt-[120px] md:px-8 lg:pt-[150px]">
      <Image src="/images/earth/hills.webp" alt="" fill priority className="object-cover object-bottom opacity-25" />
      <div className="container-x relative">
        <p className="font-heading text-[clamp(26px,3.2vw,36px)] font-semibold leading-tight text-white">
          V Grand <span className="text-meadow-400">Groups</span>
        </p>
        <h1 className="mt-6 max-w-2xl text-white">Where would you like to go?</h1>
        <p lang="te" className="mt-3 text-xl text-white/80">మీరు ఎక్కడికి వెళ్లాలనుకుంటున్నారు?</p>
        <GroupChooser />
      </div>
    </div>
  );
}
