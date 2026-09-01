import assert from 'node:assert/strict';
import { AUDIO_THEMES, DEFAULT_AUDIO_THEME, getAudioTheme, isAudioThemeId, type AudioCue } from '../src/audio/audioThemes.ts';

const cues: AudioCue[] = ['level', 'final', 'failed', 'achievement'];
const ids = AUDIO_THEMES.map((theme) => theme.id);

assert.equal(AUDIO_THEMES.length, 4, '应提供四套完整声音方案');
assert.equal(new Set(ids).size, ids.length, '声音方案 ID 不得重复');
assert.equal(isAudioThemeId(DEFAULT_AUDIO_THEME), true, '默认声音方案必须有效');
assert.equal(getAudioTheme('strings').name, '弦乐庆典', '应能按 ID 找到声音方案');

AUDIO_THEMES.filter((theme) => theme.id !== 'synth').forEach((theme) => {
  cues.forEach((cue) => {
    assert.ok(theme.tracks?.[cue]?.src.startsWith('/audio/'), `${theme.name} 缺少 ${cue} 音频`);
  });
});

assert.equal(getAudioTheme('synth').tracks, undefined, '原创合成方案不应依赖外部音频文件');

console.log('audioThemes: 9 checks passed');
