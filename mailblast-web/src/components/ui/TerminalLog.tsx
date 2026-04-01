'use client';

import { useEffect, useState, useRef } from 'react';

type LogEvent = {
  status: 'sent' | 'opened' | 'failed' | 'skipped';
  email: string;
  website: string;
  error?: string;
  time: string;
};

export function TerminalLog() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/live-log`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping') return;
        setLogs(prev => [...prev, {
          ...data,
          time: new Date().toLocaleTimeString()
        }].slice(-100));
      } catch (e) {
        console.error('WebSocket parse error', e);
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-[#F2F3F5] border border-[#E8E9EC] rounded-xl p-4 h-[400px] overflow-y-auto font-mono text-[11px] leading-relaxed custom-scrollbar">
      <div className="text-[#8D909C] mb-4">LIVE LOG ESTABLISHED...</div>
      {logs.map((log, i) => (
        <div key={i} className="flex gap-4">
          <span className="text-[#8D909C]">[{log.time}]</span>
          {log.status === 'sent' && <span className="text-[#1297FD]">→ SENT</span>}
          {log.status === 'opened' && <span className="text-[#22C55E]">★ OPENED</span>}
          {log.status === 'failed' && <span className="text-[#EF4444]">✗ FAILED</span>}
          {log.status === 'skipped' && <span className="text-[#8D909C]">· SKIPPED</span>}
          <span className="text-[#0C0D10] w-[200px] truncate">{log.email}</span>
          <span className="text-[#8D909C] w-[150px] truncate">({log.website})</span>
          {log.error && <span className="text-[#EF4444]/70 truncate">{log.error}</span>}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
