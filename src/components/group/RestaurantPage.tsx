import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Camera, Check, ImageIcon, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import GroupShell from './GroupShell';
import { RESTAURANTS, telHref, waHref, type Restaurant } from '@/data/group';

function ActionButtons({ r }: { r: Restaurant }) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <a href={telHref(r.phone)} className="btn btn-primary"><Phone size={16} /> Call {r.phone}</a>
      <a href={waHref(r.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
        <MessageCircle size={16} /> WhatsApp
      </a>
      <a href={r.maps} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
        <Navigation size={16} /> Directions
      </a>
      {r.instagram && (
        <a href={r.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
          <Camera size={16} /> Instagram
        </a>
      )}
    </div>
  );
}

/** One restaurant branch, laid out like the V Grand Infra pages (earth design). */
export default function RestaurantPage({ r }: { r: Restaurant }) {
  const other = Object.values(RESTAURANTS).find((x) => x.slug !== r.slug);
  return (
    <GroupShell name={r.name} place={r.town} phone={r.phone} address={r.address} mapsHref={r.maps}>
      <PageHero
        eyebrow={`${r.tagline} · ${r.town}`}
        title={<>{r.name}, <span className="text-meadow-600">{r.town}</span></>}
        intro={r.intro}
      >
        <ActionButtons r={r} />
      </PageHero>

      {/* feature card, like the flagship project card */}
      <section className="section !pt-6">
        <div className="container-x">
          <Reveal>
            <article className="card grid overflow-hidden lg:grid-cols-[1.35fr_1fr]">
              <div className="relative min-h-[280px] bg-cream-200 lg:min-h-[460px]">
                {r.image ? (
                  <Image src={r.image.src} alt={r.image.alt} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-forest/45">
                    <ImageIcon size={40} strokeWidth={1.25} />
                    <span className="text-[14px]">Photos coming soon</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col p-7 md:p-10">
                <span className="w-fit rounded-md bg-meadow-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                  {r.status}
                </span>
                <h2 className="mt-5 font-heading text-[clamp(30px,3.4vw,44px)] text-forest">{r.name}</h2>
                <p className="mt-2 flex items-start gap-2 text-[14px] !text-forest/70">
                  <MapPin size={16} className="mt-1 shrink-0 text-meadow-600" /> {r.address.join(', ')}
                </p>
                <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-forest/15 pt-7 text-[14px]">
                  {r.facts.map((f) => (
                    <div key={f.label}>
                      <dt className="text-[12px] uppercase tracking-[0.14em] text-forest/70">{f.label}</dt>
                      <dd className="mt-1 font-medium text-forest">{f.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-auto flex flex-wrap gap-3 pt-8">
                  <a href={r.maps} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    <Navigation size={16} /> Get directions
                  </a>
                  <a href={telHref(r.phone)} className="btn btn-ghost"><Phone size={16} /> Call</a>
                </div>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* about + founder + numbers, like the founder band on the Infra home page */}
      <section className="section bg-forest text-white">
        <div className="container-x">
          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal>
              <p className="eyebrow !text-meadow-400">Part of V Grand Groups</p>
              <h2 className="mt-4 font-heading text-white">A V Grand kitchen in {r.town}</h2>
              <p className="mt-6 !text-[17px] !text-white/75">{r.about}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mx-auto max-w-[320px]">
                <Image
                  src="/images/founder-vinod-kumar.jpg"
                  alt="Vinod Kumar Talasila, founder of V Grand Groups"
                  width={1200}
                  height={1800}
                  className="aspect-[4/5] w-full rounded-xl object-cover"
                />
                <p className="mt-3 !text-[13px] !text-white/65">Vinod Kumar Talasila, Founder, V Grand Groups</p>
              </div>
            </Reveal>
          </div>
          <dl className="mt-14 grid grid-cols-2 gap-y-8 border-t border-white/20 pt-10 md:grid-cols-4">
            {r.numbers.map((x) => (
              <div key={x.label}>
                <dd className="font-heading text-[clamp(36px,4.4vw,56px)] leading-none text-white">{x.value}</dd>
                <dt className="mt-2 pr-4 text-[13px] text-white/65">{x.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* why eat here: plain ruled list, no cards or icons */}
      <section className="section">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <h2 className="font-heading text-forest">Why families eat at V Grand</h2>
          </Reveal>
          <div className="mt-12 grid gap-x-14 gap-y-10 md:grid-cols-2">
            {r.points.map((p, i) => (
              <Reveal key={p.title} delay={(i % 2) * 0.06}>
                <div className="border-t border-forest/25 pt-5">
                  <h3 className="font-heading text-[24px] text-forest">{p.title}</h3>
                  <p className="mt-3 !text-[16px]">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-20 max-w-2xl">
            <h2 className="font-heading text-forest">Our specialities</h2>
          </Reveal>
          <ul className="mt-10 grid gap-x-14 border-t border-forest/25 md:grid-cols-2">
            {r.specialities.map((s) => (
              <li key={s.name} className="flex items-baseline justify-between gap-4 border-b border-forest/15 py-4">
                <span className="font-heading text-[20px] text-forest">{s.name}</span>
                <span lang="te" className="text-right text-[15px] text-forest/60">{s.te}</span>
              </li>
            ))}
          </ul>

          {r.gallery.length > 0 && (
            <>
              <Reveal className="mt-20 max-w-2xl">
                <h2 className="font-heading text-forest">Inside V Grand {r.town}</h2>
              </Reveal>
              <div className={`mt-10 gap-4 ${r.gallery.length > 2 ? 'columns-2 md:columns-3' : 'columns-2'}`}>
                {r.gallery.map((ph) => (
                  <figure key={ph.src} className="mb-4 break-inside-avoid">
                    <Image
                      src={ph.src}
                      alt={ph.alt}
                      width={ph.w}
                      height={ph.h}
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="w-full rounded-xl object-cover"
                    />
                  </figure>
                ))}
              </div>
            </>
          )}

          <div className="mt-20 grid gap-x-14 gap-y-12 md:grid-cols-2">
            {[
              { title: 'Dining', list: r.spaces },
              { title: 'Services', list: r.services },
            ].map((g) => (
              <Reveal key={g.title}>
                <h2 className="font-heading text-forest">{g.title}</h2>
                <ul className="mt-8 border-t border-forest/25">
                  {g.list.map((x) => (
                    <li key={x} className="flex items-center gap-3 border-b border-forest/15 py-3.5 text-[17px] text-forest">
                      <Check size={18} className="shrink-0 text-meadow-600" /> {x}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section border-t border-forest/15">
        <div className="mx-auto max-w-[900px]">
          <Reveal>
            <h2 className="font-heading text-forest">Your questions answered</h2>
          </Reveal>
          <div className="mt-10 divide-y divide-forest/15 border-y border-forest/15">
            {r.faqs.map((f) => (
              <details key={f.q} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-heading text-[20px] text-forest">
                  {f.q}
                  <span className="text-[28px] font-light leading-none text-meadow-600 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 !text-[15px]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* visit us */}
      <section className="section !pt-0">
        <div className="container-x">
          <div className="grid gap-8 rounded-xl bg-sky-50 p-8 md:grid-cols-[1.2fr_1fr] md:p-12">
            <div>
              <h2 className="font-heading text-forest">Visit us</h2>
              <p className="mt-4 flex gap-2 !text-[17px] text-forest">
                <MapPin size={20} className="mt-1 shrink-0 text-meadow-600" /> {r.address.join(', ')}
              </p>
              <p className="mt-2 !text-[15px] !text-forest/70">Open every day, 10 AM – 11 PM</p>
              <ActionButtons r={r} />
            </div>
            {other && (
              <Link href={`/restaurant/${other.slug}`} className="group self-end border-t border-forest/25 pt-5">
                <span className="flex items-center justify-between font-heading text-[22px] text-forest">
                  Our {other.town} branch
                  <ArrowRight size={20} className="text-meadow-600 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="mt-1 block text-[15px] text-forest/70">{other.intro}</span>
              </Link>
            )}
          </div>
        </div>
      </section>
    </GroupShell>
  );
}
