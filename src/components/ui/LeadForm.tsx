'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { navProjects } from '@/data/nav';

interface LeadFormProps {
  /** Stored in leads.source so you can tell where a lead came from. */
  source: string;
  /** Show preferred date + time-slot fields (site-visit booking). */
  withVisitSlot?: boolean;
  submitLabel?: string;
  defaultProject?: string;
}

const slots = ['Morning (9:30 – 12:30)', 'Afternoon (12:30 – 3:30)', 'Evening (3:30 – 6:30)'];

const field =
  'w-full rounded-lg border border-forest/15 bg-white px-4 py-3.5 text-[15px] text-forest placeholder:text-forest/35 outline-none transition focus:border-meadow focus:ring-2 focus:ring-meadow/25';
const label = 'mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em] text-forest/70';

export default function LeadForm({ source, withVisitSlot, submitLabel = 'Send enquiry', defaultProject }: LeadFormProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const name = String(f.get('name') || '').trim();
    const phone = String(f.get('phone') || '').replace(/\D/g, '').slice(-10);
    const email = String(f.get('email') || '').trim();
    const project = String(f.get('project') || '');
    let message = String(f.get('message') || '').trim();

    if (!name) return setError('Please enter your name.');
    if (!/^\d{10}$/.test(phone)) return setError('Please enter a valid 10-digit phone number.');

    if (withVisitSlot) {
      const date = String(f.get('date') || '');
      const slot = String(f.get('slot') || '');
      message = `Site visit request — ${date || 'date flexible'}, ${slot}.${message ? ' ' + message : ''}`;
    }

    setState('loading');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email: email || undefined, project, message, source }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Something went wrong.');
      setState('done');
    } catch (err: any) {
      setError(err.message || 'Could not send. Please try again or call us.');
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div role="status" className="flex flex-col items-center rounded-xl bg-meadow/10 px-8 py-14 text-center">
        <CheckCircle2 size={48} className="anim-pop text-meadow-600" />
        <h3 className="mt-5 font-heading text-[28px] text-forest">Thank you — we&apos;ve got it.</h3>
        <p className="mt-3 max-w-sm !text-[15px]">Our team will call you shortly to confirm. For anything urgent, call or WhatsApp us directly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${source}-name`} className={label}>Full name</label>
          <input id={`${source}-name`} name="name" required maxLength={200} autoComplete="name" placeholder="Your name" className={field} />
        </div>
        <div>
          <label htmlFor={`${source}-phone`} className={label}>Phone number</label>
          <input id={`${source}-phone`} name="phone" required inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" className={field} />
        </div>
      </div>
      <div>
        <label htmlFor={`${source}-email`} className={label}>Email <span className="normal-case tracking-normal text-forest/70">(optional)</span></label>
        <input id={`${source}-email`} name="email" type="email" maxLength={200} autoComplete="email" placeholder="you@example.com" className={field} />
      </div>
      <div>
        <label htmlFor={`${source}-project`} className={label}>Project of interest</label>
        <select id={`${source}-project`} name="project" defaultValue={defaultProject ?? ''} className={field}>
          <option value="">General enquiry</option>
          {navProjects.map((p) => (
            <option key={p.slug} value={p.name}>{p.name} — {p.note}</option>
          ))}
        </select>
      </div>

      {withVisitSlot && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${source}-date`} className={label}>Preferred date</label>
            <input id={`${source}-date`} name="date" type="date" min={today} className={field} />
          </div>
          <div>
            <label htmlFor={`${source}-slot`} className={label}>Time slot</label>
            <select id={`${source}-slot`} name="slot" className={field}>
              {slots.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}

      <div>
        <label htmlFor={`${source}-message`} className={label}>Message <span className="normal-case tracking-normal text-forest/70">(optional)</span></label>
        <textarea id={`${source}-message`} name="message" rows={4} maxLength={2000} placeholder="Tell us what you're looking for…" className={field} />
      </div>

      {error && <p key={error} role="alert" className="anim-shake rounded-lg bg-red-50 px-4 py-3 text-[14px] !text-red-700">{error}</p>}

      <button type="submit" disabled={state === 'loading'} className="btn btn-primary w-full sm:w-fit disabled:opacity-60">
        {state === 'loading' ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : submitLabel}
      </button>
    </form>
  );
}
