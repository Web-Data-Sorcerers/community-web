// Original procedural scores. Render once per preset; no downloaded audio.
export type AmbientProfile = 'library' | 'castle' | 'waltz';
const cache = new Map<AmbientProfile, Promise<AudioBuffer>>();
const SAMPLE_RATE = 24000;
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// Yield between small setup batches; OfflineAudioContext construction is still
// main-thread work even though rendering itself is asynchronous.
export const yieldAudioSetup = () =>
  new Promise<void>((resolve) => window.setTimeout(resolve, 0));

export function renderAmbient(profile: AmbientProfile): Promise<AudioBuffer> {
  const existing = cache.get(profile);
  if (existing) return existing;
  const rendering = render(profile);
  cache.set(profile, rendering);
  return rendering;
}

async function render(profile: AmbientProfile): Promise<AudioBuffer> {
  await yieldAudioSetup();
  const beat =
    60 / (profile === 'waltz' ? 80 : profile === 'library' ? 68 : 64);
  const frames = Math.round(
    (profile === 'waltz' ? 72 : 32) * beat * SAMPLE_RATE,
  );
  const cycle = frames / SAMPLE_RATE;
  // Every note/envelope + the 2s impulse ends within 12s. Render that tail of
  // the previous cycle, rather than another complete 54s score, before the loop.
  const preRollFrames = Math.min(frames, 12 * SAMPLE_RATE);
  const trim = (frames - preRollFrames) / SAMPLE_RATE;
  const ctx = new OfflineAudioContext(2, frames + preRollFrames, SAMPLE_RATE);
  const bus = ctx.createGain();
  // Headroom remains below 0.5 peak; engine gain keeps the music quiet.
  bus.gain.value = 4;
  bus.connect(ctx.destination);
  // Fixed-seed impulse: repeatable auditions, airy tail without sharp highs.
  const impulse = ctx.createBuffer(2, SAMPLE_RATE * 2, SAMPLE_RATE);
  let seed = 1436;
  let batchStart = performance.now();
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < data.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      data[i] = (seed / 2147483648) * (1 - i / data.length) ** 3;
      if (i % 2048 === 2047 && performance.now() - batchStart >= 4) {
        await yieldAudioSetup();
        batchStart = performance.now();
      }
    }
  }
  const reverb = ctx.createConvolver();
  reverb.buffer = impulse;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 3200;
  const wet = ctx.createGain();
  wet.gain.value = 0.18;
  reverb.connect(lowpass);
  lowpass.connect(wet);
  wet.connect(bus);

  const waves = new Map<string, PeriodicWave>();
  const voices: (() => void)[] = [];
  const addVoice = (
    midi: number,
    start: number,
    attack: number,
    decay: number,
    level: number,
    pan: number,
    type: OscillatorType = 'sine',
    harmonics?: number[],
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    osc.type = type;
    if (harmonics) {
      const key = harmonics.join(',');
      let wave = waves.get(key);
      if (!wave) {
        wave = ctx.createPeriodicWave(
          new Float32Array(harmonics.length),
          new Float32Array(harmonics),
        );
        waves.set(key, wave);
      }
      osc.setPeriodicWave(wave);
    }
    osc.frequency.value = hz(midi);
    panner.pan.value = pan;
    gain.gain.setValueAtTime(0.00001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.00001, start + attack + decay);
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(bus);
    gain.connect(reverb);
    osc.start(start);
    osc.stop(start + attack + decay + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
      panner.disconnect();
    };
  };
  // The score stays identical; enqueue its recipes cheaply before building the
  // graph in bounded batches, all scheduled on the offline audio clock.
  const voice = (...args: Parameters<typeof addVoice>) => {
    if (args[1] < trim) return;
    args[1] -= trim;
    voices.push(() => addVoice(...args));
  };
  const chords =
    profile === 'library'
      ? [
          [45, 52, 59, 60],
          [41, 48, 55, 57],
          [48, 55, 59, 62],
          [43, 50, 57, 59],
        ]
      : [
          [45, 52, 59, 60],
          [41, 48, 52, 59],
          [38, 45, 52, 53],
          [40, 47, 54, 55],
        ];
  const motifs =
    profile === 'library'
      ? [
          [0, 76],
          [1.5, 71],
          [3, 74],
          [5, 72],
          [9, 69],
          [11, 76],
          [14, 71],
          [17, 79],
          [19, 74],
          [21.5, 76],
          [25, 74],
          [28, 71],
        ]
      : [
          [0, 71],
          [3, 76],
          [6, 72],
          [10, 71],
          [14, 69],
          [18, 77],
          [22, 76],
          [27, 71],
        ];
  // Keep the complete second cycle plus enough prior notes for its opening
  // pad/reverb tails, giving a continuous boundary at the loop point.
  for (let repeat = 0; repeat < 2; repeat++) {
    const offset = repeat * cycle;
    if (profile === 'waltz') {
      // 24 bars in 3/4, original D-minor motif with chromatic side steps.
      // Three-bar harmonic blocks leave space between music-box phrases.
      const progression = [
        [50, 57, 64, 65],
        [46, 53, 57, 60],
        [53, 60, 64, 69],
        [44, 51, 55, 60],
        [55, 62, 65, 69],
        [57, 61, 64, 67],
        [50, 57, 60, 64],
        [57, 61, 64, 67],
      ];
      const strings = [0, 1, 0.25, 0.12, 0.06];
      const choir = [0, 1, 0.06, 0.3, 0.04, 0.12];
      const woodwind = [0, 1, 0.16, 0.36, 0.08, 0.1];
      progression.forEach((chord, block) => {
        const start = offset + block * 9 * beat;
        const middle = block >= 2 && block <= 5;
        chord.forEach((midi, n) => {
          voice(
            midi,
            start,
            1.2,
            9 * beat,
            middle ? 0.022 : 0.013,
            (n - 1.5) * 0.14,
            'sine',
            strings,
          );
          if (block === 3 || block === 4) {
            voice(
              midi + 12,
              start + beat,
              1.8,
              5 * beat,
              0.006,
              (1.5 - n) * 0.18,
              'sine',
              choir,
            );
          }
        });
        // Soft first-beat bass and two lighter chord replies suggest a waltz.
        for (let bar = 0; bar < 3; bar++) {
          voice(
            chord[0] - 12,
            start + bar * 3 * beat,
            0.08,
            0.8,
            0.017,
            -0.12,
            'sine',
            woodwind,
          );
          for (const tap of [1, 2]) {
            voice(
              chord[tap] + 12,
              start + (bar * 3 + tap) * beat,
              0.025,
              0.65,
              0.009,
              0.16,
              'triangle',
            );
          }
        }
        if (middle) {
          [0, 1, 2, 3, 2, 1].forEach((n, step) =>
            voice(
              chord[n] + 12,
              start + (5.5 + step * 0.3) * beat,
              0.012,
              1.9,
              0.021,
              -0.24 + step * 0.08,
              'triangle',
            ),
          );
        }
      });
      const melody = [
        [0, 74],
        [1.5, 81],
        [3, 80],
        [4, 77],
        [6, 76],
        [7.5, 74],
        [10.5, 77],
        [12, 82],
        [14, 81],
        [16.5, 76],
        [19.5, 79],
        [21, 81],
        [22.5, 76],
        [25.5, 77],
        [28.5, 80],
        [30, 79],
        [33, 75],
        [37.5, 81],
        [39, 86],
        [41, 85],
        [43.5, 81],
        [46.5, 80],
        [48, 76],
        [50, 73],
        [52.5, 69],
        [55.5, 77],
        [57, 76],
        [60, 74],
        [64.5, 73],
        [67.5, 76],
        [70, 69],
      ];
      melody.forEach(([position, midi], index) => {
        const start = offset + position * beat;
        const pan = index % 2 ? 0.18 : -0.18;
        voice(midi, start, 0.012, 2.5, 0.06, pan);
        voice(midi + 12, start, 0.008, 0.8, 0.009, pan);
        voice(midi + 19, start, 0.006, 0.38, 0.0025, -pan);
      });
      continue;
    }
    chords.forEach((chord, index) => {
      chord.forEach((midi, n) => {
        voice(
          midi,
          offset + index * 8 * beat,
          1.6,
          8 * beat,
          profile === 'library' ? 0.038 : 0.032,
          (n - 1.5) * 0.12,
        );
      });
      if (profile === 'library') {
        [0, 2, 1].forEach((n, step) =>
          voice(
            chord[n] + 12,
            offset + (index * 8 + 4 + step * 0.6) * beat,
            0.018,
            2.4,
            0.028,
            -0.18,
            'triangle',
          ),
        );
      }
    });
    motifs.forEach(([position, midi], index) => {
      const start = offset + position * beat;
      const pan = index % 2 ? 0.22 : -0.22;
      voice(midi, start, 0.016, 2.8, 0.072, pan);
      voice(midi + 12, start, 0.012, 0.9, 0.008, pan);
    });
  }
  await yieldAudioSetup();
  batchStart = performance.now();
  for (const add of voices) {
    add();
    if (performance.now() - batchStart >= 4) {
      await yieldAudioSetup();
      batchStart = performance.now();
    }
  }
  const rendered = await ctx.startRendering();
  const loop = new AudioBuffer({
    numberOfChannels: 2,
    length: frames,
    sampleRate: SAMPLE_RATE,
  });
  for (let channel = 0; channel < 2; channel++) {
    loop.copyToChannel(
      rendered.getChannelData(channel).subarray(preRollFrames),
      channel,
    );
  }
  return loop;
}
