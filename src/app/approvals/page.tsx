import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, BadgeCheck, ArrowUpRight, Hospital, Home, Building2 } from 'lucide-react';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import { approvals, buyerChecklist } from '@/data/approvals';
import { SITE_PHONE_TEL, SITE_PHONE_DISPLAY } from '@/lib/site';

export const metadata: Metadata = {
  title: 'RERA Registration & Approvals | V Grand Infra',
  description:
    'V Grand Infra and its projects — Elite Homes, Tripura, V Grand Gateway and V Grand Healthcare — are RERA registered. View registration details and what to check before you buy.',
  alternates: { canonical: 'https://vgrandgroup.com/approvals' },
};

const icon = { Company: Building2, Residential: Home, Healthcare: Hospital } as const;

export default function ApprovalsPage() {
  return (
    <>
      <PageHero
        eyebrow="Approvals & legal"
        title={<>Registered, transparent, <span className="italic text-meadow-600">verifiable.</span></>}
        intro="V Grand Infra is a RERA registered developer, and every one of our projects is registered with it. Here is everything in one place — so you can check it yourself."
      />

      <section className="section !pt-10">
        <div className="container-x">
          <Reveal className="mb-10 flex items-center gap-3 rounded-2xl bg-meadow/10 px-5 py-4 text-[15px] text-forest">
            <ShieldCheck className="shrink-0 text-meadow-600" size={22} />
            <span>V Grand Infra is the registered developer. Elite Homes, Tripura, V Grand Gateway and V Grand Healthcare are all registered under it.</span>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2">
            {approvals.map((a, i) => {
              const Icon = icon[a.kind];
              return (
                <Reveal key={a.entity} delay={(i % 2) * 0.07}>
                  <article className="card flex h-full flex-col gap-5 p-7">
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-white"><Icon size={22} /></span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-meadow/12 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-meadow-700">
                        <BadgeCheck size={14} /> RERA registered
                      </span>
                    </div>
                    <div>
                      <h2 className="font-heading !text-[26px] text-forest">{a.entity}</h2>
                      {a.note && <p className="mt-1 text-[14px] !text-forest/60">{a.note}</p>}
                    </div>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-forest/10 pt-5">
                      <div>
                        <span className="block text-[11px] uppercase tracking-[0.16em] text-forest/50">Registration no.</span>
                        {a.reraNo ? (
                          <span className="font-mono text-[17px] text-forest">{a.reraNo}</span>
                        ) : (
                          <span className="text-[14px] text-forest/60">Number being added — call us for a copy</span>
                        )}
                      </div>
                      {a.slug && (
                        <Link href={`/projects/${a.slug}`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-meadow-600 hover:underline underline-offset-4">
                          View project <ArrowUpRight size={14} />
                        </Link>
                      )}
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section bg-cream">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Before you buy</p>
            <h2 className="mt-4 font-heading text-forest">Four things to check on any property</h2>
            <p className="mt-4">Whoever you buy from, verify these. We are happy for you to check ours.</p>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {buyerChecklist.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.06}>
                <div className="card h-full p-6">
                  <span className="font-heading text-[34px] leading-none text-meadow-500/70">0{i + 1}</span>
                  <h3 className="mt-4 font-heading text-[20px] text-forest">{c.title}</h3>
                  <p className="mt-3 !text-[14px]">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12 text-center">
            <p className="!text-[15px]">Want a copy of any document? Call <a href={`tel:${SITE_PHONE_TEL}`} className="font-semibold text-forest underline underline-offset-4">{SITE_PHONE_DISPLAY}</a> or <Link href="/contact" className="font-semibold text-forest underline underline-offset-4">send us a message</Link>.</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
