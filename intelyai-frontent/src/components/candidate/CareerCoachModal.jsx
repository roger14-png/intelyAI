import React, { useState } from 'react';

export default function CareerCoachModal({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your IntelyAI Coach. How can I assist with your career readiness or resume strategy today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'I recommend targeting GraphQL projects to elevate your readiness score to over 90%!' }
      ]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl flex flex-col h-[450px]">
      <div className="p-4 border-b border-slate-100 dark:border-dark-border flex justify-between items-center bg-brand-blue/5 rounded-t-2xl">
        <span className="text-xs font-bold text-brand-blue dark:text-brand-cyan uppercase">💬 IntelyAI Coach</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-xl max-w-[85%] ${m.role === 'user' ? 'bg-brand-blue text-white ml-auto' : 'bg-slate-100 dark:bg-dark-bg text-slate-800 dark:text-slate-200'}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-slate-100 dark:border-dark-border flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a career question..."
          className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border dark:bg-dark-bg focus:outline-none"
        />
        <button onClick={handleSend} className="px-3 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold">
          Send
        </button>
      </div>
    </div>
  );
}