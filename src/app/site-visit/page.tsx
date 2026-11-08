import type { Metadata } from 'next';
import { CalendarCheck, MapPin, Phone, Clock } from 'lucide-react';
import PageHero from '@/components/ui/PageHero';
import LeadForm from '@/components/ui/LeadForm';
import Reveal from '@/components/ui/Reveal';
import { SITE_PHONE_DISPLAY, SITE_PHONE_TEL, SITE_ADDRESS_LINES, SITE_MAPS_URL, SITE_HOURS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Book a Site Visit | V Grand Infra Ongole',
  description:
    'Book a free site visit to see V Grand Infra projects in Ongole and Koppolu. Pick a date and time that suits you and our team will take you around.',
  alternates: { canonical: 'https://vgrandgroup.com/site-visit' },
};

const steps = [
  { n: '01', title: 'Pick a date', body: 'Choose the project, a day and a time slot that works for you.' },
  { n: '02', title: 'We confirm', body: 'Our team calls to confirm and shares the exact location.' },
  { n: '03', title: 'Walk the ground', body: "See the construction quality yourself and ask us anything — no pressure." },
];

export default function SiteVisitPage() {
  return (
    <>
      <PageHero
        title="Book a free site visit"
        intro="Walk any of our ongoing or upcoming projects in Ongole, look at the construction quality and talk to our team. No obligation."
      />

      <section className="section !pt-10">
        <div className="container-x grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <div className="card p-6 md:p-10">
              <h2 className="mb-8 font-heading !text-[30px] text-forest">Request your visit</h2>
              <LeadForm source="site_visit" withVisitSlot submitLabel="Book my visit" />
            </div>
          </Reveal>

          <div className="grid content-start gap-6">
            <Reveal delay={0.08}>
              <ol className="grid gap-5">
                {steps.map((s) => (
                  <li key={s.n} className="flex gap-5">
                    <span className="font-heading text-[34px] leading-none text-meadow-500/70">{s.n}</span>
                    <span>
                      <span className="block font-heading text-[20px] text-forest">{s.title}</span>
                      <span className="block text-[15px] text-forest/70">{s.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={0.16}>
              <div className="rounded-xl bg-forest p-7 text-white">
                <CalendarCheck className="text-meadow-400" size={28} />
                <h3 className="mt-4 font-heading text-[22px]">Prefer to talk first?</h3>
                <ul className="mt-5 grid gap-4 text-[14px] text-white/80">
                  <li className="flex gap-3"><Phone size={17} className="mt-0.5 shrink-0 text-meadow-400" /><a href={`tel:${SITE_PHONE_TEL}`} className="hover:text-white">{SITE_PHONE_DISPLAY}</a></li>
                  <li className="flex gap-3"><Clock size={17} className="mt-0.5 shrink-0 text-meadow-400" />{SITE_HOURS}</li>
                  <li className="flex gap-3"><MapPin size={17} className="mt-0.5 shrink-0 text-meadow-400" /><a href={SITE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">{SITE_ADDRESS_LINES.join(', ')}</a></li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
