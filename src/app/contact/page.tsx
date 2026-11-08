import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import LeadForm from '@/components/ui/LeadForm';
import WhatsAppButton from '@/components/whatsapp/WhatsAppButton';
import {
  SITE_PHONE_DISPLAY, SITE_PHONE_TEL, SITE_EMAIL, SITE_ADDRESS_LINES, SITE_MAPS_URL,
  SITE_HOURS, SITE_WHATSAPP_NUMBER,
} from '@/lib/site';

export const metadata = {
  title: 'Contact V Grand Infra | Book Site Visit | Ongole',
  description: 'Contact V Grand Infra to book a free site visit for Elite Homes, Tripura, V Grand Gateway or V Grand Healthcare in Ongole. Call +91 90301 43333 or WhatsApp us.',
  keywords: 'contact v grand infra, book site visit ongole, flat enquiry ongole, apartment booking ongole, v grand infra phone number',
  alternates: { canonical: 'https://vgrandgroup.com/contact' },
};

export default function ContactPage() {
  const rows = [
    { icon: MapPin, label: 'Address', node: <a href={SITE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">{SITE_ADDRESS_LINES.join(', ')}</a> },
    { icon: Phone, label: 'Phone', node: <a href={`tel:${SITE_PHONE_TEL}`} className="hover:text-white">{SITE_PHONE_DISPLAY}</a> },
    { icon: Mail, label: 'Email', node: <a href={`mailto:${SITE_EMAIL}`} className="break-all hover:text-white">{SITE_EMAIL}</a> },
    { icon: Clock, label: 'Hours', node: <span>{SITE_HOURS}</span> },
  ];

  return (
    <>
      <PageHero
        title="Talk to our team in Ongole"
        intro="Whether you have a question about our projects, pricing, or locations, our team is ready to help."
      />

      <section className="section !pt-10">
        <div className="container-x grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <div className="card p-6 md:p-10">
              <h2 className="mb-8 font-heading !text-[30px] text-forest">Send us a message</h2>
              <LeadForm source="contact_page" submitLabel="Send message" />
              <div className="mt-8 border-t border-forest/10 pt-6">
                <p className="mb-3 text-[13px] text-forest/70">Prefer WhatsApp?</p>
                <WhatsAppButton variant="pill" phoneNumber={SITE_WHATSAPP_NUMBER} showText={true} />
              </div>
            </div>
          </Reveal>

          <div className="grid content-start gap-6">
            <Reveal delay={0.08}>
              <div className="relative overflow-hidden rounded-xl bg-forest p-8 text-white">
                <div className="relative">
                  <h2 className="font-heading !text-[26px] text-white">Our office</h2>
                  <ul className="mt-6 grid gap-5">
                    {rows.map((r) => (
                      <li key={r.label} className="flex gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-meadow-400"><r.icon size={18} /></span>
                        <span>
                          <span className="block text-[11px] uppercase tracking-[0.18em] text-white/65">{r.label}</span>
                          <span className="block text-[15px] text-white/90">{r.node}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.14}>
              <iframe
                title="V Grand Infra office location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3841.5!2d80.0476!3d15.5057!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4b6a6b6a6b6a6b%3A0x0!2zT25nb2xl!5e0!3m2!1sen!2sin!4v1"
                width="100%"
                height="300"
                className="block rounded-xl border-0"
                allowFullScreen
                loading="lazy"
              />
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
