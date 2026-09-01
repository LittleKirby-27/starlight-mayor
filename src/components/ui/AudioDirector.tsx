import { useEffect, useRef } from 'react';
import { getAudioTheme, type AudioCue, type AudioThemeId } from '../../audio/audioThemes';
import { useGameStore } from '../../store/gameStore';

interface PreviewDetail {
  cue?: AudioCue;
  themeId?: AudioThemeId;
}

interface SynthNote {
  frequency: number;
  offset: number;
  duration: number;
  gain: number;
}

const SYNTH_NOTES: Record<AudioCue, SynthNote[]> = {
  achievement: [
    { frequency: 783.99, offset: 0, duration: 0.22, gain: 0.085 },
    { frequency: 1046.5, offset: 0.11, duration: 0.32, gain: 0.1 },
  ],
  failed: [
    { frequency: 293.66, offset: 0, duration: 0.34, gain: 0.07 },
    { frequency: 220, offset: 0.24, duration: 0.55, gain: 0.075 },
  ],
  level: [
    { frequency: 523.25, offset: 0, duration: 0.34, gain: 0.07 },
    { frequency: 659.25, offset: 0.14, duration: 0.38, gain: 0.065 },
    { frequency: 783.99, offset: 0.28, duration: 0.44, gain: 0.07 },
    { frequency: 1046.5, offset: 0.46, duration: 0.82, gain: 0.085 },
  ],
  final: [
    { frequency: 392, offset: 0, duration: 0.55, gain: 0.055 },
    { frequency: 523.25, offset: 0.2, duration: 0.58, gain: 0.06 },
    { frequency: 659.25, offset: 0.4, duration: 0.62, gain: 0.06 },
    { frequency: 783.99, offset: 0.62, duration: 0.75, gain: 0.07 },
    { frequency: 987.77, offset: 0.88, duration: 0.82, gain: 0.065 },
    { frequency: 1174.66, offset: 1.18, duration: 1.1, gain: 0.075 },
  ],
};

const cueWaveform: Record<AudioCue, OscillatorType> = {
  achievement: 'sine',
  failed: 'triangle',
  level: 'sine',
  final: 'sine',
};

export function AudioDirector() {
  const audioEnabled = useGameStore((state) => state.audioEnabled);
  const audioTheme = useGameStore((state) => state.audioTheme);
  const enabledRef = useRef(audioEnabled);
  const themeRef = useRef(audioTheme);
  const tracksRef = useRef(new Map<string, HTMLAudioElement>());
  const contextRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef(new Set<OscillatorNode>());
  const previewTimerRef = useRef<number | null>(null);

  useEffect(() => {
    enabledRef.current = audioEnabled;
    if (audioEnabled) return;
    tracksRef.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    synthNodesRef.current.forEach((node) => {
      try {
        node.stop();
      } catch {
        // The oscillator may already have completed naturally.
      }
    });
    synthNodesRef.current.clear();
    if (previewTimerRef.current !== null) window.clearTimeout(previewTimerRef.current);
  }, [audioEnabled]);

  useEffect(() => {
    themeRef.current = audioTheme;
  }, [audioTheme]);

  useEffect(() => {
    const ensureContext = () => {
      if (!contextRef.current) {
        const AudioContextClass = window.AudioContext
          ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) contextRef.current = new AudioContextClass();
      }
      if (contextRef.current?.state === 'suspended') void contextRef.current.resume();
      return contextRef.current;
    };

    const stopAll = () => {
      tracksRef.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      synthNodesRef.current.forEach((node) => {
        try {
          node.stop();
        } catch {
          // The oscillator may already have completed naturally.
        }
      });
      synthNodesRef.current.clear();
      if (previewTimerRef.current !== null) {
        window.clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      }
    };

    const playSynth = (cue: AudioCue) => {
      const context = ensureContext();
      if (!context) return;
      const now = context.currentTime + 0.025;
      const waveform = cueWaveform[cue];

      SYNTH_NOTES[cue].forEach((note) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = now + note.offset;
        const end = start + note.duration;

        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(note.frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(note.gain, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        oscillator.connect(gain);
        gain.connect(context.destination);
        synthNodesRef.current.add(oscillator);
        oscillator.addEventListener('ended', () => synthNodesRef.current.delete(oscillator), { once: true });
        oscillator.start(start);
        oscillator.stop(end + 0.03);
      });
    };

    const getTrack = (themeId: AudioThemeId, cue: AudioCue) => {
      const theme = getAudioTheme(themeId);
      const config = theme.tracks?.[cue];
      if (!config) return null;
      const key = `${themeId}:${cue}`;
      const cached = tracksRef.current.get(key);
      if (cached) return cached;

      const audio = new Audio(config.src);
      audio.preload = 'metadata';
      audio.volume = config.volume;
      tracksRef.current.set(key, audio);
      return audio;
    };

    const play = (cue: AudioCue, themeId = themeRef.current, preview = false, stopOthers = true) => {
      if (!enabledRef.current) return;
      if (stopOthers) stopAll();

      const theme = getAudioTheme(themeId);
      if (!theme.tracks) {
        playSynth(cue);
        return;
      }

      const audio = getTrack(themeId, cue);
      if (!audio) return;
      audio.currentTime = 0;
      void audio.play().catch(() => undefined);
      if (preview) {
        previewTimerRef.current = window.setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
          previewTimerRef.current = null;
        }, 6000);
      }
    };

    const onAchievement = () => play('achievement', themeRef.current, false, false);
    const onLevelComplete = () => play('level');
    const onWin = () => play('final');
    const onFailed = () => play('failed');
    const onPreview = (event: Event) => {
      const detail = (event as CustomEvent<PreviewDetail>).detail;
      play(detail?.cue ?? 'level', detail?.themeId ?? themeRef.current, true);
    };
    const onVisibility = () => {
      if (document.hidden) stopAll();
    };

    window.addEventListener('pointerdown', ensureContext, { once: true, capture: true });
    window.addEventListener('audio-theme-preview', onPreview);
    window.addEventListener('achievement-unlocked', onAchievement);
    window.addEventListener('game-level-complete', onLevelComplete);
    window.addEventListener('game-won', onWin);
    window.addEventListener('game-failed', onFailed);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('pointerdown', ensureContext, { capture: true });
      window.removeEventListener('audio-theme-preview', onPreview);
      window.removeEventListener('achievement-unlocked', onAchievement);
      window.removeEventListener('game-level-complete', onLevelComplete);
      window.removeEventListener('game-won', onWin);
      window.removeEventListener('game-failed', onFailed);
      document.removeEventListener('visibilitychange', onVisibility);
      stopAll();
      void contextRef.current?.close();
    };
  }, []);

  return null;
}
