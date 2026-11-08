import type { Metadata } from 'next';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import EmiCalculator from '@/components/emi/EmiCalculator';
import { bankPartners } from '@/data/banks';

export const metadata: Metadata = {
  title: 'Home Loan EMI Calculator | V Grand Infra Ongole',
  description:
    'Plan your home loan. Calculate the monthly EMI, total interest and total payable for flats in Ongole with V Grand Infra.',
  alternates: { canonical: 'https://vgrandgroup.com/emi-calculator' },
};

export default function EmiCalculatorPage() {
  return (
    <>
      <PageHero
        title="Home loan EMI calculator"
        intro="Move the sliders to see your monthly EMI and what you'll pay in total."
      />
      <section className="section !pt-10">
        <div className="container-x">
          <EmiCalculator />

          {/* Appears only once real bank partners are added in src/data/banks.ts */}
          {bankPartners.length > 0 && (
            <Reveal className="mt-16 text-center">
              <p className="eyebrow justify-center">Home loan partners</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
                {bankPartners.map((b) => (
                  <span key={b.name} className="font-heading text-[20px] text-forest/70">{b.name}</span>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
