import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, HardHat, MapPin, Phone } from 'lucide-react';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import WhatsAppButton from '@/components/whatsapp/WhatsAppButton';
import GroupShell from '@/components/group/GroupShell';
import { HOSPITAL as h, telHref } from '@/data/group';

export const metadata: Metadata = {
  title: `${h.name} ${h.town} | 150-Bed Hospital, Opening ${h.opening}`,
  description: h.intro,
  alternates: { canonical: 'https://vgrandgroup.com/hospital/ongole' },
};

/** The hospital is still being built: a "coming soon" page in the V Grand Infra style. */
export default function HospitalPage() {
  return (
    <GroupShell name={h.name} place={h.town} phone={h.phone} address={h.address} mapsHref={null}>
      <PageHero
        eyebrow={`${h.status} · Opening ${h.opening}`}
        title={<>{h.name}, <span className="text-meadow-600">{h.town}</span></>}
        intro={h.intro}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={telHref(h.phone)} className="btn btn-primary"><Phone size={16} /> Call {h.phone}</a>
          <Link href={h.projectHref} className="btn btn-ghost">See the project <ArrowRight size={16} /></Link>
        </div>
      </PageHero>

      {/* feature card */}
      <section className="section !pt-6">
        <div className="container-x">
          <Reveal>
            <article className="card grid overflow-hidden lg:grid-cols-[1.35fr_1fr]">
              <div className="relative min-h-[280px] lg:min-h-[460px]">
                <Image src={h.concepts[0].src} alt={h.concepts[0].alt} fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
                <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-md bg-forest/85 px-3 py-2 text-[13px] text-white">
                  <HardHat size={16} /> Artist&apos;s impression · concept, not the final design
                </span>
              </div>
              <div className="flex flex-col p-7 md:p-10">
                <span className="w-fit rounded-md bg-amber-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">
                  {h.status}
                </span>
                <h2 className="mt-5 font-heading text-[clamp(30px,3.4vw,44px)] text-forest">{h.name}</h2>
                <p className="mt-2 flex items-start gap-2 text-[14px] !text-forest/70">
                  <MapPin size={16} className="mt-1 shrink-0 text-meadow-600" /> {h.address.join(', ')}
                </p>
                <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-forest/15 pt-7 text-[14px]">
                  {h.facts.map((f) => (
                    <div key={f.label}>
                      <dt className="text-[12px] uppercase tracking-[0.14em] text-forest/70">{f.label}</dt>
                      <dd className="mt-1 font-medium text-forest">{f.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-auto pt-8 !text-[13px] !text-forest/60">A project of {h.company}</p>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* numbers + build progress, on the forest band */}
      <section className="section bg-forest text-white">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <p className="eyebrow !text-meadow-400">Part of V Grand Groups</p>
            <h2 className="mt-4 font-heading text-white">Opening {h.opening}</h2>
            <p className="mt-6 !text-[17px] !text-white/75">
              Built by the team behind V Grand Infra homes, led by founder Vinod Kumar Talasila. Here is where the work stands today.
            </p>
          </Reveal>

          <ol className="mt-12 grid gap-6 md:grid-cols-4">
            {h.progress.map((s, i) => (
              <li key={s.step} className={`border-t-4 pt-4 ${s.done ? 'border-meadow-400' : s.now ? 'border-amber-400' : 'border-white/20'}`}>
                <span className="text-[12px] uppercase tracking-[0.16em] text-white/55">Step {i + 1}</span>
                <span className="mt-1 block font-heading text-[20px] leading-snug text-white">{s.step}</span>
                <span className={`mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold ${s.done ? 'text-meadow-400' : s.now ? 'text-amber-300' : 'text-white/45'}`}>
                  {s.done ? <><Check size={14} /> Done</> : s.now ? 'In progress now' : 'Coming up'}
                </span>
              </li>
            ))}
          </ol>

          <dl className="mt-14 grid grid-cols-2 gap-y-8 border-t border-white/20 pt-10 md:grid-cols-4">
            {[
              { v: h.beds, l: 'Beds' },
              { v: String(h.specialities.length), l: 'Specialities planned' },
              { v: '24×7', l: 'Emergency care' },
              { v: '2027', l: 'Opening at Dussehra' },
            ].map((x) => (
              <div key={x.l}>
                <dd className="font-heading text-[clamp(36px,4.4vw,56px)] leading-none text-white">{x.v}</dd>
                <dt className="mt-2 text-[13px] text-white/65">{x.l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* specialities: plain ruled list */}
      <section className="section">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <h2 className="font-heading text-forest">How it could look</h2>
            <p className="mt-4">
              Concept pictures made from the plan: a 150-bed ward block over a two-floor OPD and emergency wing. The final architect&apos;s design may differ.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {h.concepts.slice(1).map((c) => (
              <figure key={c.src}>
                <Image src={c.src} alt={c.alt} width={c.w} height={c.h} sizes="(max-width: 768px) 100vw, 50vw" className="w-full rounded-xl" />
                <figcaption className="mt-2 text-[13px] text-forest/60">Artist&apos;s impression</figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-20" />
          <Reveal className="max-w-2xl">
            <h2 className="font-heading text-forest">Specialities planned</h2>
            <p className="mt-4">The main care a family needs, under one roof in Ongole.</p>
          </Reveal>
          <ul className="mt-10 grid gap-x-14 border-t border-forest/25 md:grid-cols-2">
            {h.specialities.map((s) => (
              <li key={s.name} className="flex items-baseline justify-between gap-4 border-b border-forest/15 py-4">
                <span className="font-heading text-[20px] text-forest">{s.name}</span>
                <span lang="te" className="text-right text-[15px] text-forest/60">{s.te}</span>
              </li>
            ))}
          </ul>

          <Reveal className="mt-20 max-w-2xl">
            <h2 className="font-heading text-forest">A hospital for Ongole</h2>
          </Reveal>
          <div className="mt-12 grid gap-x-14 gap-y-10 md:grid-cols-3">
            {h.points.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.06}>
                <div className="border-t border-forest/25 pt-5">
                  <h3 className="font-heading text-[24px] text-forest">{p.title}</h3>
                  <p className="mt-3 !text-[16px]">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-[900px]">
            <WhatsAppButton variant="banner" phoneNumber={h.whatsapp} title={`Want an update when ${h.name} opens? Message us on WhatsApp.`} />
          </div>
        </div>
      </section>
    </GroupShell>
  );
}
