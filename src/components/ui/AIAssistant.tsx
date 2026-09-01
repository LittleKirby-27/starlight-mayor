import { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { LEVELS, POLICY_CONFIG, useGameStore } from '../../store/gameStore';
import { getSupabase } from '../../db/supabase';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: '市长您好。我会根据当前关卡、指标和已发布政策，给出 2-3 个治理方向。' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const state = useGameStore();
  const level = LEVELS.find((item) => item.id === state.currentLevel);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const localAdvice = () => {
    const tips: string[] = [];
    if (state.money < 250) tips.push('财政偏紧，先补一两个商业区或选择能增加收入的事件选项。');
    if (state.environment < 50) tips.push('环境压力较大，优先公园、风电、垃圾分类或碳排放预算。');
    if (state.stars < (level?.targetStars ?? 60)) tips.push('星空不足，LED 路灯、控制夜间照明和关灯一小时收益最快。');
    if (state.satisfaction < 45) tips.push('满意度偏低，可以补医院、学校、公园，避免连续发布牺牲满意度的政策。');
    if (tips.length === 0) tips.push('当前状态比较稳，围绕本关硬性目标补建筑数量即可。');
    return tips.slice(0, 3).join('\n');
  };

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setMessages((current) => [...current, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    const contextMessage = `
当前关卡：${level?.name}
目标：${level?.desc}
财政：${state.money}
环境：${state.environment}/100
星空：${state.stars}/100
满意度：${state.satisfaction}/100
剩余时间：${state.timeLeft} 秒
已发布政策：${state.activePolicies.map((id) => POLICY_CONFIG[id]?.name ?? id).join('、') || '无'}
建筑总数：${state.buildings.length}
玩家问题：${userMessage}
请给出简短、具体的 2-3 条建议。`;

    try {
      const supabase = await getSupabase();
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase.functions.invoke('minimax-m3', {
        body: {
          model: 'MiniMax-M3',
          thinking: { type: 'disabled' },
          messages: [
            { role: 'system', content: '你是《星光市长：重建夜空》游戏中的市政与环保顾问。' },
            { role: 'user', content: contextMessage },
          ],
          max_completion_tokens: 200,
        },
      });
      if (error) throw error;
      const reply = data?.choices?.[0]?.message?.content || localAdvice();
      setMessages((current) => [...current, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((current) => [...current, { role: 'assistant', content: localAdvice() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        className="game-assistant-button absolute bottom-6 left-6 z-20 rounded-full border border-cyan-200/40 bg-[#07101d]/90 p-4 text-cyan-100 shadow-[0_0_18px_rgba(103,232,249,0.18)] transition-transform hover:scale-105"
        onClick={() => setIsOpen(true)}
        title="打开 AI 建议"
      >
        <MessageCircle size={24} />
      </button>

      {isOpen && (
        <div className="game-assistant-panel absolute bottom-24 left-6 z-30 flex h-[400px] w-80 flex-col rounded-2xl border border-white/20 bg-[#07101d]/94 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Bot size={18} />
              市长顾问
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 transition-colors hover:text-white" title="关闭">
              <X size={18} />
            </button>
          </div>

          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] whitespace-pre-line rounded-sm p-3 text-sm ${message.role === 'user' ? 'bg-amber-300 text-black' : 'border border-white/10 bg-white/10 text-slate-200'}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-sm text-slate-400">正在分析当前城市状态...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 border-t border-white/10 p-3">
            <input
              className="min-w-0 flex-1 rounded-sm border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-300"
              placeholder="询问下一步建议..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSend();
              }}
            />
            <button className="rounded-sm bg-amber-300 p-2 text-black transition-opacity disabled:opacity-50" onClick={handleSend} disabled={isLoading || !input.trim()} title="发送">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
