import { Check, Headphones, Music2, Volume2, VolumeX, X } from 'lucide-react';
import { AUDIO_THEMES, type AudioCue, type AudioThemeId } from '../../audio/audioThemes';
import { useGameStore } from '../../store/gameStore';

const PREVIEW_CUES: Array<{ cue: AudioCue; label: string }> = [
  { cue: 'level', label: '通关' },
  { cue: 'final', label: '终章' },
  { cue: 'failed', label: '失败' },
  { cue: 'achievement', label: '成就' },
];

export function AudioSettings({ onClose }: { onClose: () => void }) {
  const audioTheme = useGameStore((state) => state.audioTheme);
  const setAudioTheme = useGameStore((state) => state.setAudioTheme);
  const audioEnabled = useGameStore((state) => state.audioEnabled);
  const toggleAudio = useGameStore((state) => state.toggleAudio);

  const preview = (themeId: AudioThemeId, cue: AudioCue) => {
    setAudioTheme(themeId);
    window.dispatchEvent(new CustomEvent('audio-theme-preview', { detail: { themeId, cue } }));
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="audio-settings-title">
      <div className="glass-panel max-h-[92vh] w-full max-w-4xl overflow-y-auto p-5 text-white sm:p-7">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-100">
              <Headphones size={22} />
            </div>
            <div>
              <p className="eyebrow">Audio Lab</p>
              <h2 id="audio-settings-title" className="mt-1 text-2xl font-black">选择游戏声音方案</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">每套都包含通关、最终通关、失败和成就四个场景。选择会自动保存。</p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭声音设置"><X size={18} /></button>
        </header>

        <button
          className={`mt-5 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${audioEnabled ? 'border-emerald-300/25 bg-emerald-300/[0.07]' : 'border-amber-300/25 bg-amber-300/[0.07]'}`}
          onClick={toggleAudio}
        >
          <span className="flex items-center gap-3">
            {audioEnabled ? <Volume2 size={18} className="text-emerald-200" /> : <VolumeX size={18} className="text-amber-200" />}
            <span>
              <span className="block text-sm font-bold">{audioEnabled ? '音效已开启' : '音效已静音'}</span>
              <span className="mt-0.5 block text-xs text-slate-500">点击可{audioEnabled ? '静音' : '开启并试听'}</span>
            </span>
          </span>
          <span className="text-xs font-bold text-slate-400">{audioEnabled ? 'ON' : 'OFF'}</span>
        </button>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {AUDIO_THEMES.map((theme) => {
            const selected = audioTheme === theme.id;
            return (
              <section key={theme.id} className={`overflow-hidden rounded-2xl border transition ${selected ? 'border-cyan-200/45 bg-cyan-200/[0.07]' : 'border-white/10 bg-white/[0.025]'}`}>
                <button className="flex w-full items-start gap-3 p-4 text-left" onClick={() => setAudioTheme(theme.id)}>
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20" style={{ color: theme.accent }}>
                    {selected ? <Check size={18} /> : <Music2 size={18} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-black">{theme.name}</span>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.accent }}>{theme.label}</span>
                    </span>
                    <span className="mt-1.5 block text-xs leading-5 text-slate-400">{theme.description}</span>
                  </span>
                </button>
                <div className="grid grid-cols-4 gap-1 border-t border-white/[0.07] p-2">
                  {PREVIEW_CUES.map(({ cue, label }) => (
                    <button
                      key={cue}
                      className="rounded-lg border border-white/[0.08] bg-black/20 px-2 py-2 text-[11px] font-bold text-slate-400 transition hover:border-cyan-200/30 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-35"
                      disabled={!audioEnabled}
                      onClick={() => preview(theme.id, cue)}
                    >
                      试听{label}
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>“星尘合成”是实时生成的原创短音效，体积最小，也适合网络较慢的设备。</p>
          <button className="primary-button shrink-0" onClick={onClose}>完成设置</button>
        </footer>
      </div>
    </div>
  );
}
