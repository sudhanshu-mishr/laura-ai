/**
 * Web Audio API procedural sound generator for focus audio:
 * - Rain (pink noise with lowpass filter & random droplets)
 * - Lo-Fi Chill (warm oscillating harmonic chords with analog warmth)
 * - Cafe Ambience (soft crowd murmur with subtle acoustic resonance)
 * - Pink/White Noise (soothing full-spectrum noise curve)
 */

export type SoundType = "rain" | "lofi" | "cafe" | "whitenoise";

class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private currentTrack: SoundType | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.5;

  // Active audio nodes to tear down on stop
  private activeNodes: (AudioNode | number)[] = [];
  private lofiInterval: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentTrack(): SoundType | null {
    return this.currentTrack;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public play(track: SoundType) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.isPlaying) {
      this.stop();
    }

    this.currentTrack = track;
    this.isPlaying = true;

    switch (track) {
      case "rain":
        this.startRain();
        break;
      case "lofi":
        this.startLoFi();
        break;
      case "cafe":
        this.startCafe();
        break;
      case "whitenoise":
        this.startWhiteNoise();
        break;
    }
  }

  public stop() {
    this.isPlaying = false;
    this.currentTrack = null;

    if (this.lofiInterval) {
      clearInterval(this.lofiInterval);
      this.lofiInterval = null;
    }

    this.activeNodes.forEach((node) => {
      try {
        if (typeof node === "number") {
          clearInterval(node);
        } else if ("stop" in node && typeof (node as any).stop === "function") {
          (node as any).stop();
        } else if ("disconnect" in node && typeof (node as any).disconnect === "function") {
          (node as any).disconnect();
        }
      } catch (e) {
        // Safe tear down
      }
    });

    this.activeNodes = [];
  }

  private createNoiseBuffer(seconds = 5): AudioBuffer {
    if (!this.ctx) throw new Error("AudioContext not ready");
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      // Pink noise approximation for a warmer, natural sound
      const white = Math.random() * 2 - 1;
      const b0 = 0.99886 * lastOut + white * 0.0555179;
      data[i] = b0 * 3.5;
      lastOut = b0;
    }
    return buffer;
  }

  private startRain() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer(6);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter to simulate raindrops rushing and patter
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);

    noiseSource.start();
    this.activeNodes.push(noiseSource, filter, rainGain);

    // Random gentle droplet pulses
    const dropletInterval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;
      const osc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200 + Math.random() * 800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

      dropGain.gain.setValueAtTime(0.02 + Math.random() * 0.03, now);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(dropGain);
      dropGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.09);
    }, 450);

    this.activeNodes.push(dropletInterval);
  }

  private startLoFi() {
    if (!this.ctx || !this.masterGain) return;

    // Subtle background vinyl dust noise
    const noiseBuf = this.createNoiseBuffer(4);
    const vinylSource = this.ctx.createBufferSource();
    vinylSource.buffer = noiseBuf;
    vinylSource.loop = true;

    const vinylFilter = this.ctx.createBiquadFilter();
    vinylFilter.type = "bandpass";
    vinylFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    vinylFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const vinylGain = this.ctx.createGain();
    vinylGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    vinylSource.connect(vinylFilter);
    vinylFilter.connect(vinylGain);
    vinylGain.connect(this.masterGain);
    vinylSource.start();
    this.activeNodes.push(vinylSource, vinylFilter, vinylGain);

    // Warm pentatonic chord progression (Fmaj7 -> Em7 -> Dm7 -> Cmaj7)
    const chordFrequencies = [
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [164.81, 196.0, 246.94, 293.66], // Em7
      [146.83, 174.61, 220.0, 261.63], // Dm7
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
    ];

    let chordIndex = 0;

    const playChord = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;
      const freqs = chordFrequencies[chordIndex];
      chordIndex = (chordIndex + 1) % chordFrequencies.length;

      const now = this.ctx.currentTime;
      const duration = 4.2;

      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, now);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.exponentialRampToValueAtTime(750, now + 1.5);
        filter.frequency.exponentialRampToValueAtTime(450, now + duration);

        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(0.045, now + 1.2);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });
    };

    playChord();
    this.lofiInterval = window.setInterval(playChord, 4500);
  }

  private startCafe() {
    if (!this.ctx || !this.masterGain) return;

    // Layered muffled conversational frequencies
    const noiseBuffer = this.createNoiseBuffer(5);
    const cafeSource = this.ctx.createBufferSource();
    cafeSource.buffer = noiseBuffer;
    cafeSource.loop = true;

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = "bandpass";
    filter1.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter1.Q.setValueAtTime(1.8, this.ctx.currentTime);

    const cafeGain = this.ctx.createGain();
    cafeGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    cafeSource.connect(filter1);
    filter1.connect(cafeGain);
    cafeGain.connect(this.masterGain);
    cafeSource.start();
    this.activeNodes.push(cafeSource, filter1, cafeGain);

    // Subtle gentle ceramic cup clink every 8-14s
    const clinkInterval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = "sine";
      osc.frequency.setValueAtTime(2400 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.12);

      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.16);
    }, 9000);

    this.activeNodes.push(clinkInterval);
  }

  private startWhiteNoise() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Smooth soft lowpass filter for comfortable non-harsh white noise
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2200, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    this.activeNodes.push(source, filter, gain);
  }
}

export const focusAudio = new FocusAudioEngine();
