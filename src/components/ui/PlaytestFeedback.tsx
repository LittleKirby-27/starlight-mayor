import { useState } from 'react';
import { CheckCircle2, Send, Star, X } from 'lucide-react';
import { submitPlaytestFeedback, type PlaytestFeedbackInput } from '../../db/analytics';

export function PlaytestFeedback({ currentLevel, onClose }: { currentLevel: number; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState<PlaytestFeedbackInput['difficulty']>('balanced');
  const [favoriteFeature, setFavoriteFeature] = useState('');
  const [bugNotes, setBugNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [savedOffline, setSavedOffline] = useState(false);

  const submit = async () => {
    if (rating < 1 || status === 'sending') return;
    setStatus('sending');
    const payload: PlaytestFeedbackInput = { rating, difficulty, favoriteFeature, bugNotes, currentLevel };
    try {
      const result = await submitPlaytestFeedback(payload);
      if (!result.saved) {
        const previous = JSON.parse(window.localStorage.getItem('starlight-mayor-feedback') ?? '[]') as unknown[];
        window.localStorage.setItem('starlight-mayor-feedback', JSON.stringify([...previous, { ...payload, createdAt: new Date().toISOString() }]));
        setSavedOffline(true);
      }
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-[#020613]/80 p-4 backdrop-blur-md">
      <div className="glass-panel w-full max-w-xl p-6 text-white">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">3–5 人试玩计划</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">匿名试玩反馈</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">不收集姓名、邮箱或联系方式。请只填写游戏体验和问题。</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭试玩反馈"><X size={18} /></button>
        </div>

        {status === 'sent' ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <CheckCircle2 size={46} className="mb-4 text-emerald-300" />
            <h3 className="text-xl font-bold">感谢你的试玩</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-300">{savedOffline ? '反馈已保存在这台设备上；连接 Supabase 后可统一收集。' : '反馈已安全提交到试玩数据表。'}</p>
            <button className="primary-button mt-6" onClick={onClose}>完成</button>
          </div>
        ) : (
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-sm font-bold">整体体验</legend>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    className={`rounded-xl border p-2 transition ${value <= rating ? 'border-amber-300 bg-amber-300/15 text-amber-200' : 'border-white/10 text-slate-500 hover:border-white/30'}`}
                    onClick={() => setRating(value)}
                    aria-label={`${value} 星`}
                  >
                    <Star size={24} fill={value <= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">难度感受</span>
              <select className="form-field" value={difficulty} onChange={(event) => setDifficulty(event.target.value as PlaytestFeedbackInput['difficulty'])}>
                <option value="too_easy">偏简单</option>
                <option value="balanced">刚刚好</option>
                <option value="too_hard">偏困难</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">最喜欢的部分</span>
              <input className="form-field" maxLength={120} value={favoriteFeature} onChange={(event) => setFavoriteFeature(event.target.value)} placeholder="例如：银河出现、建造模型、政策选择" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">发现的 Bug 或建议</span>
              <textarea className="form-field min-h-24 resize-none" maxLength={1000} value={bugNotes} onChange={(event) => setBugNotes(event.target.value)} placeholder="请写清楚：做了什么、发生了什么、你期待什么" />
            </label>

            {status === 'error' && <p className="text-sm text-red-300">提交暂时失败，请检查网络后重试；内容仍保留在表单中。</p>}
            <button className="primary-button w-full" disabled={rating < 1 || status === 'sending'} onClick={submit}>
              <Send size={17} />
              {status === 'sending' ? '正在提交…' : '提交匿名反馈'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
