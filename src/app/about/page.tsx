import Image from 'next/image';
import { Gem, Eye, Timer, HeartHandshake } from 'lucide-react';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import Counter from '@/components/ui/Counter';

export const metadata = {
  title: 'About Us | V Grand Infra | Trusted Builder in Ongole',
  description: 'V Grand Infra — trusted real estate developer in Ongole since 2025. Founded by Vinod Kumar Talasila. Building quality homes for every family in Andhra Pradesh.',
  keywords: 'best builder ongole, trusted real estate ongole, v grand infra about, vinod kumar talasila, construction company ongole andhra pradesh',
  alternates: { canonical: 'https://vgrandgroup.com/about' },
};

const values = [
  { icon: Gem, title: 'Uncompromised Quality', body: "We understand that a home protects your family's future. By sourcing proven, premium materials and maintaining strict engineering checks at every stage, we build structures meant to safely endure for generations." },
  { icon: Eye, title: 'Absolute Transparency', body: 'Your trust is our greatest asset. From straightforward, fixed pricing to clear legal documentation and honest construction updates, we ensure you are fully informed at every single step — with zero hidden surprises.' },
  { icon: Timer, title: 'Punctual Delivery', body: 'We deeply respect the value of your time and the financial planning behind your investment. For us, delivering your keys on schedule is not just a commercial deadline; it is a sacred commitment we work hard to keep.' },
  { icon: HeartHandshake, title: 'A Humble Approach', body: 'We never forget that we are building spaces for real people, not just executing blueprints. Every decision we make is guided by a sincere desire to make the home-buying journey simple, respectful, and deeply rewarding for your family.' },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About V Grand Infra"
        title={<>A foundation built on trust. <span className="italic text-meadow-600">A home built for life.</span></>}
      >
        <div className="mt-8 grid max-w-[680px] gap-4">
          <p className="!text-[18px] !text-forest/75">For most of us, a home is the biggest dream we will ever work for. It holds our savings, our sacrifices, and our hopes for the future. At V Grand Infra, we do not just see brick and mortar; we see the trust you place in our hands.</p>
          <p className="!text-[18px] !text-forest/75">We were founded on a simple, unchanging truth: quality construction, honest pricing, and transparent timelines should never be a luxury you have to beg for. They are your right. From the foundation steel to the final coat of paint, we build with the kind of integrity that ensures your family stays safe, proud, and secure for generations.</p>
        </div>
      </PageHero>

      {/* Story */}
      <section className="section !pt-10">
        <div className="container-x grid items-start gap-14 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <p className="eyebrow">Our story</p>
            <h2 className="mt-4 font-heading text-forest">Legacy of quality and trust</h2>
            <div className="mt-6 grid gap-5 !text-[17px]">
              <p className="!text-[17px]">T. Vinod Kumar was raised in a humble, lower middle-class family by his parents Sri Talasila Satyanarayana and Smt. Jayasree. He began working at the age of 15 alongside his father, learning the real meaning of effort, integrity, and sacrifice before he ever entered a classroom.</p>
              <p className="!text-[17px]">After completing his Electrical Engineering in 2007, he gained international exposure in New Zealand before returning to India in 2010. Under the guidance of his mentor Sri Chirumamilla Rambabu garu, he built a strong reputation in the granite mining industry for precision, reliability, and zero compromise on quality. In 2016, he brought that same dedication to the hospitality sector by launching V Grand Family Restaurant in Ongole, now one of the city’s most trusted dining names.</p>
            </div>

            <h3 className="mt-12 font-heading text-forest">From living the struggle to building the dream</h3>
            <p className="mt-5 !text-[17px]">V Grand Infra was born in 2025 out of a deeply personal emotion. Vinod has lived the struggles of middle-class families: paying rent, compromising on cramped living spaces, and silently dreaming of a permanent roof for his family. Because he has walked in those exact shoes, V Grand Infra operates differently. We do not see construction as just a business of brick and cement. For us, it is a sacred responsibility. Our mission is simple: to build safe, rock-solid homes that common families can genuinely afford, be immensely proud of, and safely pass down to the next generation.</p>

            <blockquote className="mt-10 rounded-[1.5rem] bg-forest p-8 text-white">
              <p className="font-heading text-[clamp(20px,2.4vw,26px)] italic leading-snug !text-white">
                "I know what it takes for a family to save up for a home. Every project we build carries my family’s name and my personal word. We promise you quality you can see with your eyes, honesty you can feel in our pricing, and the secure home your family truly deserves."
              </p>
              <footer className="mt-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-meadow-400">— T. Vinod Kumar, Founder — V Grand Infra</footer>
            </blockquote>
          </Reveal>

          <Reveal delay={0.1} className="lg:sticky lg:top-[120px]">
            <div className="relative mx-auto max-w-md">
              <div className="absolute -inset-3 rounded-organic border border-meadow/40" aria-hidden />
              <Image
                src="/images/founder-vinod-kumar.jpg"
                alt="Vinod Kumar Talasila, founder of V Grand Infra"
                width={1200}
                height={1800}
                className="relative aspect-[4/5] w-full rounded-organic object-cover"
              />
              <p className="mt-4 text-center text-[13px] !text-forest/55">Vinod Kumar Talasila — Founder, V Grand Infra</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="relative bg-sky-50 px-5 py-16 md:px-8 md:py-20 dither-bg">
        <div className="container-x grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { n: 60, s: '+', l: 'Apartments built', count: true },
            { n: 4, s: '', l: 'Projects, all RERA registered', count: true },
            { n: 25, s: '+', l: 'Years experience', count: true },
            { n: 2025, s: '', l: 'Established', count: false },
          ].map((s) => (
            <Reveal key={s.l} className="text-center">
              <p className="font-heading text-[clamp(40px,6vw,64px)] leading-none !text-forest">
                {s.count ? <Counter to={s.n} suffix={s.s} /> : `${s.n}${s.s}`}
              </p>
              <p className="mt-3 text-[13px] uppercase tracking-[0.16em] !text-forest/60">{s.l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">What we stand for</p>
            <h2 className="mt-4 font-heading text-forest">Our values</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={(i % 2) * 0.07}>
                <div className="card flex h-full gap-5 p-7">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-meadow/12 text-meadow-600"><v.icon size={24} /></span>
                  <div>
                    <h3 className="font-heading text-[22px] text-forest">{v.title}</h3>
                    <p className="mt-3 !text-[15px]">{v.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Businesses */}
      <section className="section bg-forest relative overflow-hidden">
        <div className="dither-bg-dark absolute inset-0" aria-hidden />
        <Reveal className="container-x relative max-w-[900px]">
          <p className="eyebrow !text-meadow-400">Our businesses &amp; experience</p>
          <h2 className="mt-4 font-heading text-white">Twenty-five years of earned trust</h2>
          <p className="mt-6 !text-[18px] !leading-[1.9] !text-white/80">For the past 25 years, our journey across different business fields has been shaped by the invaluable trust of the people. Whether managing large-scale operations in granite mining or welcoming families to the V Grand Family Restaurant in Ongole and Kandukur, we have learned that long-term success only comes from absolute honesty. V Grand Infra is the natural extension of this 25-year legacy. We bring the same grounded values, strict quality controls, and humble dedication to the real estate sector, ensuring your hard-earned investment is entirely safe with us.</p>
        </Reveal>
      </section>
    </>
  );
}
