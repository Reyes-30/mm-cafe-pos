let audioContext: AudioContext | null = null;

export function unlockKitchenAudio(): boolean {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }
    return audioContext.state === 'running';
  } catch {
    return false;
  }
}

export function isKitchenAudioReady(): boolean {
  return audioContext?.state === 'running';
}

/** Triple beep — noticeable in a busy kitchen */
export function playNewOrderAlert(): void {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    const ctx = audioContext;
    if (ctx.state !== 'running') return;

    const beep = (time: number, freq: number, duration: number, volume = 0.35) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(volume, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      osc.start(time);
      osc.stop(time + duration + 0.05);
    };

    const t = ctx.currentTime;
    beep(t, 880, 0.12);
    beep(t + 0.18, 1100, 0.12);
    beep(t + 0.36, 880, 0.18, 0.4);
  } catch {
    // Browser blocked audio — silent fail
  }
}

/** Short test beep for the sound toggle */
export function playTestBeep(): void {
  try {
    if (!audioContext) audioContext = new AudioContext();
    const ctx = audioContext;
    if (ctx.state !== 'running') return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.start(t);
    osc.stop(t + 0.2);
  } catch {
    // ignore
  }
}
