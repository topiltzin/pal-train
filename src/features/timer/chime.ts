/** The part of the Web Audio API the chime uses. Tests supply a fake; the browser supplies the real one. */
export type ChimeOscillator = {
  type: string;
  frequency: { value: number };
  connect(node: unknown): void;
  start(when?: number): void;
  stop(when?: number): void;
};

export type ChimeGain = {
  gain: {
    value: number;
    setValueAtTime(value: number, time: number): void;
    linearRampToValueAtTime(value: number, time: number): void;
    exponentialRampToValueAtTime(value: number, time: number): void;
  };
  connect(node: unknown): void;
};

export type ChimeContext = {
  state: string;
  currentTime: number;
  destination: unknown;
  resume(): Promise<void>;
  createOscillator(): ChimeOscillator;
  createGain(): ChimeGain;
};

const TONE_HZ = [660, 880] as const;
const TONE_SECONDS = 0.6;
const PEAK_GAIN = 0.2;
const TONE_STAGGER_SECONDS = 0.18;

/** One tone: a sine that rises to a soft peak and fades out. */
function scheduleTone(context: ChimeContext, frequency: number, startAt: number): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(PEAK_GAIN, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + TONE_SECONDS);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + TONE_SECONDS);
}

let primed: ChimeContext | undefined;

/**
 * Creates the audio context during the Start tap, which counts as the user gesture browsers need
 * before they allow sound. The chime later reuses that context when the timer ends.
 */
export function primeChime(createContext: () => ChimeContext | undefined = browserContext): void {
  primed ??= createContext();
  if (primed?.state === "suspended") {
    void primed.resume();
  }
}

/**
 * Plays one two-tone chime. Returns false when no audio is available or a tone cannot be made;
 * the celebration still shows in that case, so the end of the session is never missed.
 */
export function playChime(
  createContext: () => ChimeContext | undefined = () => primed ?? browserContext(),
): boolean {
  const context = createContext();
  if (context === undefined) {
    return false;
  }
  try {
    if (context.state === "suspended") {
      void context.resume();
    }
    TONE_HZ.forEach((frequency, index) =>
      scheduleTone(context, frequency, context.currentTime + index * TONE_STAGGER_SECONDS),
    );
    return true;
  } catch {
    return false;
  }
}

/** The browser's audio context, or undefined where audio is not supported. */
function browserContext(): ChimeContext | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const Constructor = (window.AudioContext ??
    (window as unknown as { webkitAudioContext?: new () => unknown }).webkitAudioContext) as
    (new () => ChimeContext) | undefined;
  return Constructor === undefined ? undefined : new Constructor();
}
