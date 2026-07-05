import { useState, useCallback } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';

export interface ChatMessage { role: 'user' | 'assistant'; text: string; timestamp: number; }
export interface ChatAction { type: 'setMode'; mode: string; }

export function useAIChat(token: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (
    text: string,
    context: { temperature: number; humidity: number; inventory: { name: string }[]; currentMode: string }
  ): Promise<ChatAction | null> => {
    if (!token || !text.trim()) return null;
    const userMsg: ChatMessage = { role: 'user', text: text.trim(), timestamp: Date.now() };
    const historyForRequest = [...messages, userMsg].slice(-10).map(m => ({ role: m.role, text: m.text }));
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/ai?action=chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ history: historyForRequest, context }) });
      const d = await r.json();
      setMessages(prev => [...prev, { role: 'assistant', text: d.reply || '…', timestamp: Date.now() }]);
      return d.action ?? null;
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: "⚠️ Sorry, I couldn't respond just now — try again?", timestamp: Date.now() }]);
      return null;
    } finally { setLoading(false); }
  }, [token, messages]);

  return { messages, loading, sendMessage };
}