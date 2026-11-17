/**
 * Soft background music, synthesised live with the Web Audio API — there are no sound files.
 * A slow four-chord pad breathes underneath, and a few bell-like notes drift over the top,
 * all through a generated reverb. It never repeats exactly.
 */

const CHORDS: number[][] = [
  // Fmaj9 · Am9 · Dm9 · Bbmaj9 (MIDI notes), voiced low and open
  [41, 48, 57, 60, 64, 67],
  [45, 52, 55, 60, 64, 71],
  [38, 50, 57, 60, 65, 69],
  [46, 53, 57, 62, 65, 72],
];
const CHORD_SECONDS = 9;
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export class Ambient {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private next = 0;
  private step = 0;
  private seed = 20261;
  muted = false;

  private rand() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  /** must be called from a click / tap, or the browser will keep it silent */
  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    const master = (this.master = ctx.createGain());
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.5, ctx.currentTime + 4);

    // a hall made of decaying noise
    const len = Math.floor(ctx.sampleRate * 3.2);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (this.rand() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const reverb = ctx.createConvolver();
    reverb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.55;
    const dry = ctx.createGain(); dry.gain.value = 0.6;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass'; tone.frequency.value = 2400; tone.Q.value = 0.3;
    this.bus = ctx.createGain();
    this.bus.connect(dry).connect(tone);
    this.bus.connect(reverb).connect(wet).connect(tone);
    tone.connect(master).connect(ctx.destination);

    this.next = ctx.currentTime + 0.15;
    this.timer = setInterval(() => this.schedule(), 400);
    this.schedule();
  }
  private bus: GainNode | null = null;

  private voice(freq: number, t: number, dur: number, peak: number, type: OscillatorType, attack: number, detune = 0) {
    const ctx = this.ctx!, bus = this.bus!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type; osc.frequency.value = freq; osc.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(bus);
    osc.start(t); osc.stop(t + dur + 0.1);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    while (this.next < ctx.currentTime + 1.2) {
      const chord = CHORDS[this.step % CHORDS.length];
      const t = this.next;
      // pad: every note doubled and slightly detuned so it shimmers
      chord.forEach((n, i) => {
        const peak = i === 0 ? 0.075 : 0.036;
        this.voice(hz(n), t, CHORD_SECONDS + 4.5, peak, i === 0 ? 'sine' : 'triangle', 3.2, -6);
        this.voice(hz(n), t, CHORD_SECONDS + 4.5, peak * 0.8, 'sine', 3.6, 7);
      });
      // a handful of soft bell notes from the same chord, an octave up
      const bells = 2 + Math.floor(this.rand() * 3);
      for (let b = 0; b < bells; b++) {
        const n = chord[2 + Math.floor(this.rand() * 4)] + 12;
        const bt = t + 0.8 + this.rand() * (CHORD_SECONDS - 1.6);
        this.voice(hz(n), bt, 3.4, 0.05, 'sine', 0.012);
        this.voice(hz(n) * 2.01, bt, 1.4, 0.012, 'sine', 0.008);
      }
      this.next += CHORD_SECONDS;
      this.step++;
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    const ctx = this.ctx, master = this.master;
    if (!ctx || !master) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.35);
  }

  /** the tab went to the background, or came back */
  setActive(active: boolean) {
    if (!this.ctx) return;
    if (active) { void this.ctx.resume(); this.next = Math.max(this.next, this.ctx.currentTime + 0.1); }
    else void this.ctx.suspend();
  }

  dispose() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const ctx = this.ctx;
    this.ctx = null;
    if (ctx) {
      try { this.master?.gain.setTargetAtTime(0, ctx.currentTime, 0.1); } catch { /* already closed */ }
      setTimeout(() => { void ctx.close().catch(() => undefined); }, 400);
    }
  }
}
