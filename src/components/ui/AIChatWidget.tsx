import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { useAIChat } from '../../hooks/useAIChat';
import { Theme } from '../../types';

interface AIChatWidgetProps {
  token: string;
  temperature: number;
  humidity: number;
  inventory: { name: string }[];
  currentMode: string;
  onApplyMode: (mode: string) => void;
  darkMode: boolean;
  theme: Theme;
}

export function AIChatWidget({ token, temperature, humidity, inventory, currentMode, onApplyMode, darkMode, theme }: AIChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, loading, sendMessage } = useAIChat(token);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    const action = await sendMessage(text, { temperature, humidity, inventory: inventory.slice(0, 15), currentMode });
    if (action?.type === 'setMode') onApplyMode(action.mode);
  };

  if (!token) return null;

  return (
    <>
      <button onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-sky-600 shadow-2xl shadow-purple-500/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
        aria-label={open ? 'Close chat' : 'Open AI chat'}>
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div className={`fixed bottom-24 right-5 z-40 w-[calc(100vw-2.5rem)] sm:w-96 max-h-[70vh] rounded-2xl shadow-2xl border flex flex-col animate-scale-in ${darkMode ? 'bg-slate-800 border-purple-500/30' : 'bg-white border-purple-200'}`}>
          <div className="flex items-center gap-2 p-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-600/10 to-sky-600/10 rounded-t-2xl">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <p className={`text-sm font-semibold ${theme.text}`}>Fridge Assistant</p>
              <p className={`text-[10px] ${theme.textMuted}`}>Ask about your food, or say "switch to party mode"</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
            {messages.length === 0 && (
              <p className={`text-xs text-center py-8 ${theme.textMuted}`}>👋 Ask me what to cook, or ask me to change modes.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-down`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-sky-500 text-white rounded-br-sm' : darkMode ? 'bg-slate-700 text-slate-100 rounded-bl-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className={`px-3 py-2 rounded-2xl rounded-bl-sm flex gap-1 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-purple-500/10 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything…" className={`flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900'}`} />
            <button onClick={handleSend} disabled={loading || !input.trim()} className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-40"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </>
  );
}